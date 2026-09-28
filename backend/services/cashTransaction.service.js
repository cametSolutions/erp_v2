import mongoose from "mongoose";

import CashBankLedger from "../Model/CashBankLedger.js";
import Outstanding from "../Model/outstandingShcema.js";
import Party from "../Model/partySchema.js";
import PartyLedger from "../Model/PartyLedger.js";
import PartyMonthlyBalance from "../Model/PartyMonthlyBalance.js";
import Receipt from "../Model/Receipt.js";
import {
  createVoucherTimelineEntry,
  updateVoucherTimelineEntry,
} from "./voucherTimeline.service.js";
import {
  buildAuthoritativeSettlementDetail,
  buildCashBankLedgerDocument,
  buildCashTransactionDocument,
  buildPartyLedgerDocument,
} from "./cashTransactionDocument.service.js";
import {
  assertTransactionNotAlreadyCancelled,
  getCancelledTransactionStatus,
  markTransactionCancelled,
} from "./transactionState.service.js";
import { issueVoucherIdentity } from "./voucherIdentity.service.js";
import {
  buildVoucherTimelinePayload,
  buildVoucherTimelineUpdatePayload,
} from "./voucherTimelinePayload.service.js";
import {
  applyTransactionCreatorScope,
  getAccessibleCompanyIds,
  resolveAdminOwnerId,
} from "../utils/authScope.js";

// Returns `YYYY-MM` monthly bucket key for party monthly balance rollups.
function formatMonthKey(dateValue) {
  const date = new Date(dateValue);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  return `${year}-${month}`;
}

// Local HTTP-aware error helper for controller response mapping.
function createHttpError(message, statusCode = 500) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

const RECEIPT_INSTRUMENT_TYPES = ["cash", "cheque", "upi", "neft", "rtgs"];
const BANK_INSTRUMENT_TYPES = ["cheque", "upi", "neft", "rtgs"];

function normalizeType(value) {
  return String(value || "").trim().toLowerCase();
}

// Current Party documents use `party`; missing type is accepted only for
// legacy customer records created before partyType became required.
function validateReceiptParty(party) {
  const partyType = normalizeType(party?.partyType || "party");

  if (partyType !== "party") {
    throw createHttpError(
      "Selected receipt party must be a customer or business party",
      400,
    );
  }
}

function buildValidatedReceiptData(data, party, cashBank) {
  const instrumentType = normalizeType(data.instrument_type || "cash");
  const submittedCashBankType = normalizeType(data.cash_bank_type);
  const actualCashBankType = normalizeType(cashBank?.partyType);

  if (!RECEIPT_INSTRUMENT_TYPES.includes(instrumentType)) {
    throw createHttpError("Invalid receipt instrument type", 400);
  }

  if (
    !["cash", "bank"].includes(actualCashBankType) ||
    submittedCashBankType !== actualCashBankType
  ) {
    throw createHttpError(
      "Selected cash/bank ledger does not belong to this company",
      400,
    );
  }

  const expectedCashBankType = BANK_INSTRUMENT_TYPES.includes(instrumentType)
    ? "bank"
    : "cash";

  if (actualCashBankType !== expectedCashBankType) {
    throw createHttpError(
      instrumentType === "cash"
        ? "Cash receipts require a cash account"
        : "Bank instruments require a bank account",
      400,
    );
  }

  let chequeNumber = data.cheque_number || null;
  let chequeDate = data.cheque_date || null;

  if (instrumentType === "cheque") {
    chequeNumber = String(chequeNumber || "").trim();
    if (!chequeNumber) {
      throw createHttpError("Cheque number is required", 400);
    }

    if (!chequeDate) {
      throw createHttpError("Valid cheque date is required", 400);
    }

    chequeDate = new Date(chequeDate);
    if (Number.isNaN(chequeDate.getTime())) {
      throw createHttpError("Valid cheque date is required", 400);
    }
  }

  return {
    ...data,
    party_name: party.partyName,
    cash_bank_name: cashBank.partyName,
    cash_bank_type: actualCashBankType,
    instrument_type: instrumentType,
    cheque_number: chequeNumber,
    cheque_date: chequeDate,
  };
}

