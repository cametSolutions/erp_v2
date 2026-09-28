import mongoose from "mongoose";
import request from "supertest";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import app from "../../app.js";
import CashBankLedger from "../../Model/CashBankLedger.js";
import Outstanding from "../../Model/outstandingShcema.js";
import PartyLedger from "../../Model/PartyLedger.js";
import PartyMonthlyBalance from "../../Model/PartyMonthlyBalance.js";
import Receipt from "../../Model/Receipt.js";
import TransactionCounter from "../../Model/TransactionCounter.js";
import VoucherSeries from "../../Model/VoucherSeriesSchema.js";
import VoucherTimeline from "../../Model/VoucherTimeline.js";
import { createTestCompany } from "../helpers/company.js";
import {
  createAccountGroup,
  createTestParty,
  setupIntegrationTestContext,
} from "../helpers/party.js";
import { loginAndGetAuthContext } from "../helpers/user.js";
import * as voucherTimelineService from "../../services/voucherTimeline.service.js";

let baseContext = null;
const BASE_USER = {
  userName: "Receipt Admin",
  mobileNumber: "9000000011",
  email: "receipt-admin@example.com",
};

const BASE_COMPANY = {
  name: "Receipt Company",
  email: "receipt-company@example.com",
  mobile: "9100000011",
  gstNum: "32ABCDE1234F1Z1",
  pan: "ABCDE1234K",
  website: "https://receipt-company.example",
};

async function createTestSeries(companyId, voucherType) {
  const seriesEntry = {
    _id: new mongoose.Types.ObjectId(),
    seriesName: "Primary Receipt Series",
    prefix: "RCP",
    suffix: "2025-26",
    currentNumber: 1,
    widthOfNumericalPart: 2,
    isDefault: false,
    currentlySelected: true,
    lastUsedNumber: 1,
  };

  const voucherSeries = await VoucherSeries.findOne({
    cmp_id: companyId,
    voucherType,
    primary_user_id: baseContext.user._id,
  });

  voucherSeries.series.forEach((series) => {
    series.currentlySelected = false;
  });
  voucherSeries.series.push(seriesEntry);
  await voucherSeries.save();

  return {
    voucherSeriesId: voucherSeries._id,
    seriesId: seriesEntry._id,
    seriesName: seriesEntry.seriesName,
  };
}

function buildValidReceiptPayload(partyId, seriesId, cashBankId, overrides = {}) {
  return {
    cmp_id: String(baseContext.companyId),
    request_id: new mongoose.Types.ObjectId().toString(),
    voucher_type: "receipt",
    transactionDate: "2026-06-29T00:00:00.000Z",
    series_id: String(seriesId),
    party_id: String(partyId),
    party_name: baseContext.party.partyName,
    cash_bank_id: String(cashBankId),
    cash_bank_name: baseContext.cashAccount.partyName,
    cash_bank_type: baseContext.cashAccount.partyType,
    instrument_type: "cash",
    amount: 500,
    settlement_details: [],
    narration: null,
    ...overrides,
  };
}

async function createOwnedCompany(token, label) {
  const overridesByLabel = {
    "Forbidden Company": {
      name: "Receipt Forbidden Company",
      email: "receipt-forbidden-company@example.com",
      mobile: "9100000012",
      gstNum: "32ABCDE1234F1Z2",
      pan: "ABCDE1234L",
      website: "https://receipt-forbidden-company.example",
    },
    "Other Party Company": {
      name: "Receipt Other Party Company",
      email: "receipt-other-party-company@example.com",
      mobile: "9100000013",
      gstNum: "32ABCDE1234F1Z3",
      pan: "ABCDE1234M",
      website: "https://receipt-other-party-company.example",
    },
    "Other Cash Company": {
      name: "Receipt Other Cash Company",
      email: "receipt-other-cash-company@example.com",
      mobile: "9100000014",
      gstNum: "32ABCDE1234F1Z4",
      pan: "ABCDE1234N",
      website: "https://receipt-other-cash-company.example",
    },
    "Fetch Scope Company": {
      name: "Receipt Fetch Scope Company",
      email: "receipt-fetch-scope-company@example.com",
      mobile: "9100000015",
      gstNum: "32ABCDE1234F1Z5",
      pan: "ABCDE1234P",
      website: "https://receipt-fetch-scope-company.example",
    },
  };

  const res = await createTestCompany(token, overridesByLabel[label]);

  return {
    response: res,
    company: res.body.company,
    companyId: new mongoose.Types.ObjectId(res.body.company._id),
  };
}

async function createOutstandingForParty({
  cmp_id = baseContext.companyId,
  party = baseContext.party,
  accountGroup = baseContext.accountGroup,
  billNo = "INV-001",
  billAmount = 300,
  pendingAmount = 300,
  classification = "dr",
} = {}) {
  return Outstanding.create({
    Primary_user_id: baseContext.userId,
    cmp_id,
    accountGroup: accountGroup._id,
    subGroup: party.subGroup || null,
    party_name: party.partyName,
    alias: null,
    party_id: party._id,
    mobile_no: party.mobileNumber || null,
    email: party.emailID || null,
    bill_date: new Date("2026-06-15T00:00:00.000Z"),
    bill_no: billNo,
    billId: new mongoose.Types.ObjectId().toString(),
    bill_amount: billAmount,
    bill_due_date: new Date("2026-06-30T00:00:00.000Z"),
    bill_pending_amt: pendingAmount,
    classification,
    createdBy: String(baseContext.userId),
    source: "sale",
  });
}

function buildSettlement(outstanding, settledAmount, overrides = {}) {
  const previousAmount = Number(outstanding.bill_pending_amt) || 0;

  return {
    outstanding: outstanding._id.toString(),
    outstanding_number: outstanding.bill_no,
    outstanding_date: outstanding.bill_date.toISOString(),
    outstanding_type: outstanding.classification,
    previous_outstanding_amount: previousAmount,
    settled_amount: settledAmount,
    remaining_outstanding_amount: previousAmount - settledAmount,
    ...overrides,
  };
}

async function expectNoReceiptAccountingSideEffects(outstandings = []) {
  const [
    receiptCount,
    partyLedgerCount,
    monthlyBalanceCount,
    cashBankLedgerCount,
    timelineCount,
    counterCount,
    seriesDocument,
  ] = await Promise.all([
    Receipt.countDocuments({ cmp_id: baseContext.companyId }),
    PartyLedger.countDocuments({ cmp_id: baseContext.companyId }),
    PartyMonthlyBalance.countDocuments({ cmp_id: baseContext.companyId }),
    CashBankLedger.countDocuments({ cmp_id: baseContext.companyId }),
    VoucherTimeline.countDocuments({ cmp_id: baseContext.companyId }),
    TransactionCounter.countDocuments({
      cmp_id: baseContext.companyId,
      transaction_type: "receipt",
    }),
    VoucherSeries.findOne({
      cmp_id: baseContext.companyId,
      voucherType: "receipt",
    }).lean(),
  ]);

  expect(receiptCount).toBe(0);
  expect(partyLedgerCount).toBe(0);
  expect(monthlyBalanceCount).toBe(0);
  expect(cashBankLedgerCount).toBe(0);
  expect(timelineCount).toBe(0);
  expect(counterCount).toBe(0);

  const selectedSeries = seriesDocument.series.find(
    (series) => String(series._id) === String(baseContext.series.seriesId),
  );
  expect(selectedSeries.currentNumber).toBe(1);
  expect(selectedSeries.lastUsedNumber).toBe(1);

  for (const original of outstandings) {
    const current = await Outstanding.findById(original._id).lean();
    expect(current.bill_pending_amt).toBe(original.bill_pending_amt);
    expect(current.classification).toBe(original.classification);
  }
}

async function getReceiptAccountingCounts(companyId = baseContext.companyId) {
  const [receipts, partyLedgers, monthlyBalances, cashBankLedgers, timelines] =
    await Promise.all([
      Receipt.countDocuments({ cmp_id: companyId }),
      PartyLedger.countDocuments({ cmp_id: companyId }),
      PartyMonthlyBalance.countDocuments({ cmp_id: companyId }),
      CashBankLedger.countDocuments({ cmp_id: companyId }),
      VoucherTimeline.countDocuments({ cmp_id: companyId }),
    ]);

  return {
    receipts,
    partyLedgers,
    monthlyBalances,
    cashBankLedgers,
    timelines,
  };
}

