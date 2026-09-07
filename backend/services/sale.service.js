import mongoose from "mongoose";

import Company from "../Model/CompanySchema.js";
import ItemLedger from "../Model/ItemLedger.js";
import ItemMonthlyBalance from "../Model/ItemMonthlyBalanceSchema.js";
import Outstanding from "../Model/outstandingShcema.js";
import PartyLedger from "../Model/PartyLedger.js";
import PartyMonthlyBalance from "../Model/PartyMonthlyBalance.js";
import Party from "../Model/partySchema.js";
import PriceLevel from "../Model/PriceLevel.js";
import Product from "../Model/ProductSchema.js";
import Sale from "../Model/Sale.js";
import { getInitialTransactionStatus, getInitialTransactionTallyStatus } from "./transactionState.service.js";
import { issueVoucherIdentity } from "./voucherIdentity.service.js";
import { createVoucherTimelineEntry } from "./voucherTimeline.service.js";
import { buildVoucherTimelinePayload } from "./voucherTimelinePayload.service.js";
import {
  calculateSaleTotals,
  createSaleValidationError,
  normalizeSaleInput,
  resolveSaleChargeMasters,
  resolveSaleItemMasters,
} from "./saleFoundation.service.js";

function requiredObjectId(value, field) {
  if (!value || !mongoose.Types.ObjectId.isValid(value)) {
    throw createSaleValidationError(`${field} must be a valid ObjectId`);
  }
  return String(value);
}

function normalizedText(value, maximum = 500) {
  if (value == null || value === "") return null;
  if (typeof value !== "string") throw createSaleValidationError("Text fields must be strings");
  const result = value.trim();
  if (result.length > maximum) throw createSaleValidationError("Text field is too long");
  return result || null;
}

function normalizeDate(value) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) {
    throw createSaleValidationError("transactionDate must be a valid date");
  }
  return date;
}

function formatMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function resolveTaxType(company, party) {
  const companyState = String(company?.state || "").trim().toLowerCase();
  const partyState = String(party?.state || "").trim().toLowerCase();
  return companyState && partyState && companyState === partyState ? "cgst_sgst" : "igst";
}

function mapDespatchDetails(input = {}) {
  const source = input && typeof input === "object" ? input : {};
  return {
    challan_no: normalizedText(source.challanNo ?? source.challan_no),
    container_no: normalizedText(source.containerNo ?? source.container_no),
    despatch_through: normalizedText(source.despatchThrough ?? source.despatch_through),
    destination: normalizedText(source.destination),
    vehicle_no: normalizedText(source.vehicleNo ?? source.vehicle_no),
    order_no: normalizedText(source.orderNo ?? source.order_no),
    terms_of_pay: normalizedText(source.termsOfPay ?? source.terms_of_pay),
    terms_of_delivery: normalizedText(source.termsOfDelivery ?? source.terms_of_delivery),
  };
}

function mapSaleItems(items) {
  return items.map((item) => ({
    item_id: item.item_id,
    item_name: item.item_name,
    hsn: item.hsn,
    base_unit: item.base_unit,
    selected_unit: item.selected_unit,
    alternate_unit: item.alternate_unit,
    base_denominator: item.base_denominator,
    alt_conversion: item.alt_conversion,
    actual_qty: item.actual_qty,
    billed_qty: item.billed_qty,
    godown_id: item.godown_id,
    godown_name: item.godown_name,
    godown_stock_row_id: item.godown_stock_row_id,
    batch: item.batch,
    mfgdt: item.mfgdt,
    expdt: item.expdt,
    mrp: item.mrp,
    rate: item.rate,
    initial_price_source: item.initial_price_source,
    discount_type: item.discount_type,
    discount_percentage: item.discount_type === "percentage" ? item.discount_value : 0,
    discount_amount: item.discount_type === "amount" ? item.discount_value : item.discount_amount,
    tax_rate: item.tax_rates.igst || (item.tax_rates.cgst + item.tax_rates.sgst),
    cess_rate: item.tax_rates.cess,
    addl_cess_rate: item.tax_rates.addl_cess,
    tax_inclusive: item.tax_inclusive,
    igst_amount: item.igst_amount,
    cgst_amount: item.cgst_amount,
    sgst_amount: item.sgst_amount,
    tax_amount: item.tax_amount,
    cess_amount: item.cess_amount,
    addl_cess_amount: item.addl_cess_amount,
    base_price: item.base_price,
    taxable_amount: item.taxable_amount,
    total_amount: item.total_amount,
    description: item.description,
    warranty_card_id: item.warranty_card_id,
  }));
}