function validateSubmittedSettlements(settlementDetails, receiptAmount) {
  const seenOutstandingIds = new Set();
  let totalSettlement = 0;

  const submittedSettlements = (settlementDetails || []).map((item) => {
    const submittedOutstandingId = String(item?.outstanding || "");
    const settledAmount = Number(item?.settled_amount);

    if (!mongoose.Types.ObjectId.isValid(submittedOutstandingId)) {
      throw createHttpError(
        "Outstanding bill not found for the selected company and party",
        400,
      );
    }

    // Canonical ObjectId text also rejects the same bill when one client row
    // uses upper-case hex and another uses lower-case hex.
    const outstandingId = new mongoose.Types.ObjectId(
      submittedOutstandingId,
    ).toString();

    if (seenOutstandingIds.has(outstandingId)) {
      throw createHttpError(
        "The same outstanding bill cannot be settled more than once",
        400,
      );
    }

    if (!Number.isFinite(settledAmount) || settledAmount <= 0) {
      throw createHttpError("Settled amount must be greater than zero", 400);
    }

    seenOutstandingIds.add(outstandingId);
    totalSettlement += settledAmount;

    return {
      outstandingId,
      settledAmount,
    };
  });

  if (totalSettlement > Number(receiptAmount)) {
    throw createHttpError(
      "Total settled amount cannot exceed receipt amount",
      400,
    );
  }

  return submittedSettlements;
}

async function resolveAuthoritativeSettlements({
  submittedSettlements,
  cmp_id,
  party_id,
  settlementDate,
  session,
}) {
  const resolvedSettlements = [];

  for (const item of submittedSettlements) {
    const outstanding = await Outstanding.findOne({
      _id: item.outstandingId,
      cmp_id,
      party_id,
      isCancelled: false,
      classification: "dr",
      bill_pending_amt: { $gt: 0 },
    }).session(session);

    if (!outstanding) {
      throw createHttpError(
        "Outstanding bill not found for the selected company and party",
        400,
      );
    }

    const currentPendingAmount = Number(outstanding.bill_pending_amt) || 0;
    if (item.settledAmount > currentPendingAmount) {
      throw createHttpError(
        "Settled amount cannot exceed the current pending amount",
        400,
      );
    }

    resolvedSettlements.push({
      outstanding,
      detail: buildAuthoritativeSettlementDetail(
        outstanding,
        item.settledAmount,
        settlementDate,
      ),
    });
  }

  return resolvedSettlements;
}

// For receipt flow:
// - party ledger receives credit
// - cash/bank records a direct inward movement
function resolveLedgerSides(voucher_type) {
  return {
    party_ledger_side: "credit",
    cash_bank_direction: "in",
  };
}

// Updates per-party monthly debit/credit aggregate used in outstanding analytics.
// `reverse=true` is used while cancelling transactions.
async function updatePartyMonthlyBalance({
  cmp_id,
  party_id,
  date,
  amount,
  voucher_type,
  session,
  reverse = false,
}) {
  const month_key = formatMonthKey(date);
  const multiplier = reverse ? -1 : 1;
  const total_debit = 0;
  const total_credit = amount * multiplier;

  const doc = await PartyMonthlyBalance.findOneAndUpdate(
    { cmp_id, party_id, month_key },
    {
      $setOnInsert: {
        cmp_id,
        party_id,
        month_key,
        net_amount: 0,
      },
      $inc: {
        total_debit,
        total_credit,
        transaction_count: 1 * multiplier,
      },
    },
    {
      returnDocument: "after",
      upsert: true,
      session,
      runValidators: true,
    },
  );

  const net_amount =
    (Number(doc?.total_debit) || 0) - (Number(doc?.total_credit) || 0);

  await PartyMonthlyBalance.updateOne(
    { _id: doc._id },
    { $set: { net_amount } },
    { session },
  );
}

// Creates outstanding row for advance amount (receipt amount not mapped to bill settlement).
async function createAdvanceReceiptOutstanding({
  cmp_id,
  party_id,
  party_name,
  receipt_id,
  voucher_number,
  date,
  advance_amount,
  created_by,
  session,
}) {
  if ((Number(advance_amount) || 0) <= 0) {
    return;
  }

  const party = await Party.findById(party_id).session(session).lean();

  if (!party) {
    throw createHttpError(
      "Party not found for advance receipt outstanding",
      404,
    );
  }

  await Outstanding.create(
    [
      {
        Primary_user_id: party?.Primary_user_id,
        cmp_id,
        accountGroup: party?.accountGroup,
        subGroup: party?.subGroup || null,
        party_name,
        alias: null,
        party_id,
        mobile_no: party?.mobileNumber || null,
        email: party?.emailID || null,
        bill_date: date,
        bill_no: voucher_number,
        billId: String(receipt_id),
        bill_amount: Number(advance_amount) || 0,
        bill_due_date: date,
        // Receipt advances are customer credit, so Outstanding stores their
        // pending value as a negative CR amount.
        bill_pending_amt: -(Number(advance_amount) || 0),
        classification: "cr",
        createdBy: created_by ? String(created_by) : "",
        source: "advance_receipt",
      },
    ],
    { session },
  );
}