async function bootstrapBaseContext() {
  const context = await setupIntegrationTestContext({
    loginAndGetAuthContext,
    createTestCompany,
    userOverrides: BASE_USER,
    companyOverrides: BASE_COMPANY,
  });

  const accountGroup = await createAccountGroup({
    cmp_id: context.company._id,
    Primary_user_id: context.user._id,
    accountGroup: "Sundry Debtors",
    accountGroup_id: "AG-RCPT-PARTY",
  });

  const cashAccountGroup = await createAccountGroup({
    cmp_id: context.company._id,
    Primary_user_id: context.user._id,
    accountGroup: "Cash-in-Hand",
    accountGroup_id: "AG-RCPT-CASH",
  });

  const bankAccountGroup = await createAccountGroup({
    cmp_id: context.company._id,
    Primary_user_id: context.user._id,
    accountGroup: "Bank Accounts",
    accountGroup_id: "AG-RCPT-BANK",
  });

  const party = await createTestParty({
    cmp_id: context.company._id,
    Primary_user_id: context.user._id,
    accountGroup: accountGroup._id,
    created_by: context.user._id,
    partyName: "Base Receipt Party",
    mobileNumber: "9876500001",
    gstNo: "32ABCDE1234F1Z8",
    billingAddress: "12 Receipt Street",
    shippingAddress: "12 Receipt Street",
    state: "Kerala",
  });

  const cashAccount = await createTestParty({
    cmp_id: context.company._id,
    Primary_user_id: context.user._id,
    accountGroup: cashAccountGroup._id,
    created_by: context.user._id,
    partyName: "Main Cash Account",
    partyType: "cash",
    mobileNumber: "9876500002",
    gstNo: "",
    billingAddress: "Company Cash Desk",
    shippingAddress: "Company Cash Desk",
    state: "Kerala",
  });

  const bankAccount = await createTestParty({
    cmp_id: context.company._id,
    Primary_user_id: context.user._id,
    accountGroup: bankAccountGroup._id,
    created_by: context.user._id,
    partyName: "Main Bank Account",
    partyType: "bank",
    bank_name: "HDFC Bank",
    ac_no: "1234567890",
    state: "Kerala",
  });

  baseContext = {
    ...context,
    userId: context.user._id,
    accountGroup,
    cashAccountGroup,
    bankAccountGroup,
    party,
    cashAccount,
    bankAccount,
  };

  baseContext.series = await createTestSeries(baseContext.companyId, "receipt");
  return baseContext;
}

async function postReceipt(token, body) {
  return request(app)
    .post("/api/cash-transactions")
    .set("Authorization", `Bearer ${token}`)
    .send(body);
}

async function createReceiptForTest(overrides = {}) {
  const payload = buildValidReceiptPayload(
    baseContext.party._id,
    baseContext.series.seriesId,
    baseContext.cashAccount._id,
    overrides,
  );

  const res = await postReceipt(baseContext.token, payload);

  expect(res.status).toBe(201);
  return res;
}

function cancelReceiptRequest(receiptId, body = {}, token = baseContext.token) {
  return request(app)
    .put(`/api/cash-transactions/${receiptId}/cancel`)
    .set("Authorization", `Bearer ${token}`)
    .send({
      cmp_id: String(baseContext.companyId),
      ...body,
    });
}

function getReceiptRequest(receiptId, companyId = baseContext.companyId, token = baseContext.token) {
  return request(app)
    .get(`/api/cash-transactions/${receiptId}`)
    .set("Authorization", `Bearer ${token}`)
    .query({ cmp_id: String(companyId) });
}

beforeAll(async () => {
  baseContext = null;
});

beforeEach(async () => {
  await bootstrapBaseContext();
});

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(async () => {
  baseContext = null;
});

describe("POST /api/cash-transactions - Auth & middleware", () => {
  it("No token -> 401", async () => {
    const res = await request(app)
      .post("/api/cash-transactions")
      .send(
        buildValidReceiptPayload(
          baseContext.party._id,
          baseContext.series.seriesId,
          baseContext.cashAccount._id,
        ),
      );

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Not authorized, no token");
  });

  it("Invalid/expired token -> 401", async () => {
    const res = await request(app)
      .post("/api/cash-transactions")
      .set("Authorization", "Bearer invalid-token")
      .send(
        buildValidReceiptPayload(
          baseContext.party._id,
          baseContext.series.seriesId,
          baseContext.cashAccount._id,
        ),
      );

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Not authorized, token failed");
  });

  it('Missing cmp_id in body -> 400 "cmp_id is required"', async () => {
    const payload = buildValidReceiptPayload(
      baseContext.party._id,
      baseContext.series.seriesId,
      baseContext.cashAccount._id,
    );
    delete payload.cmp_id;

    const res = await postReceipt(baseContext.token, payload);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("cmp_id is required");
  });

  it("cmp_id for a company the user does not own -> 403", async () => {
    const otherAuth = await loginAndGetAuthContext({
      userOverrides: {
        userName: "Receipt Other Owner",
        mobileNumber: "9000000012",
        email: "receipt-other-owner@example.com",
      },
    });
    const otherCompany = await createOwnedCompany(otherAuth.token, "Forbidden Company");

    const res = await postReceipt(
      baseContext.token,
      buildValidReceiptPayload(
        baseContext.party._id,
        baseContext.series.seriesId,
        baseContext.cashAccount._id,
        {
          cmp_id: String(otherCompany.companyId),
        },
      ),
    );

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Access denied for this company");
  });
});

describe("POST /api/cash-transactions - Validation failures", () => {
  it("Missing series_id -> 400 required fields error", async () => {
    const payload = buildValidReceiptPayload(
      baseContext.party._id,
      baseContext.series.seriesId,
      baseContext.cashAccount._id,
    );
    delete payload.series_id;

    const res = await postReceipt(baseContext.token, payload);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe(
      "Missing required fields",
    );
  });

  it('voucher_type other than receipt -> 400 "Only receipt is supported right now"', async () => {
    const res = await postReceipt(
      baseContext.token,
      buildValidReceiptPayload(
        baseContext.party._id,
        baseContext.series.seriesId,
        baseContext.cashAccount._id,
        {
          voucher_type: "payment",
        },
      ),
    );

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Only receipt is supported right now");
  });

  it("Amount 0 is treated as missing by the controller required-fields check -> 400 required fields error", async () => {
    const res = await postReceipt(
      baseContext.token,
      buildValidReceiptPayload(
        baseContext.party._id,
        baseContext.series.seriesId,
        baseContext.cashAccount._id,
        {
          amount: 0,
        },
      ),
    );

    expect(res.status).toBe(400);
    expect(res.body.message).toBe(
      "Missing required fields",
    );
  });
});

describe("POST /api/cash-transactions - Company ownership failures", () => {
  it('Party from a different company -> 400 "Selected party does not belong to this company"', async () => {
    const otherCompany = await createOwnedCompany(baseContext.token, "Other Party Company");
    const otherAccountGroup = await createAccountGroup({
      cmp_id: otherCompany.companyId,
      Primary_user_id: baseContext.userId,
      accountGroup: "Sundry Debtors",
      accountGroup_id: "AG-RCPT-OTHER-PARTY",
    });
    const otherParty = await createTestParty({
      cmp_id: otherCompany.companyId,
      Primary_user_id: baseContext.userId,
      accountGroup: otherAccountGroup._id,
      created_by: baseContext.userId,
      partyName: "Foreign Receipt Party",
    });

    const res = await postReceipt(
      baseContext.token,
      buildValidReceiptPayload(
        otherParty._id,
        baseContext.series.seriesId,
        baseContext.cashAccount._id,
        {
          party_id: String(otherParty._id),
          party_name: otherParty.partyName,
        },
      ),
    );

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Selected party does not belong to this company");
  });

  it('Cash/bank ledger from a different company -> 400 "Selected cash/bank ledger does not belong to this company"', async () => {
    const otherCompany = await createOwnedCompany(baseContext.token, "Other Cash Company");
    const otherCashAccountGroup = await createAccountGroup({
      cmp_id: otherCompany.companyId,
      Primary_user_id: baseContext.userId,
      accountGroup: "Cash-in-Hand",
      accountGroup_id: "AG-RCPT-OTHER-CASH",
    });
    const otherCashAccount = await createTestParty({
      cmp_id: otherCompany.companyId,
      Primary_user_id: baseContext.userId,
      accountGroup: otherCashAccountGroup._id,
      created_by: baseContext.userId,
      partyName: "Foreign Cash Ledger",
      partyType: "cash",
    });

    const res = await postReceipt(
      baseContext.token,
      buildValidReceiptPayload(
        baseContext.party._id,
        baseContext.series.seriesId,
        otherCashAccount._id,
        {
          cash_bank_id: String(otherCashAccount._id),
          cash_bank_name: otherCashAccount.partyName,
          cash_bank_type: "cash",
        },
      ),
    );

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Selected cash/bank ledger does not belong to this company");
  });



  

// The service validates the cash/bank ledger with two conditions — both must match:

// js
// // server looks for a party where:
// {
//   _id: cash_bank_id,          // ← the ID you sent
//   cmp_id: cmp_id,             // ← must belong to this company
//   partyType: cash_bank_type,  // ← must match the type you sent
// }
// So the lookup becomes:

// js
// {
//   _id: baseContext.cashAccount._id,   // ✅ exists
//   cmp_id: baseContext.companyId,      // ✅ correct company
//   partyType: "bank",                  // ❌ actual is "cash", not "bank"
// }
// MongoDB finds nothing because the partyType doesn't match — so the server returns:
// 400 "Selected cash/bank ledger does not belong to this company"
  it('Cash/bank ledger with wrong partyType -> 400 "Selected cash/bank ledger does not belong to this company"', async () => {
    const res = await postReceipt(
      baseContext.token,
      buildValidReceiptPayload(
        baseContext.party._id,
        baseContext.series.seriesId,
        baseContext.cashAccount._id,
        {
          cash_bank_type: "bank",
        },
      ),
    );

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Selected cash/bank ledger does not belong to this company");
  });
});

