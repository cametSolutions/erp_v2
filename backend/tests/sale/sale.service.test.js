import mongoose from "mongoose";
import { describe, expect, it } from "vitest";

import AdditionalCharges from "../../Model/AdditionalCharges.js";
import ItemLedger from "../../Model/ItemLedger.js";
import ItemMonthlyBalance from "../../Model/ItemMonthlyBalanceSchema.js";
import Outstanding from "../../Model/outstandingShcema.js";
import PartyLedger from "../../Model/PartyLedger.js";
import PartyMonthlyBalance from "../../Model/PartyMonthlyBalance.js";
import Product from "../../Model/ProductSchema.js";
import { Godown } from "../../Model/ProductSubDetails.js";
import Sale from "../../Model/Sale.js";
import VoucherSeries from "../../Model/VoucherSeriesSchema.js";
import VoucherTimeline from "../../Model/VoucherTimeline.js";
import { createSale } from "../../services/sale.service.js";
import { createTestCompany } from "../helpers/company.js";
import { createAccountGroup, createTestParty, setupIntegrationTestContext } from "../helpers/party.js";
import { loginAndGetAuthContext } from "../helpers/user.js";

async function setupSaleContext() {
  const context = await setupIntegrationTestContext({
    loginAndGetAuthContext,
    createTestCompany,
    userOverrides: { userName: "Sale Service Admin", mobileNumber: "9000999001", email: "sale-service@example.com" },
    companyOverrides: { name: "Sale Service Company", email: "sale-company@example.com", mobile: "9000999002", state: "Kerala" },
  });
  const cmp_id = context.company._id;
  const accountGroup = await createAccountGroup({ cmp_id, Primary_user_id: context.user._id, accountGroup_id: "sale-service-debtors" });
  const party = await createTestParty({ cmp_id, Primary_user_id: context.user._id, accountGroup: accountGroup._id, state: "Kerala" });
  const godown = await Godown.create({ godown: "Main", godown_id: "sale-service-main", cmp_id, Primary_user_id: context.user._id });
  const rowId = new mongoose.Types.ObjectId();
  const product = await Product.create({ product_name: "Sale Product", cmp_id, Primary_user_id: context.user._id, base_unit: "NOS", GodownList: [{ _id: rowId, godown: godown._id, balance_stock: 2, batch: "B-1" }], cgst: 9, sgst: 9, igst: 18 });
  const seriesId = new mongoose.Types.ObjectId();
  await VoucherSeries.create({ primary_user_id: context.user._id, cmp_id, voucherType: "sales", series: [{ _id: seriesId, seriesName: "Sale", widthOfNumericalPart: 3, currentNumber: 1 }] });
  const charge = await AdditionalCharges.create({ cmp_id, Primary_user_id: context.user._id, additional_charge_id: "sale-freight", name: "Freight", cgst: 9, sgst: 9, igst: 18 });
  return { context, party, godown, product, rowId, seriesId, charge };
}

describe("createSale", () => {
  it("posts every Sale effect atomically and groups repeated stock-row movement", async () => {
    const { context, party, godown, product, rowId, seriesId, charge } = await setupSaleContext();
    const line = { itemId: String(product._id), godownId: String(godown._id), godownStockRowId: String(rowId), selectedUnit: "NOS", actualQty: 3, billedQty: 3, rate: 100, taxInclusive: false, discountType: "amount", discountValue: 0 };
    const sale = await createSale({ selectedSeries: { _id: String(seriesId) }, transactionDate: "2026-07-15", partyId: String(party._id), items: [line, { ...line, actualQty: 2 }], additionalCharges: [{ additionalChargeId: String(charge._id), action: "subtract", value: 10 }], narration: "  July sale  " }, { companyId: String(context.company._id), user: context.user });
    expect(sale).toMatchObject({ voucher_type: "sale", status: "active", tally_status: "pending", narration: "July sale" });
    expect(sale.items).toHaveLength(2);
    expect(String(sale.additional_charges[0].additional_charge_id)).toBe(String(charge._id));
    expect(sale.additional_charges[0].option).toBe(charge.name);
    expect((await Product.findById(product._id)).GodownList[0].balance_stock).toBe(-3);
    expect(await ItemLedger.countDocuments({ voucher_id: sale._id })).toBe(2);
    expect((await ItemMonthlyBalance.findOne({ cmp_id: context.company._id, item_id: product._id })).total_outward_qty).toBe(5);
    expect(await PartyLedger.findOne({ voucher_id: sale._id, ledger_side: "debit", against_id: null })).not.toBeNull();
    expect((await PartyMonthlyBalance.findOne({ cmp_id: context.company._id, party_id: party._id })).total_debit).toBe(sale.totals.final_amount);
    expect((await Outstanding.findOne({ billId: String(sale._id) })).bill_due_date.toISOString()).toBe(sale.date.toISOString());
    expect(await VoucherTimeline.countDocuments({ voucher_id: sale._id, voucher_type: "sale" })).toBe(1);
  });

  it("rejects a stale stock row before creating any posting", async () => {
    const { context, party, godown, product, seriesId } = await setupSaleContext();
    await expect(createSale({ selectedSeries: { _id: String(seriesId) }, transactionDate: "2026-07-15", partyId: String(party._id), items: [{ itemId: String(product._id), godownId: String(godown._id), godownStockRowId: String(new mongoose.Types.ObjectId()), selectedUnit: "NOS", actualQty: 1, billedQty: 1, rate: 1, taxInclusive: false, discountType: "amount", discountValue: 0 }] }, { companyId: String(context.company._id), user: context.user })).rejects.toThrow("does not belong");
    expect(await Sale.countDocuments()).toBe(0);
    expect(await ItemLedger.countDocuments()).toBe(0);
  });
});