// Zeroes advance-outstanding rows created for a receipt during cancellation.
async function cancelAdvanceReceiptOutstanding({
  cmp_id,
  receipt_id,
  session,
}) {
  await Outstanding.updateMany(
    {
      cmp_id,
      billId: String(receipt_id),
      source: "advance_receipt",
    },
    {
      $set: {
        bill_amount: 0,
        bill_pending_amt: 0,
      },
    },
    { session },
  );
}

// Receipt creation service (transactional).
// Performs:
// 1) party, cash/bank, instrument and cheque validation
// 2) settlement validation and authoritative Outstanding snapshots
// 3) voucher identity issuance
// 4) receipt insert
// 5) party ledger + cash/bank ledger inserts
// 6) outstanding adjustments for settled bills
// 7) advance outstanding creation
// 8) timeline entry creation
export async function createCashTransaction(data = {}, req) {
  const session = await mongoose.startSession();

  try {
    let createdCashTransaction = null;

    await session.withTransaction(async () => {
      const [party, cashBank] = await Promise.all([
        Party.findOne({ _id: data.party_id, cmp_id: data.cmp_id })
          .session(session)
          .lean(),
        Party.findOne({
          _id: data.cash_bank_id,
          cmp_id: data.cmp_id,
        })
          .session(session)
          .lean(),
      ]);

      if (!party) {
        throw createHttpError(
          "Selected party does not belong to this company",
          400,
        );
      }

      validateReceiptParty(party);

      if (!cashBank) {
        throw createHttpError(
          "Selected cash/bank ledger does not belong to this company",
          400,
        );
      }

      const validatedData = buildValidatedReceiptData(data, party, cashBank);
      const date = new Date(validatedData.date);
      const submittedSettlements = validateSubmittedSettlements(
        validatedData.settlement_details,
        validatedData.amount,
      );
      const resolvedSettlements = await resolveAuthoritativeSettlements({
        submittedSettlements,
        cmp_id: validatedData.cmp_id,
        party_id: validatedData.party_id,
        settlementDate: date,
        session,
      });
      const settlement_details = resolvedSettlements.map(
        (item) => item.detail,
      );
      const settled_amount = settlement_details.reduce(
        (total, item) => total + (Number(item.settled_amount) || 0),
        0,
      );
      const advance_amount =
        (Number(validatedData.amount) || 0) - settled_amount;

      const voucherIdentity = await issueVoucherIdentity({
        cmpId: validatedData.cmp_id,
        voucherType: validatedData.voucher_type,
        seriesId: validatedData.series_id,
        userId: validatedData.created_by,
        session,
      });

      const { party_ledger_side, cash_bank_direction } = resolveLedgerSides(
        validatedData.voucher_type,
      );

      const [cashTransaction] = await Receipt.create(
        [
          buildCashTransactionDocument(
            validatedData,
            voucherIdentity,
            settlement_details,
            advance_amount,
            date,
          ),
        ],
        { session },
      );

      await PartyLedger.create(
        [
          buildPartyLedgerDocument(
            validatedData,
            cashTransaction._id,
            cashTransaction.voucher_number,
            date,
            party_ledger_side,
          ),
        ],
        { session },
      );

      await updatePartyMonthlyBalance({
        cmp_id: validatedData.cmp_id,
        party_id: validatedData.party_id,
        date,
        amount: Number(validatedData.amount) || 0,
        voucher_type: validatedData.voucher_type,
        session,
      });

      await CashBankLedger.create(
        [
          buildCashBankLedgerDocument(
            validatedData,
            cashTransaction._id,
            cashTransaction.voucher_number,
            date,
            cash_bank_direction,
          ),
        ],
        { session },
      );

      for (const item of resolvedSettlements) {
        const { outstanding, detail } = item;
        outstanding.bill_pending_amt = detail.remaining_outstanding_amount;
        await outstanding.save({ session });
      }

      await createAdvanceReceiptOutstanding({
        cmp_id: validatedData.cmp_id,
        party_id: validatedData.party_id,
        party_name: validatedData.party_name,
        receipt_id: cashTransaction._id,
        voucher_number: cashTransaction.voucher_number,
        date,
        advance_amount,
        created_by: validatedData.created_by || null,
        session,
      });

      createdCashTransaction = await Receipt.findById(cashTransaction._id)
        .session(session)
        .lean();

      await createVoucherTimelineEntry(
        buildVoucherTimelinePayload(cashTransaction),
        session,
      );
    });

    return createdCashTransaction;
  } finally {
    await session.endSession();
  }
}