describe("POST /api/cash-transactions - Party and instrument validation", () => {
  it.each([
    ["cash", () => baseContext.cashAccount],
    ["bank", () => baseContext.bankAccount],
  ])("rejects a %s master as the Receipt payer", async (_label, getParty) => {
    const invalidParty = getParty();
    const res = await postReceipt(
      baseContext.token,
      buildValidReceiptPayload(
        invalidParty._id,
        baseContext.series.seriesId,
        baseContext.cashAccount._id,
        { party_name: invalidParty.partyName },
      ),
    );

    expect(res.status).toBe(400);
    expect(res.body.message).toBe(
      "Selected receipt party must be a customer or business party",
    );
  });

  it("rejects a cash instrument with a bank account", async () => {
    const res = await postReceipt(
      baseContext.token,
      buildValidReceiptPayload(
        baseContext.party._id,
        baseContext.series.seriesId,
        baseContext.bankAccount._id,
        {
          cash_bank_id: String(baseContext.bankAccount._id),
          cash_bank_name: baseContext.bankAccount.partyName,
          cash_bank_type: "bank",
          instrument_type: "cash",
        },
      ),
    );

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Cash receipts require a cash account");
  });

  it.each([
    ["upi", {}],
    [
      "cheque",
      {
        cheque_number: "CHQ-001",
        cheque_date: "2026-06-29T00:00:00.000Z",
      },
    ],
  ])("rejects %s with a cash account", async (instrumentType, fields) => {
    const res = await postReceipt(
      baseContext.token,
      buildValidReceiptPayload(
        baseContext.party._id,
        baseContext.series.seriesId,
        baseContext.cashAccount._id,
        {
          instrument_type: instrumentType,
          ...fields,
        },
      ),
    );

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Bank instruments require a bank account");
  });

  it("rejects a cheque without a cheque number", async () => {
    const res = await postReceipt(
      baseContext.token,
      buildValidReceiptPayload(
        baseContext.party._id,
        baseContext.series.seriesId,
        baseContext.bankAccount._id,
        {
          cash_bank_id: String(baseContext.bankAccount._id),
          cash_bank_name: baseContext.bankAccount.partyName,
          cash_bank_type: "bank",
          instrument_type: "cheque",
          cheque_number: "   ",
          cheque_date: "2026-06-29T00:00:00.000Z",
        },
      ),
    );

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Cheque number is required");
  });

  it("rejects a cheque without a valid cheque date", async () => {
    const res = await postReceipt(
      baseContext.token,
      buildValidReceiptPayload(
        baseContext.party._id,
        baseContext.series.seriesId,
        baseContext.bankAccount._id,
        {
          cash_bank_id: String(baseContext.bankAccount._id),
          cash_bank_name: baseContext.bankAccount.partyName,
          cash_bank_type: "bank",
          instrument_type: "cheque",
          cheque_number: "CHQ-001",
          cheque_date: "",
        },
      ),
    );

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Valid cheque date is required");
  });
});

describe("POST /api/cash-transactions - idempotency", () => {
  it("stores request identity and creates all accounting records once", async () => {
    const requestId = "receipt-first-submission";
    const res = await createReceiptForTest({ request_id: requestId });
    const receipt = await Receipt.findById(
      res.body.data.cashTransaction._id,
    ).lean();

    expect(receipt.request_id).toBe(requestId);
    expect(receipt.request_fingerprint).toMatch(/^[a-f0-9]{64}$/);
    expect(await getReceiptAccountingCounts()).toEqual({
      receipts: 1,
      partyLedgers: 1,
      monthlyBalances: 1,
      cashBankLedgers: 1,
      timelines: 1,
    });
  });

  it("returns the existing Receipt for an identical request_id retry", async () => {
    const payload = buildValidReceiptPayload(
      baseContext.party._id,
      baseContext.series.seriesId,
      baseContext.cashAccount._id,
      { request_id: "receipt-identical-retry" },
    );
    const first = await postReceipt(baseContext.token, payload);
    const retry = await postReceipt(baseContext.token, payload);

    expect(first.status).toBe(201);
    expect(first.body.idempotent_replay).toBe(false);
    expect(retry.status).toBe(200);
    expect(retry.body.idempotent_replay).toBe(true);
    expect(retry.body.data.cashTransaction._id).toBe(
      first.body.data.cashTransaction._id,
    );
  });

  it("does not repeat ledger or Outstanding movement during a retry", async () => {
    const outstanding = await createOutstandingForParty({
      billNo: "INV-IDEMPOTENT",
      billAmount: 1000,
      pendingAmount: 1000,
    });
    const payload = buildValidReceiptPayload(
      baseContext.party._id,
      baseContext.series.seriesId,
      baseContext.cashAccount._id,
      {
        request_id: "receipt-no-duplicate-posting",
        amount: 600,
        settlement_details: [buildSettlement(outstanding, 600)],
      },
    );

    await postReceipt(baseContext.token, payload);
    await postReceipt(baseContext.token, payload);

    expect(await getReceiptAccountingCounts()).toEqual({
      receipts: 1,
      partyLedgers: 1,
      monthlyBalances: 1,
      cashBankLedgers: 1,
      timelines: 1,
    });
    expect((await Outstanding.findById(outstanding._id).lean()).bill_pending_amt)
      .toBe(400);
  });

  it("increments voucher series and transaction counters only once on retry", async () => {
    const payload = buildValidReceiptPayload(
      baseContext.party._id,
      baseContext.series.seriesId,
      baseContext.cashAccount._id,
      { request_id: "receipt-one-voucher-number" },
    );

    await postReceipt(baseContext.token, payload);
    await postReceipt(baseContext.token, payload);

    const seriesDocument = await VoucherSeries.findOne({
      cmp_id: baseContext.companyId,
      voucherType: "receipt",
    }).lean();
    const selectedSeries = seriesDocument.series.find(
      (series) => String(series._id) === String(baseContext.series.seriesId),
    );
    const counters = await TransactionCounter.find({
      cmp_id: baseContext.companyId,
      transaction_type: "receipt",
    }).lean();

    expect(selectedSeries.currentNumber).toBe(2);
    expect(selectedSeries.lastUsedNumber).toBe(1);
    expect(counters).toHaveLength(2);
    expect(counters.every((counter) => counter.sequence_value === 1)).toBe(true);
  });

  it("returns 409 when a request_id is reused with a changed payload", async () => {
    const payload = buildValidReceiptPayload(
      baseContext.party._id,
      baseContext.series.seriesId,
      baseContext.cashAccount._id,
      { request_id: "receipt-conflicting-reuse", amount: 500 },
    );
    const first = await postReceipt(baseContext.token, payload);
    const conflict = await postReceipt(baseContext.token, {
      ...payload,
      amount: 700,
    });

    expect(first.status).toBe(201);
    expect(conflict.status).toBe(409);
    expect(conflict.body.message).toContain(
      "request_id has already been used",
    );
    expect(await getReceiptAccountingCounts()).toMatchObject({
      receipts: 1,
      partyLedgers: 1,
      cashBankLedgers: 1,
      timelines: 1,
    });
  });

  it("scopes the same request_id independently to each company", async () => {
    const otherCompany = await createOwnedCompany(
      baseContext.token,
      "Fetch Scope Company",
    );
    const otherPartyGroup = await createAccountGroup({
      cmp_id: otherCompany.companyId,
      Primary_user_id: baseContext.userId,
      accountGroup: "Sundry Debtors",
      accountGroup_id: "AG-RCPT-IDEMPOTENT-PARTY",
    });
    const otherCashGroup = await createAccountGroup({
      cmp_id: otherCompany.companyId,
      Primary_user_id: baseContext.userId,
      accountGroup: "Cash-in-Hand",
      accountGroup_id: "AG-RCPT-IDEMPOTENT-CASH",
    });
    const otherParty = await createTestParty({
      cmp_id: otherCompany.companyId,
      Primary_user_id: baseContext.userId,
      accountGroup: otherPartyGroup._id,
      created_by: baseContext.userId,
      partyName: "Other Company Customer",
    });
    const otherCash = await createTestParty({
      cmp_id: otherCompany.companyId,
      Primary_user_id: baseContext.userId,
      accountGroup: otherCashGroup._id,
      created_by: baseContext.userId,
      partyName: "Other Company Cash",
      partyType: "cash",
    });
    const otherSeries = await createTestSeries(
      otherCompany.companyId,
      "receipt",
    );
    const requestId = "company-scoped-request";

    const first = await postReceipt(
      baseContext.token,
      buildValidReceiptPayload(
        baseContext.party._id,
        baseContext.series.seriesId,
        baseContext.cashAccount._id,
        { request_id: requestId },
      ),
    );
    const second = await postReceipt(
      baseContext.token,
      buildValidReceiptPayload(
        otherParty._id,
        otherSeries.seriesId,
        otherCash._id,
        {
          cmp_id: String(otherCompany.companyId),
          request_id: requestId,
          party_name: otherParty.partyName,
          cash_bank_name: otherCash.partyName,
          cash_bank_type: "cash",
        },
      ),
    );

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(await Receipt.countDocuments({ request_id: requestId })).toBe(2);
  });

  it("uses the unique index to prevent concurrent duplicate accounting", async () => {
    await Receipt.init();
    const outstanding = await createOutstandingForParty({
      billNo: "INV-CONCURRENT-IDEMPOTENCY",
      billAmount: 500,
      pendingAmount: 500,
    });
    const payload = buildValidReceiptPayload(
      baseContext.party._id,
      baseContext.series.seriesId,
      baseContext.cashAccount._id,
      {
        request_id: "receipt-concurrent-request",
        settlement_details: [buildSettlement(outstanding, 500)],
      },
    );

    const responses = await Promise.all([
      postReceipt(baseContext.token, payload),
      postReceipt(baseContext.token, payload),
    ]);

    expect(responses.map((response) => response.status).sort()).toEqual([
      200,
      201,
    ]);
    expect(new Set(
      responses.map((response) => response.body.data.cashTransaction._id),
    ).size).toBe(1);
    expect(await getReceiptAccountingCounts()).toEqual({
      receipts: 1,
      partyLedgers: 1,
      monthlyBalances: 1,
      cashBankLedgers: 1,
      timelines: 1,
    });
    expect((await Outstanding.findById(outstanding._id).lean()).bill_pending_amt)
      .toBe(0);
  });

  it("recovers a successful but unacknowledged submission on retry", async () => {
    const payload = buildValidReceiptPayload(
      baseContext.party._id,
      baseContext.series.seriesId,
      baseContext.cashAccount._id,
      { request_id: "receipt-unacknowledged-success" },
    );

    await postReceipt(baseContext.token, payload);
    const recovered = await postReceipt(baseContext.token, payload);

    expect(recovered.status).toBe(200);
    expect(recovered.body.idempotent_replay).toBe(true);
    expect(await Receipt.countDocuments({
      cmp_id: baseContext.companyId,
      request_id: payload.request_id,
    })).toBe(1);
  });
});