function mapCharges(charges) {
  return charges.map(({ charge_master_id, rates, name, ...charge }) => ({
    ...charge,
    additional_charge_id: charge_master_id,
  }));
}

async function decrementStock(items, cmp_id, session) {
  const grouped = new Map();
  for (const item of items) {
    const key = `${item.item_id}:${item.godown_stock_row_id}`;
    grouped.set(key, (grouped.get(key) || 0) + item.actual_qty);
  }
  for (const [key, quantity] of grouped) {
    const [item_id, row_id] = key.split(":");
    const update = await Product.updateOne(
      { _id: item_id, cmp_id, "GodownList._id": row_id },
      { $inc: { "GodownList.$.balance_stock": -quantity } },
      { session },
    );
    if (update.matchedCount !== 1) {
      throw createSaleValidationError("Selected stock row is no longer available");
    }
  }
}

async function updateItemMonthlyBalances(items, cmp_id, date, session) {
  const grouped = new Map();
  for (const item of items) {
    const current = grouped.get(item.item_id) || { quantity: 0, count: 0 };
    grouped.set(item.item_id, {
      quantity: current.quantity + item.actual_qty,
      count: current.count + 1,
    });
  }
  const month_key = formatMonthKey(date);
  for (const [item_id, { quantity, count }] of grouped) {
    await ItemMonthlyBalance.findOneAndUpdate(
      { cmp_id, item_id, month_key },
      { $setOnInsert: { cmp_id, item_id, month_key }, $inc: { total_outward_qty: quantity, transaction_count: count } },
      { upsert: true, returnDocument: "after", session, runValidators: true },
    );
  }
}

async function updatePartyMonthlyBalance({ cmp_id, party_id, date, amount, session }) {
  const month_key = formatMonthKey(date);
  await PartyMonthlyBalance.findOneAndUpdate(
    { cmp_id, party_id, month_key },
    { $setOnInsert: { cmp_id, party_id, month_key }, $inc: { total_debit: amount, transaction_count: 1 } },
    { upsert: true, returnDocument: "after", session, runValidators: true },
  );
}