// Receipt cancellation service (transactional).
// Reverses accounting and outstanding impacts made during creation.
export async function cancelCashTransaction(id, data = {}, req) {
  const session = await mongoose.startSession();

  try {
    let updatedCashTransaction = null;

    await session.withTransaction(async () => {
      const transaction = await Receipt.findOne(
        applyTransactionCreatorScope(req, {
          _id: id,
          cmp_id: data.cmp_id,
        }),
      ).session(session);

      if (!transaction) {
        throw createHttpError("Cash transaction not found", 404);
      }

      assertTransactionNotAlreadyCancelled("receipt", transaction.status);

      markTransactionCancelled(transaction, "receipt");
      transaction.cancelled_at = new Date();
      transaction.cancelled_by = data.cancelled_by || null;
      transaction.cancellation_reason = data.cancellation_reason || null;
      transaction.updated_by = data.cancelled_by || data.updated_by || null;

      await transaction.save({ session });

      await PartyLedger.updateMany(
        {
          voucher_id: transaction._id,
          voucher_type: transaction.voucher_type,
        },
        {
          $set: {
            status: getCancelledTransactionStatus(transaction.voucher_type),
          },
        },
        { session },
      );

      await updatePartyMonthlyBalance({
        cmp_id: transaction.cmp_id,
        party_id: transaction.party_id,
        date: transaction.date,
        amount: Number(transaction.amount) || 0,
        voucher_type: transaction.voucher_type,
        session,
        reverse: true,
      });

      await CashBankLedger.updateMany(
        {
          voucher_id: transaction._id,
          voucher_type: transaction.voucher_type,
        },
        {
          $set: {
            status: getCancelledTransactionStatus(transaction.voucher_type),
          },
        },
        { session },
      );

      for (const item of transaction.settlement_details || []) {
        if (!item?.outstanding || !item?.settled_amount) {
          continue;
        }

        const outstanding = await Outstanding.findOne({
          _id: item.outstanding,
          cmp_id: transaction.cmp_id,
          party_id: transaction.party_id,
          isCancelled: false,
        }).session(session);

        if (!outstanding) {
          throw createHttpError(
            "Outstanding bill not found for the selected company and party",
            400,
          );
        }

        const settledAmount = Number(item.settled_amount) || 0;
        if (settledAmount <= 0) {
          throw createHttpError(
            "Settled amount must be greater than zero",
            400,
          );
        }

        const currentPendingAmount = Number(outstanding.bill_pending_amt) || 0;
        // Add back settled amount to pending because receipt is being reversed.
        outstanding.bill_pending_amt = currentPendingAmount + settledAmount;
        outstanding.classification =
          Number(outstanding.bill_pending_amt) < 0 ? "cr" : "dr";
        // A cancelled Sale keeps this row active only while a Receipt still
        // references it. Once that final Receipt is cancelled, close it.
        if (
          outstanding.source === "sale" &&
          Number(outstanding.bill_amount) === 0 &&
          Number(outstanding.bill_pending_amt) === 0
        ) {
          outstanding.isCancelled = true;
        }
        await outstanding.save({ session });
      }

      await cancelAdvanceReceiptOutstanding({
        cmp_id: transaction.cmp_id,
        receipt_id: transaction._id,
        session,
      });

      updatedCashTransaction = transaction.toObject();

      await updateVoucherTimelineEntry(
        {
          voucher_id: transaction._id,
          voucher_type: transaction.voucher_type,
        },
        buildVoucherTimelineUpdatePayload(transaction, {
          status: transaction.status || null,
        }),
        session,
      );
    });

    return updatedCashTransaction;
  } finally {
    await session.endSession();
  }
}

// Fetch one receipt with role/creator/company scoping.
export async function getCashTransactionById(id, { cmp_id } = {}, req) {
  const filter = applyTransactionCreatorScope(req, { _id: id });

  if (cmp_id) {
    filter.cmp_id = cmp_id;
  } else {
    const accessibleCompanyIds = await getAccessibleCompanyIds(req);
    filter.cmp_id = { $in: accessibleCompanyIds };
  }

  return Receipt.findOne(filter).lean();
}