describe("POST /api/cash-transactions - DB side effects (no settlements)", () => {
  it("Receipt document exists in DB with correct cmp_id, series, party_id and cash_bank_id", async () => {
    const res = await createReceiptForTest();

    const receipt = await Receipt.findById(res.body.data.cashTransaction._id).lean();

    expect(receipt).not.toBeNull();
    expect(String(receipt.cmp_id)).toBe(String(baseContext.companyId));
    expect(String(receipt.series_id)).toBe(String(baseContext.series.seriesId));
    expect(receipt.series_name).toBe(baseContext.series.seriesName);
    expect(String(receipt.party_id)).toBe(String(baseContext.party._id));
    expect(String(receipt.cash_bank_id)).toBe(String(baseContext.cashAccount._id));
  });

  it("PartyLedger and CashBankLedger documents are created with correct ledger sides", async () => {
    const res = await createReceiptForTest();

    const partyLedger = await PartyLedger.findOne({
      voucher_id: res.body.data.cashTransaction._id,
      voucher_type: "receipt",
    }).lean();
    const cashBankLedger = await CashBankLedger.findOne({
      voucher_id: res.body.data.cashTransaction._id,
      voucher_type: "receipt",
    }).lean();

    expect(partyLedger).not.toBeNull();
    expect(partyLedger.ledger_side).toBe("credit");
    expect(partyLedger.amount).toBe(500);
    expect(String(partyLedger.party_id)).toBe(String(baseContext.party._id));

    expect(cashBankLedger).not.toBeNull();
    expect(cashBankLedger.direction).toBe("in");
    expect(cashBankLedger.amount).toBe(500);
    expect(String(cashBankLedger.cash_bank_id)).toBe(String(baseContext.cashAccount._id));
  });

  it("PartyMonthlyBalance document created with receipt credit rollup", async () => {
    const res = await createReceiptForTest();

    const receipt = await Receipt.findById(res.body.data.cashTransaction._id).lean();
    const monthKey = `${receipt.date.getUTCFullYear()}-${String(receipt.date.getUTCMonth() + 1).padStart(2, "0")}`;
    const monthlyBalance = await PartyMonthlyBalance.findOne({
      cmp_id: baseContext.companyId,
      party_id: baseContext.party._id,
      month_key: monthKey,
    }).lean();

    expect(monthlyBalance).not.toBeNull();
    expect(monthlyBalance.total_debit).toBe(0);
    expect(monthlyBalance.total_credit).toBe(500);
    expect(monthlyBalance.transaction_count).toBe(1);
    // expect(monthlyBalance.net_amount).toBe(-500);
  });

  it("VoucherTimeline document created with matching voucher_id", async () => {
    const res = await createReceiptForTest();

    const timelineEntry = await VoucherTimeline.findOne({
      voucher_id: res.body.data.cashTransaction._id,
      voucher_type: "receipt",
    }).lean();

    expect(timelineEntry).not.toBeNull();
    expect(String(timelineEntry.voucher_id)).toBe(res.body.data.cashTransaction._id);
  });

  it("VoucherSeries currentNumber incremented by 1", async () => {
    await createReceiptForTest();

    const seriesDoc = await VoucherSeries.findOne({
      cmp_id: baseContext.companyId,
      voucherType: "receipt",
    }).lean();
    const selectedSeries = seriesDoc.series.find(
      (series) => String(series._id) === String(baseContext.series.seriesId),
    );

    expect(selectedSeries.currentNumber).toBe(2);
    expect(selectedSeries.lastUsedNumber).toBe(1);
  });

  it("TransactionCounter incremented for company and user", async () => {
    await createReceiptForTest();

    const counters = await TransactionCounter.find({
      cmp_id: baseContext.companyId,
      transaction_type: "receipt",
    }).lean();

    const companyCounter = counters.find((counter) => counter.scope === "company");
    const userCounter = counters.find((counter) => counter.scope === "user");


    // initially value is 0
    // it is incremented by 1 
    expect(companyCounter?.sequence_value).toBe(1);
    expect(userCounter?.sequence_value).toBe(1);
    expect(String(userCounter.user_id)).toBe(String(baseContext.userId));
  });

  it('status is "active", voucher_number is generated, created_by equals userId from token', async () => {
    const res = await createReceiptForTest();

    const receipt = await Receipt.findById(res.body.data.cashTransaction._id).lean();

    expect(receipt.status).toBe("active");
    expect(receipt.voucher_number).toBe("RCP / 01 / 2025-26");
    expect(String(receipt.created_by)).toBe(String(baseContext.userId));
  });
});