/** Creates every Sale posting effect in one Mongo transaction. */
export async function createSale(data = {}, req = {}) {
  const cmp_id = requiredObjectId(req.companyId, "companyId");
  const userId = requiredObjectId(req.user?._id || req.user?.id, "userId");
  const party_id = requiredObjectId(data.partyId ?? data.party_id, "partyId");
  const series_id = requiredObjectId(data.selectedSeries?._id ?? data.series_id, "selectedSeries._id");
  const priceLevelValue = data.priceLevelId ?? data.price_level_id;
  const price_level_id = priceLevelValue == null || priceLevelValue === "" ? null : requiredObjectId(priceLevelValue, "priceLevelId");
  const date = normalizeDate(data.transactionDate ?? data.date);
  const normalized = normalizeSaleInput(data);
  const session = await mongoose.startSession();

  try {
    let createdSale;
    await session.withTransaction(async () => {
      const [company, party, priceLevel] = await Promise.all([
        Company.findById(cmp_id).session(session).lean(),
        Party.findOne({ _id: party_id, cmp_id }).session(session).lean(),
        price_level_id ? PriceLevel.findOne({ _id: price_level_id, cmp_id }).session(session).lean() : null,
      ]);
      if (!company) throw createSaleValidationError("Company not found");
      if (!party) throw createSaleValidationError("Selected party does not belong to this company");
      if (price_level_id && !priceLevel) throw createSaleValidationError("Price level does not belong to this company");

      const [resolvedItems, resolvedCharges] = await Promise.all([
        resolveSaleItemMasters(normalized.items, { cmpId: cmp_id, session }),
        resolveSaleChargeMasters(normalized.additional_charges, { cmpId: cmp_id, session }),
      ]);
      const tax_type = resolveTaxType(company, party);
      const calculated = calculateSaleTotals(resolvedItems, resolvedCharges, tax_type);
      const voucherIdentity = await issueVoucherIdentity({
        cmpId: cmp_id,
        voucherType: "sales",
        transactionType: "sale",
        seriesId: series_id,
        userId,
        session,
      });

      const [sale] = await Sale.create([{
        cmp_id,
        voucher_type: "sale",
        series_id,
        series_name: voucherIdentity.series.seriesName,
        voucher_number: voucherIdentity.voucherNumber,
        current_series_number: voucherIdentity.currentSeriesNumber,
        company_level_serial_number: voucherIdentity.companyLevelSerialNumber,
        user_level_serial_number: voucherIdentity.userLevelSerialNumber,
        date,
        party_id,
        party_snapshot: { name: party.partyName, gst_no: party.gstNo || null, billing_address: party.billingAddress || null, shipping_address: party.shippingAddress || null, mobile: party.mobileNumber || null, state: party.state || null },
        mailing_name: party.partyName,
        tax_type,
        price_level_id,
        price_level_name: priceLevel?.pricelevel || null,
        items: mapSaleItems(calculated.items),
        additional_charges: mapCharges(calculated.additional_charges),
        despatch_details: mapDespatchDetails(data.despatchDetails ?? data.despatch_details),
        narration: normalizedText(data.narration),
        totals: calculated.totals,
        status: getInitialTransactionStatus("sale"),
        tally_status: getInitialTransactionTallyStatus("sale"),
        created_by: userId,
        updated_by: userId,
      }], { session });

      await decrementStock(calculated.items, cmp_id, session);
      // Mongoose requires ordered inserts when creating more than one document
      // in a transaction-bound session.
      await ItemLedger.create(sale.items.map((item) => ({
        cmp_id, item_id: item.item_id, godown_id: item.godown_id, godown_stock_row_id: item.godown_stock_row_id,
        batch: item.batch, voucher_type: "sale", voucher_id: sale._id, voucher_item_id: item._id,
        voucher_number: sale.voucher_number, date, base_quantity: item.actual_qty, base_unit: item.base_unit,
        movement_type: "OUT", tally_status: getInitialTransactionTallyStatus("sale"), created_by: userId,
      })), { session, ordered: true });
      await updateItemMonthlyBalances(calculated.items, cmp_id, date, session);
      await PartyLedger.create([{
        cmp_id, voucher_type: "sale", voucher_id: sale._id, voucher_number: sale.voucher_number, date,
        party_id, party_name: party.partyName, amount: calculated.totals.final_amount, ledger_side: "debit",
        against_id: null, status: getInitialTransactionStatus("sale"), tally_status: getInitialTransactionTallyStatus("sale"), created_by: userId,
      }], { session });
      await updatePartyMonthlyBalance({ cmp_id, party_id, date, amount: calculated.totals.final_amount, session });
      await Outstanding.create([{
        Primary_user_id: party.Primary_user_id, cmp_id, accountGroup: party.accountGroup, subGroup: party.subGroup || null,
        party_name: party.partyName, alias: null, party_id, mobile_no: party.mobileNumber || null, email: party.emailID || null,
        bill_date: date, bill_no: sale.voucher_number, billId: String(sale._id), bill_amount: calculated.totals.final_amount,
        bill_due_date: date, bill_pending_amt: calculated.totals.final_amount, classification: "dr", createdBy: String(userId), source: "sale",
      }], { session });
      await createVoucherTimelineEntry(buildVoucherTimelinePayload(sale), session);
      createdSale = sale.toObject();
    });
    return createdSale;
  } finally {
    await session.endSession();
  }
}

export default { createSale };