// List receipts with filter support and creator/company scoping.
export async function getCashTransactions(filters = {}, req) {
  const { cmp_id, voucher_type, party_id, status, from, to } = filters;
  const query = applyTransactionCreatorScope(req, {});

  if (cmp_id) {
    query.cmp_id = cmp_id;
  } else {
    const accessibleCompanyIds = await getAccessibleCompanyIds(req);
    query.cmp_id = { $in: accessibleCompanyIds };
  }

  if (voucher_type) {
    query.voucher_type = voucher_type;
  }

  if (party_id) {
    query.party_id = party_id;
  }

  if (status) {
    query.status = status;
  }

  if (from || to) {
    query.date = {};

    if (from) {
      query.date.$gte = new Date(from);
    }

    if (to) {
      const endDate = new Date(to);
      endDate.setHours(23, 59, 59, 999);
      query.date.$lte = endDate;
    }
  }

  return Receipt.find(query).sort({ date: -1, voucher_number: 1 }).lean();
}

// Aggregates live balances from cash/bank ledger entries and merges with party masters
// so ledgers with zero movement are still returned in response.
export async function getCashBankLedgerBalances(filters = {}, req) {
  const { cmp_id, cash_bank_type } = filters;
  const scopedMatch = {
    status: "active",
  };
  const partyFilter = {};
  const ownerId = resolveAdminOwnerId(req);

  if (cmp_id) {
    scopedMatch.cmp_id = new mongoose.Types.ObjectId(cmp_id);
    partyFilter.cmp_id = new mongoose.Types.ObjectId(cmp_id);
  } else {
    const accessibleCompanyIds = await getAccessibleCompanyIds(req);
    scopedMatch.cmp_id = { $in: accessibleCompanyIds };
    partyFilter.cmp_id = { $in: accessibleCompanyIds };
  }

  if (ownerId) {
    partyFilter.Primary_user_id = new mongoose.Types.ObjectId(ownerId);
  }

  if (cash_bank_type) {
    scopedMatch.cash_bank_type = cash_bank_type;
    partyFilter.partyType = cash_bank_type;
  } else {
    partyFilter.partyType = { $in: ["cash", "bank"] };
  }

  const [partyLedgers, ledgerSummaries] = await Promise.all([
    Party.find(partyFilter)
      .select("_id partyName partyType")
      .sort({ partyName: 1 })
      .lean(),
    CashBankLedger.aggregate([
      { $match: scopedMatch },
      {
        $group: {
          _id: {
            cash_bank_id: "$cash_bank_id",
            cash_bank_name: "$cash_bank_name",
            cash_bank_type: "$cash_bank_type",
          },
          current_balance: {
            // Cash/Bank rows store positive magnitudes; direction carries
            // whether a movement raises or lowers its balance.
            $sum: {
              $cond: [
                { $eq: ["$direction", "in"] },
                { $ifNull: ["$amount", 0] },
                { $multiply: [{ $ifNull: ["$amount", 0] }, -1] },
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: "$_id.cash_bank_id",
          cash_bank_name: "$_id.cash_bank_name",
          cash_bank_type: "$_id.cash_bank_type",
          current_balance: 1,
        },
      },
      { $sort: { cash_bank_name: 1 } },
    ]),
  ]);

  const summaryMap = new Map();
  for (const summary of ledgerSummaries) {
    summaryMap.set(String(summary?._id), summary);
  }

  const balances = partyLedgers.map((party) => {
    const matchedSummary = summaryMap.get(String(party._id));
    summaryMap.delete(String(party._id));

    return {
      _id: party._id,
      cash_bank_name: party.partyName || matchedSummary?.cash_bank_name || "--",
      cash_bank_type: party.partyType || matchedSummary?.cash_bank_type || null,
      current_balance: Number(matchedSummary?.current_balance) || 0,
    };
  });

  // Keep orphan ledger summaries (if any ledger exists without party master)
  for (const [, summary] of summaryMap.entries()) {
    balances.push({
      _id: summary?._id || null,
      cash_bank_name: summary?.cash_bank_name || "--",
      cash_bank_type: summary?.cash_bank_type || null,
      current_balance: Number(summary?.current_balance) || 0,
    });
  }

  return balances.sort((left, right) =>
    String(left?.cash_bank_name || "").localeCompare(
      String(right?.cash_bank_name || ""),
    ),
  );
}

// Cash/Bank drill-down reads the ledger itself, rather than rebuilding entries
// from Sale or Receipt documents. This keeps edits and cancellations consistent
// with the balance report, which also includes only active ledger rows.
export async function getCashBankLedgerTransactions(filters = {}, req) {
  const {
    cmp_id,
    cash_bank_id,
    page = 1,
    limit = 20,
    from,
    to,
    voucher_type,
    direction,
  } = filters;
  const ownerId = resolveAdminOwnerId(req);
  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const account = await Party.findOne({
    _id: cash_bank_id,
    cmp_id,
    Primary_user_id: ownerId,
    partyType: { $in: ["cash", "bank"] },
  })
    .select("_id partyName partyType")
    .lean();

  if (!account) {
    const error = createHttpError("Cash/bank account not found", 404);
    throw error;
  }

  const accountMatch = {
    cmp_id: new mongoose.Types.ObjectId(cmp_id),
    cash_bank_id: new mongoose.Types.ObjectId(cash_bank_id),
    status: "active",
  };
  const detailMatch = {};

  if (from || to) {
    detailMatch.date = {};
    if (from) detailMatch.date.$gte = new Date(from);
    if (to) {
      const endDate = new Date(to);
      endDate.setHours(23, 59, 59, 999);
      detailMatch.date.$lte = endDate;
    }
  }
  if (voucher_type) detailMatch.voucher_type = voucher_type;
  if (direction) detailMatch.direction = direction;

  const [result, currentBalanceRows, filteredSummaryRows] = await Promise.all([
    CashBankLedger.aggregate([
    { $match: accountMatch },
    // The stable ordering also makes the running balance deterministic.
    { $sort: { date: 1, _id: 1 } },
    {
      $setWindowFields: {
        sortBy: { date: 1, _id: 1 },
        output: {
          running_balance: {
            $sum: {
              $cond: [
                { $eq: ["$direction", "in"] },
                "$amount",
                { $multiply: ["$amount", -1] },
              ],
            },
            window: { documents: ["unbounded", "current"] },
          },
        },
      },
    },
    ...(Object.keys(detailMatch).length > 0 ? [{ $match: detailMatch }] : []),
    { $skip: (pageNum - 1) * limitNum },
    { $limit: limitNum },
    {
      $project: {
        _id: 1,
        cash_bank_id: 1,
        date: 1,
        voucher_type: 1,
        voucher_id: 1,
        voucher_number: 1,
        party_name: 1,
        narration: 1,
        amount: 1,
        direction: 1,
        running_balance: 1,
        tally_status: 1,
      },
    },
  ]),
    CashBankLedger.aggregate([
      { $match: accountMatch },
      {
        $group: {
          _id: null,
          balance: {
            $sum: {
              $cond: [
                { $eq: ["$direction", "in"] },
                "$amount",
                { $multiply: ["$amount", -1] },
              ],
            },
          },
        },
      },
    ]),
    CashBankLedger.aggregate([
      { $match: accountMatch },
      ...(Object.keys(detailMatch).length > 0 ? [{ $match: detailMatch }] : []),
      {
        $group: {
          _id: "$direction",
          amount: { $sum: { $abs: "$amount" } },
          total: { $sum: 1 },
        },
      },
    ]),
  ]);

  const inSummary = filteredSummaryRows.find((row) => row._id === "in");
  const outSummary = filteredSummaryRows.find((row) => row._id === "out");
  const total = filteredSummaryRows.reduce(
    (count, row) => count + (Number(row.total) || 0),
    0,
  );
  const items = result.map((entry) => ({
    ...entry,
    direction: entry.direction,
  }));

  return {
    account: {
      id: account._id,
      name: account.partyName || "--",
      type: account.partyType,
    },
    summary: {
      // Keep the headline aligned with the unfiltered Cash/Bank balance API.
      balance: Number(currentBalanceRows[0]?.balance) || 0,
      totalIn: Number(inSummary?.amount) || 0,
      totalOut: Number(outSummary?.amount) || 0,
    },
    items,
    total,
    page: pageNum,
    hasMore: pageNum * limitNum < total,
  };
}

export default {
  createCashTransaction,
  cancelCashTransaction,
  getCashTransactionById,
  getCashTransactions,
  getCashBankLedgerBalances,
  getCashBankLedgerTransactions,
};