describe("POST /api/cash-transactions - Settlement behaviour", () => {
  it("exact settlement clears Outstanding and posts the full Receipt to both ledgers", async () => {
    const outstanding = await createOutstandingForParty({
      billNo: "INV-SETTLE-001",
      billAmount: 1000,
      pendingAmount: 1000,
    });

    const res = await createReceiptForTest({
      amount: 1000,
      settlement_details: [buildSettlement(outstanding, 1000)],
    });

    const receipt = await Receipt.findById(res.body.data.cashTransaction._id).lean();
    const updatedOutstanding = await Outstanding.findById(outstanding._id).lean();
    const partyLedger = await PartyLedger.findOne({
      voucher_id: receipt._id,
      voucher_type: "receipt",
    }).lean();
    const cashBankLedger = await CashBankLedger.findOne({
      voucher_id: receipt._id,
      voucher_type: "receipt",
    }).lean();
    const advanceOutstanding = await Outstanding.findOne({
      cmp_id: baseContext.companyId,
      billId: res.body.data.cashTransaction._id,
      source: "advance_receipt",
    }).lean();

    expect(receipt.settlement_details).toHaveLength(1);
    expect(receipt.advance_amount).toBe(0);
    expect(updatedOutstanding.bill_pending_amt).toBe(0);
    expect(partyLedger).toMatchObject({ ledger_side: "credit", amount: 1000 });
    expect(cashBankLedger).toMatchObject({ direction: "in", amount: 1000 });
    expect(advanceOutstanding).toBeNull();
  });

  it("partially settles one bill without creating an advance", async () => {
    const outstanding = await createOutstandingForParty({
      billNo: "INV-PARTIAL-ONLY-001",
      billAmount: 1000,
      pendingAmount: 1000,
    });

    const res = await createReceiptForTest({
      amount: 400,
      settlement_details: [buildSettlement(outstanding, 400)],
    });
    const receipt = await Receipt.findById(res.body.data.cashTransaction._id).lean();
    const updatedOutstanding = await Outstanding.findById(outstanding._id).lean();
    const advanceOutstanding = await Outstanding.findOne({
      cmp_id: baseContext.companyId,
      billId: String(receipt._id),
      source: "advance_receipt",
    }).lean();

    expect(updatedOutstanding.bill_pending_amt).toBe(600);
    expect(updatedOutstanding.classification).toBe("dr");
    expect(receipt.advance_amount).toBe(0);
    expect(advanceOutstanding).toBeNull();
  });

  it("settles multiple bills without exceeding the Receipt amount", async () => {
    const billA = await createOutstandingForParty({
      billNo: "INV-MULTI-A",
      billAmount: 700,
      pendingAmount: 700,
    });
    const billB = await createOutstandingForParty({
      billNo: "INV-MULTI-B",
      billAmount: 600,
      pendingAmount: 600,
    });

    const res = await createReceiptForTest({
      amount: 1000,
      settlement_details: [
        buildSettlement(billA, 700),
        buildSettlement(billB, 300),
      ],
    });
    const receipt = await Receipt.findById(res.body.data.cashTransaction._id).lean();
    const [updatedA, updatedB] = await Promise.all([
      Outstanding.findById(billA._id).lean(),
      Outstanding.findById(billB._id).lean(),
    ]);

    expect(updatedA.bill_pending_amt).toBe(0);
    expect(updatedB.bill_pending_amt).toBe(300);
    expect(receipt.advance_amount).toBe(0);
    expect(receipt.settlement_details.map((item) => item.settled_amount)).toEqual([
      700,
      300,
    ]);
  });

  it("supports a partial final bill across three Outstanding rows", async () => {
    const billA = await createOutstandingForParty({
      billNo: "INV-FINAL-A",
      billAmount: 400,
      pendingAmount: 400,
    });
    const billB = await createOutstandingForParty({
      billNo: "INV-FINAL-B",
      billAmount: 500,
      pendingAmount: 500,
    });
    const billC = await createOutstandingForParty({
      billNo: "INV-FINAL-C",
      billAmount: 600,
      pendingAmount: 600,
    });

    await createReceiptForTest({
      amount: 1000,
      settlement_details: [
        buildSettlement(billA, 400),
        buildSettlement(billB, 500),
        buildSettlement(billC, 100),
      ],
    });
    const [updatedA, updatedB, updatedC] = await Promise.all([
      Outstanding.findById(billA._id).lean(),
      Outstanding.findById(billB._id).lean(),
      Outstanding.findById(billC._id).lean(),
    ]);

    expect(updatedA.bill_pending_amt).toBe(0);
    expect(updatedB.bill_pending_amt).toBe(0);
    expect(updatedC.bill_pending_amt).toBe(500);
  });

  it("settles only part of the first bill when the Receipt is smaller", async () => {
    const billA = await createOutstandingForParty({
      billNo: "INV-SMALL-RECEIPT",
      billAmount: 1000,
      pendingAmount: 1000,
    });

    await createReceiptForTest({
      amount: 300,
      settlement_details: [buildSettlement(billA, 300)],
    });
    const updated = await Outstanding.findById(billA._id).lean();

    expect(updated.bill_pending_amt).toBe(700);
  });

  it('Missing outstanding reference -> 400 "Outstanding bill not found for the selected company and party"', async () => {
    const res = await postReceipt(
      baseContext.token,
      buildValidReceiptPayload(
        baseContext.party._id,
        baseContext.series.seriesId,
        baseContext.cashAccount._id,
        {
          settlement_details: [
            {
              outstanding: new mongoose.Types.ObjectId().toString(),
              outstanding_number: "INV-MISSING-001",
              outstanding_date: "2026-06-15T00:00:00.000Z",
              outstanding_type: "dr",
              previous_outstanding_amount: 300,
              settled_amount: 100,
              remaining_outstanding_amount: 200,
            },
          ],
        },
      ),
    );

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Outstanding bill not found for the selected company and party");
  });

  it('Settled amount greater than pending -> 400 "Settled amount cannot exceed the current pending amount"', async () => {
    const outstanding = await createOutstandingForParty({
      billNo: "INV-OVER-001",
      billAmount: 300,
      pendingAmount: 120,
    });

    const res = await postReceipt(
      baseContext.token,
      buildValidReceiptPayload(
        baseContext.party._id,
        baseContext.series.seriesId,
        baseContext.cashAccount._id,
        {
          amount: 200,
          settlement_details: [buildSettlement(outstanding, 150)],
        },
      ),
    );

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Settled amount cannot exceed the current pending amount");
  });

  it("rejects settlement total greater than the Receipt and leaves no accounting side effects", async () => {
    const billA = await createOutstandingForParty({
      billNo: "INV-OVER-TOTAL-A",
      billAmount: 700,
      pendingAmount: 700,
    });
    const billB = await createOutstandingForParty({
      billNo: "INV-OVER-TOTAL-B",
      billAmount: 600,
      pendingAmount: 600,
    });

    const res = await postReceipt(
      baseContext.token,
      buildValidReceiptPayload(
        baseContext.party._id,
        baseContext.series.seriesId,
        baseContext.cashAccount._id,
        {
          amount: 1000,
          settlement_details: [
            buildSettlement(billA, 700),
            buildSettlement(billB, 600),
          ],
        },
      ),
    );

    expect(res.status).toBe(400);
    expect(res.body.message).toBe(
      "Total settled amount cannot exceed receipt amount",
    );
    await expectNoReceiptAccountingSideEffects([billA, billB]);
  });

  it("rejects duplicate Outstanding ids and leaves no accounting side effects", async () => {
    const billA = await createOutstandingForParty({
      billNo: "INV-DUPLICATE",
      billAmount: 1000,
      pendingAmount: 1000,
    });

    const res = await postReceipt(
      baseContext.token,
      buildValidReceiptPayload(
        baseContext.party._id,
        baseContext.series.seriesId,
        baseContext.cashAccount._id,
        {
          amount: 1000,
          settlement_details: [
            buildSettlement(billA, 500),
            buildSettlement(billA, 500, {
              outstanding: billA._id.toString().toUpperCase(),
            }),
          ],
        },
      ),
    );

    expect(res.status).toBe(400);
    expect(res.body.message).toBe(
      "The same outstanding bill cannot be settled more than once",
    );
    await expectNoReceiptAccountingSideEffects([billA]);
  });

  it("rejects an Outstanding belonging to another party", async () => {
    const otherParty = await createTestParty({
      cmp_id: baseContext.companyId,
      Primary_user_id: baseContext.userId,
      accountGroup: baseContext.accountGroup._id,
      created_by: baseContext.userId,
      partyName: "Other Receipt Party",
    });
    const outstanding = await createOutstandingForParty({
      party: otherParty,
      billNo: "INV-WRONG-PARTY",
      billAmount: 300,
      pendingAmount: 300,
    });

    const res = await postReceipt(
      baseContext.token,
      buildValidReceiptPayload(
        baseContext.party._id,
        baseContext.series.seriesId,
        baseContext.cashAccount._id,
        {
          amount: 100,
          settlement_details: [buildSettlement(outstanding, 100)],
        },
      ),
    );

    expect(res.status).toBe(400);
    expect(res.body.message).toBe(
      "Outstanding bill not found for the selected company and party",
    );
  });

  it("rejects an Outstanding belonging to another company", async () => {
    const otherCompany = await createOwnedCompany(
      baseContext.token,
      "Other Party Company",
    );
    const outstanding = await createOutstandingForParty({
      cmp_id: otherCompany.companyId,
      billNo: "INV-WRONG-COMPANY",
      billAmount: 300,
      pendingAmount: 300,
    });

    const res = await postReceipt(
      baseContext.token,
      buildValidReceiptPayload(
        baseContext.party._id,
        baseContext.series.seriesId,
        baseContext.cashAccount._id,
        {
          amount: 100,
          settlement_details: [buildSettlement(outstanding, 100)],
        },
      ),
    );

    expect(res.status).toBe(400);
    expect(res.body.message).toBe(
      "Outstanding bill not found for the selected company and party",
    );
  });

  it("rejects a CR Outstanding as ineligible for Receipt settlement", async () => {
    const outstanding = await createOutstandingForParty({
      billNo: "INV-CREDIT-BALANCE",
      billAmount: 300,
      pendingAmount: -300,
      classification: "cr",
    });

    const res = await postReceipt(
      baseContext.token,
      buildValidReceiptPayload(
        baseContext.party._id,
        baseContext.series.seriesId,
        baseContext.cashAccount._id,
        {
          amount: 100,
          settlement_details: [buildSettlement(outstanding, 100)],
        },
      ),
    );

    expect(res.status).toBe(400);
  });

  it("stores settlement snapshot fields from the current Outstanding record", async () => {
    const outstanding = await createOutstandingForParty({
      billNo: "INV-AUTHORITATIVE",
      billAmount: 900,
      pendingAmount: 900,
    });

    const res = await createReceiptForTest({
      amount: 400,
      settlement_details: [
        buildSettlement(outstanding, 400, {
          outstanding_number: "MANIPULATED-NUMBER",
          outstanding_date: "2000-01-01T00:00:00.000Z",
          outstanding_type: "cr",
          previous_outstanding_amount: 1,
          remaining_outstanding_amount: 99999,
          settlement_date: "2000-01-02T00:00:00.000Z",
        }),
      ],
    });
    const receipt = await Receipt.findById(res.body.data.cashTransaction._id).lean();
    const detail = receipt.settlement_details[0];

    expect(detail.outstanding_number).toBe(outstanding.bill_no);
    expect(detail.outstanding_date.toISOString()).toBe(
      outstanding.bill_date.toISOString(),
    );
    expect(detail.outstanding_type).toBe("dr");
    expect(detail.previous_outstanding_amount).toBe(900);
    expect(detail.settled_amount).toBe(400);
    expect(detail.remaining_outstanding_amount).toBe(500);
    expect(detail.settlement_date.toISOString()).toBe(
      "2026-06-29T00:00:00.000Z",
    );
  });
});

describe("POST /api/cash-transactions - Advance receipt behaviour", () => {
  it("creates a full advance as negative CR Outstanding and party credit", async () => {
    const res = await createReceiptForTest({
      amount: 500,
      settlement_details: [],
    });

    const receipt = await Receipt.findById(res.body.data.cashTransaction._id).lean();
    const advanceOutstanding = await Outstanding.findOne({
      cmp_id: baseContext.companyId,
      billId: res.body.data.cashTransaction._id,
      source: "advance_receipt",
    }).lean();

    expect(receipt.advance_amount).toBe(500);
    expect(advanceOutstanding).not.toBeNull();
    expect(advanceOutstanding.bill_amount).toBe(500);
    expect(advanceOutstanding.bill_pending_amt).toBe(-500);
    expect(advanceOutstanding.classification).toBe("cr");
    expect(advanceOutstanding.source).toBe("advance_receipt");

    const partyRes = await request(app)
      .get("/api/party")
      .set("Authorization", `Bearer ${baseContext.token}`)
      .query({ cmp_id: String(baseContext.companyId), ledgerType: "all" });
    expect(partyRes.status).toBe(200);
    const partySummary = partyRes.body.items.find(
      (item) => item._id === String(baseContext.party._id),
    );
    expect(partySummary.totalReceivable).toBe(0);
    expect(partySummary.totalPayable).toBe(500);
    expect(partySummary.netOutstanding).toBe(-500);
    expect(partySummary.classification).toBe("cr");
  });

  it("settles a bill and creates only the excess as negative CR advance", async () => {
    const outstanding = await createOutstandingForParty({
      billNo: "INV-PARTIAL-001",
      billAmount: 1000,
      pendingAmount: 1000,
    });

    const res = await createReceiptForTest({
      amount: 1200,
      settlement_details: [buildSettlement(outstanding, 1000)],
    });

    const receipt = await Receipt.findById(res.body.data.cashTransaction._id).lean();
    const updatedOutstanding = await Outstanding.findById(outstanding._id).lean();
    const advanceOutstanding = await Outstanding.findOne({
      cmp_id: baseContext.companyId,
      billId: res.body.data.cashTransaction._id,
      source: "advance_receipt",
    }).lean();

    expect(receipt.advance_amount).toBe(200);
    expect(updatedOutstanding.bill_pending_amt).toBe(0);
    expect(advanceOutstanding).not.toBeNull();
    expect(advanceOutstanding.bill_amount).toBe(200);
    expect(advanceOutstanding.bill_pending_amt).toBe(-200);
    expect(advanceOutstanding.classification).toBe("cr");
    expect(advanceOutstanding.source).toBe("advance_receipt");
  });
});

describe("GET /api/cash-transactions/:id", () => {
  it("Valid fetch -> 200, returns correct receiptId", async () => {
    const createRes = await createReceiptForTest();

    const res = await getReceiptRequest(createRes.body.data.cashTransaction._id);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.cashTransaction._id).toBe(createRes.body.data.cashTransaction._id);
  });

  it('Invalid receiptId -> 400 "Invalid id"', async () => {
    const res = await getReceiptRequest("invalid-id");

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid id");
  });

  it("Wrong company receiptId -> 404", async () => {
    const createRes = await createReceiptForTest();
    const otherCompany = await createOwnedCompany(baseContext.token, "Fetch Scope Company");

    const res = await getReceiptRequest(
      createRes.body.data.cashTransaction._id,
      otherCompany.companyId,
    );

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Cash transaction not found");
  });

  it("Non-existent receiptId -> 404", async () => {
    const res = await getReceiptRequest(new mongoose.Types.ObjectId().toString());

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Cash transaction not found");
  });
});

describe("PUT /api/cash-transactions/:id/cancel", () => {
  it('Cancel active receipt -> 200, status becomes "cancelled" and related ledgers are cancelled', async () => {
    const createRes = await createReceiptForTest();

    const res = await cancelReceiptRequest(createRes.body.data.cashTransaction._id, {
      cancellation_reason: "Customer requested reversal",
    });
    const receipt = await Receipt.findById(createRes.body.data.cashTransaction._id).lean();
    const partyLedger = await PartyLedger.findOne({
      voucher_id: createRes.body.data.cashTransaction._id,
      voucher_type: "receipt",
    }).lean();
    const cashBankLedger = await CashBankLedger.findOne({
      voucher_id: createRes.body.data.cashTransaction._id,
      voucher_type: "receipt",
    }).lean();
    const timelineEntry = await VoucherTimeline.findOne({
      voucher_id: createRes.body.data.cashTransaction._id,
      voucher_type: "receipt",
    }).lean();
    const monthlyBalance = await PartyMonthlyBalance.findOne({
      cmp_id: baseContext.companyId,
      party_id: baseContext.party._id,
    }).lean();

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(receipt.status).toBe("cancelled");
    expect(receipt.cancellation_reason).toBe("Customer requested reversal");
    expect(String(receipt.cancelled_by)).toBe(String(baseContext.userId));
    expect(partyLedger.status).toBe("cancelled");
    expect(cashBankLedger.status).toBe("cancelled");
    expect(timelineEntry.status).toBe("cancelled");
    expect(monthlyBalance.total_credit).toBe(0);
    expect(monthlyBalance.transaction_count).toBe(0);
    // expect(monthlyBalance.net_amount).toBe(0);
  });

  it("Cancel settled receipt -> outstanding is restored and advance outstanding is zeroed", async () => {
    const outstanding = await createOutstandingForParty({
      billNo: "INV-CANCEL-001",
      billAmount: 400,
      pendingAmount: 400,
    });

    const createRes = await createReceiptForTest({
      amount: 500,
      settlement_details: [
        {
          outstanding: outstanding._id.toString(),
          outstanding_number: outstanding.bill_no,
          outstanding_date: outstanding.bill_date.toISOString(),
          outstanding_type: outstanding.classification,
          previous_outstanding_amount: 400,
          settled_amount: 250,
          remaining_outstanding_amount: 150,
        },
      ],
    });

    const res = await cancelReceiptRequest(createRes.body.data.cashTransaction._id);
    const updatedOutstanding = await Outstanding.findById(outstanding._id).lean();
    const advanceOutstanding = await Outstanding.findOne({
      cmp_id: baseContext.companyId,
      billId: createRes.body.data.cashTransaction._id,
      source: "advance_receipt",
    }).lean();

    expect(res.status).toBe(200);
    expect(updatedOutstanding.bill_pending_amt).toBe(400);
    expect(updatedOutstanding.classification).toBe("dr");
    expect(advanceOutstanding.bill_amount).toBe(250);
    expect(advanceOutstanding.bill_pending_amt).toBe(0);
    expect(advanceOutstanding.isCancelled).toBe(true);
  });

  it('Cancel already-cancelled receipt -> 400 "receipt is already cancelled"', async () => {
    const createRes = await createReceiptForTest();
    await Receipt.findByIdAndUpdate(createRes.body.data.cashTransaction._id, {
      status: "cancelled",
    });

    const res = await cancelReceiptRequest(createRes.body.data.cashTransaction._id);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("receipt is already cancelled");
  });

  it("restores every allocation when cancelling a multiple-bill Receipt", async () => {
    const billA = await createOutstandingForParty({
      billNo: "INV-CANCEL-MULTI-A",
      billAmount: 300,
      pendingAmount: 300,
    });
    const billB = await createOutstandingForParty({
      billNo: "INV-CANCEL-MULTI-B",
      billAmount: 500,
      pendingAmount: 500,
    });
    const createRes = await createReceiptForTest({
      amount: 700,
      settlement_details: [
        buildSettlement(billA, 300),
        buildSettlement(billB, 400),
      ],
    });

    const res = await cancelReceiptRequest(
      createRes.body.data.cashTransaction._id,
    );

    expect(res.status).toBe(200);
    expect((await Outstanding.findById(billA._id).lean()).bill_pending_amt)
      .toBe(300);
    expect((await Outstanding.findById(billB._id).lean()).bill_pending_amt)
      .toBe(500);
  });

  it("rejects cancellation when the active PartyLedger is missing", async () => {
    const createRes = await createReceiptForTest();
    const receiptId = createRes.body.data.cashTransaction._id;
    await PartyLedger.deleteOne({ voucher_id: receiptId });

    const res = await cancelReceiptRequest(receiptId);

    expect(res.status).toBe(409);
    expect(res.body.message).toContain("PartyLedger is missing or duplicated");
    expect((await Receipt.findById(receiptId).lean()).status).toBe("active");
    expect((await CashBankLedger.findOne({ voucher_id: receiptId }).lean()).status)
      .toBe("active");
  });

  it("rejects cancellation when the active CashBankLedger is missing", async () => {
    const createRes = await createReceiptForTest();
    const receiptId = createRes.body.data.cashTransaction._id;
    await CashBankLedger.deleteOne({ voucher_id: receiptId });

    const res = await cancelReceiptRequest(receiptId);

    expect(res.status).toBe(409);
    expect(res.body.message).toContain(
      "CashBankLedger is missing or duplicated",
    );
    expect((await Receipt.findById(receiptId).lean()).status).toBe("active");
    expect((await PartyLedger.findOne({ voucher_id: receiptId }).lean()).status)
      .toBe("active");
  });

  it("detects duplicate active linked ledgers before reversal", async () => {
    const createRes = await createReceiptForTest();
    const receiptId = createRes.body.data.cashTransaction._id;
    const originalLedger = await PartyLedger.findOne({
      voucher_id: receiptId,
    }).lean();
    const duplicateLedger = { ...originalLedger };
    delete duplicateLedger._id;
    delete duplicateLedger.created_at;
    delete duplicateLedger.updated_at;
    await PartyLedger.create(duplicateLedger);

    const res = await cancelReceiptRequest(receiptId);

    expect(res.status).toBe(409);
    expect(res.body.message).toContain("PartyLedger is missing or duplicated");
    expect((await Receipt.findById(receiptId).lean()).status).toBe("active");
    expect(await PartyLedger.countDocuments({
      voucher_id: receiptId,
      status: "active",
    })).toBe(2);
  });

  it("does not create a negative monthly bucket when the original is missing", async () => {
    const createRes = await createReceiptForTest();
    const receiptId = createRes.body.data.cashTransaction._id;
    await PartyMonthlyBalance.deleteOne({
      cmp_id: baseContext.companyId,
      party_id: baseContext.party._id,
      month_key: "2026-06",
    });

    const res = await cancelReceiptRequest(receiptId);
    const advance = await Outstanding.findOne({
      billId: receiptId,
      source: "advance_receipt",
    }).lean();

    expect(res.status).toBe(409);
    expect(res.body.message).toContain("PartyMonthlyBalance is missing");
    expect(await PartyMonthlyBalance.countDocuments({
      cmp_id: baseContext.companyId,
      party_id: baseContext.party._id,
      month_key: "2026-06",
    })).toBe(0);
    expect((await Receipt.findById(receiptId).lean()).status).toBe("active");
    expect(advance.bill_pending_amt).toBe(-500);
    expect(advance.isCancelled).toBe(false);
  });

  it("reverses only the cancelled Receipt contribution from monthly totals", async () => {
    const first = await createReceiptForTest({ amount: 500 });
    await createReceiptForTest({ amount: 300 });

    const res = await cancelReceiptRequest(first.body.data.cashTransaction._id);
    const monthlyBalance = await PartyMonthlyBalance.findOne({
      cmp_id: baseContext.companyId,
      party_id: baseContext.party._id,
      month_key: "2026-06",
    }).lean();

    expect(res.status).toBe(200);
    expect(monthlyBalance.total_credit).toBe(300);
    expect(monthlyBalance.transaction_count).toBe(1);
  });

  it("does not reverse accounting twice on repeated cancellation", async () => {
    const createRes = await createReceiptForTest();
    const receiptId = createRes.body.data.cashTransaction._id;

    const first = await cancelReceiptRequest(receiptId);
    const second = await cancelReceiptRequest(receiptId);
    const monthlyBalance = await PartyMonthlyBalance.findOne({
      cmp_id: baseContext.companyId,
      party_id: baseContext.party._id,
    }).lean();

    expect(first.status).toBe(200);
    expect(second.status).toBe(400);
    expect(second.body.message).toBe("receipt is already cancelled");
    expect(monthlyBalance.total_credit).toBe(0);
    expect(monthlyBalance.transaction_count).toBe(0);
  });

  it("allows only one concurrent cancellation to reverse accounting", async () => {
    const createRes = await createReceiptForTest();
    const receiptId = createRes.body.data.cashTransaction._id;

    const responses = await Promise.all([
      cancelReceiptRequest(receiptId),
      cancelReceiptRequest(receiptId),
    ]);
    const monthlyBalance = await PartyMonthlyBalance.findOne({
      cmp_id: baseContext.companyId,
      party_id: baseContext.party._id,
    }).lean();
    const advance = await Outstanding.findOne({
      billId: receiptId,
      source: "advance_receipt",
    }).lean();

    expect(responses.map((response) => response.status).sort()).toEqual([
      200,
      400,
    ]);
    expect(monthlyBalance.total_credit).toBe(0);
    expect(monthlyBalance.transaction_count).toBe(0);
    expect(advance.bill_pending_amt).toBe(0);
    expect(advance.isCancelled).toBe(true);
  });
});

describe("Transaction atomicity", () => {
  it("Mock createVoucherTimelineEntry to throw after Receipt.create succeeds", async () => {
    vi
      .spyOn(voucherTimelineService, "createVoucherTimelineEntry")
      .mockRejectedValue(new Error("Timeline creation failed"));

    const res = await postReceipt(
      baseContext.token,
      buildValidReceiptPayload(
        baseContext.party._id,
        baseContext.series.seriesId,
        baseContext.cashAccount._id,
      ),
    );

    const receipts = await Receipt.find({
      cmp_id: baseContext.companyId,
    }).lean();
    const partyLedgers = await PartyLedger.find({
      cmp_id: baseContext.companyId,
    }).lean();
    const cashBankLedgers = await CashBankLedger.find({
      cmp_id: baseContext.companyId,
    }).lean();
    const monthlyBalances = await PartyMonthlyBalance.find({
      cmp_id: baseContext.companyId,
    }).lean();
    const outstandings = await Outstanding.find({
      cmp_id: baseContext.companyId,
    }).lean();
    const counters = await TransactionCounter.find({
      cmp_id: baseContext.companyId,
      transaction_type: "receipt",
    }).lean();
    const seriesDoc = await VoucherSeries.findOne({
      cmp_id: baseContext.companyId,
      voucherType: "receipt",
    }).lean();
    const selectedSeries = seriesDoc.series.find(
      (series) => String(series._id) === String(baseContext.series.seriesId),
    );

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Timeline creation failed");
    expect(receipts).toHaveLength(0);
    expect(partyLedgers).toHaveLength(0);
    expect(cashBankLedgers).toHaveLength(0);
    expect(monthlyBalances).toHaveLength(0);
    expect(outstandings).toHaveLength(0);
    expect(counters).toHaveLength(0);
    expect(selectedSeries.currentNumber).toBe(1);
    expect(selectedSeries.lastUsedNumber).toBe(1);
  });

  it("rolls back every cancellation change when the timeline update fails", async () => {
    const outstanding = await createOutstandingForParty({
      billNo: "INV-CANCEL-ROLLBACK",
      billAmount: 500,
      pendingAmount: 500,
    });
    const createRes = await createReceiptForTest({
      amount: 600,
      settlement_details: [buildSettlement(outstanding, 500)],
    });
    const receiptId = createRes.body.data.cashTransaction._id;
    vi
      .spyOn(voucherTimelineService, "updateVoucherTimelineEntry")
      .mockRejectedValue(new Error("Cancellation timeline failure"));

    const res = await cancelReceiptRequest(receiptId);
    const [receipt, partyLedger, cashBankLedger, monthlyBalance, saleOutstanding, advance] =
      await Promise.all([
        Receipt.findById(receiptId).lean(),
        PartyLedger.findOne({ voucher_id: receiptId }).lean(),
        CashBankLedger.findOne({ voucher_id: receiptId }).lean(),
        PartyMonthlyBalance.findOne({
          cmp_id: baseContext.companyId,
          party_id: baseContext.party._id,
        }).lean(),
        Outstanding.findById(outstanding._id).lean(),
        Outstanding.findOne({
          billId: receiptId,
          source: "advance_receipt",
        }).lean(),
      ]);

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Cancellation timeline failure");
    expect(receipt.status).toBe("active");
    expect(partyLedger.status).toBe("active");
    expect(cashBankLedger.status).toBe("active");
    expect(monthlyBalance.total_credit).toBe(600);
    expect(monthlyBalance.transaction_count).toBe(1);
    expect(saleOutstanding.bill_pending_amt).toBe(0);
    expect(advance.bill_pending_amt).toBe(-100);
    expect(advance.isCancelled).toBe(false);
  });
});

describe("GET /api/cash-transactions/cash-bank/:cashBankId/transactions", () => {
  function getCashBankHistory(accountId, query = {}) {
    return request(app)
      .get(`/api/cash-transactions/cash-bank/${accountId}/transactions`)
      .set("Authorization", `Bearer ${baseContext.token}`)
      .query({ cmp_id: String(baseContext.companyId), ...query });
  }

  it("returns a zero balance and no entries for a cash account without transactions", async () => {
    const res = await getCashBankHistory(baseContext.cashAccount._id);

    expect(res.status).toBe(200);
    expect(res.body.data.account).toMatchObject({
      id: String(baseContext.cashAccount._id),
      name: "Main Cash Account",
      type: "cash",
    });
    expect(res.body.data.summary).toMatchObject({ balance: 0, totalIn: 0, totalOut: 0 });
    expect(res.body.data.items).toEqual([]);
    expect(res.body.data.hasMore).toBe(false);
  });

  it("returns each receipt ledger posting with the authoritative balance, direction and running balance", async () => {
    const first = await createReceiptForTest({ amount: 100, transactionDate: "2026-06-28T00:00:00.000Z" });
    const second = await createReceiptForTest({ amount: 100, transactionDate: "2026-06-29T00:00:00.000Z" });
    const res = await getCashBankHistory(baseContext.cashAccount._id);

    expect(res.status).toBe(200);
    expect(res.body.data.summary).toMatchObject({ balance: 200, totalIn: 200, totalOut: 0 });
    expect(res.body.data.items).toHaveLength(2);
    expect(res.body.data.items.map((item) => item.voucher_id)).toEqual([
      String(first.body.data.cashTransaction._id),
      String(second.body.data.cashTransaction._id),
    ]);
    expect(res.body.data.items.map((item) => item.direction)).toEqual(["in", "in"]);
    expect(res.body.data.items.map((item) => item.running_balance)).toEqual([100, 200]);
  });

  it("applies date, direction and pagination filters without changing the matching summary", async () => {
    await createReceiptForTest({ amount: 100, transactionDate: "2026-06-28T00:00:00.000Z" });
    await createReceiptForTest({ amount: 200, transactionDate: "2026-06-29T00:00:00.000Z" });

    const filtered = await getCashBankHistory(baseContext.cashAccount._id, {
      from: "2026-06-29",
      to: "2026-06-29",
      direction: "in",
    });
    const paged = await getCashBankHistory(baseContext.cashAccount._id, { page: 1, limit: 1 });

    expect(filtered.status).toBe(200);
    expect(filtered.body.data.summary).toMatchObject({ balance: 300, totalIn: 200, totalOut: 0 });
    expect(filtered.body.data.items).toHaveLength(1);
    expect(filtered.body.data.items[0].amount).toBe(200);
    expect(paged.body.data.items).toHaveLength(1);
    expect(paged.body.data.total).toBe(2);
    expect(paged.body.data.hasMore).toBe(true);
  });

  it("uses debit as IN and credit as OUT for balance and running-balance calculations", async () => {
    await createReceiptForTest({ amount: 100, transactionDate: "2026-06-28T00:00:00.000Z" });
    await createReceiptForTest({ amount: 200, transactionDate: "2026-06-29T00:00:00.000Z" });
    await CashBankLedger.create({
      cmp_id: baseContext.companyId,
      voucher_type: "payment",
      voucher_id: new mongoose.Types.ObjectId(),
      voucher_number: "PAY-001",
      date: new Date("2026-06-30T00:00:00.000Z"),
      cash_bank_id: baseContext.cashAccount._id,
      cash_bank_name: baseContext.cashAccount.partyName,
      cash_bank_type: "cash",
      amount: 50,
      direction: "out",
      party_id: baseContext.party._id,
      party_name: baseContext.party.partyName,
      status: "active",
    });

    const history = await getCashBankHistory(baseContext.cashAccount._id);
    const balances = await request(app)
      .get("/api/cash-transactions/cash-bank-balances")
      .set("Authorization", `Bearer ${baseContext.token}`)
      .query({ cmp_id: String(baseContext.companyId), cash_bank_type: "cash" });

    expect(history.body.data.summary).toMatchObject({ balance: 250, totalIn: 300, totalOut: 50 });
    expect(history.body.data.items.map((item) => item.direction)).toEqual(["in", "in", "out"]);
    expect(history.body.data.items.map((item) => item.running_balance)).toEqual([100, 300, 250]);
    expect(balances.body.data.balances[0].current_balance).toBe(250);
  });

  it("does not reveal an account from another company", async () => {
    const otherCompany = await createOwnedCompany(baseContext.token, "Other Cash Company");
    const otherAccount = await createTestParty({
      cmp_id: otherCompany.company._id,
      Primary_user_id: baseContext.userId,
      accountGroup: baseContext.cashAccountGroup._id,
      partyName: "Other Company Cash",
      partyType: "cash",
    });
    const res = await getCashBankHistory(otherAccount._id);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Cash/bank account not found");
  });
});
