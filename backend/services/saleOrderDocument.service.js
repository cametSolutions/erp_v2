import mongoose from "mongoose";

import { calculateSaleOrderTotals } from "./calculation.service.js";
import { getInitialTransactionStatus } from "./transactionState.service.js";

function firstDefined(...values) {
  return values.find((value) => value !== undefined);
}

function normalizeTotals(body = {}) {
  const totals = body.totals || {};

  return {
    subTotal: Number(firstDefined(totals.subTotal, body.subTotal)) || 0,
    totalDiscount:
      Number(firstDefined(totals.totalDiscount, body.totalDiscount)) || 0,
    taxableAmount:
      Number(firstDefined(totals.taxableAmount, body.taxableAmount)) || 0,
    totalTaxAmount:
      Number(
        firstDefined(
          totals.totalTaxAmount,
          body.totalTaxAmount,
          body.total_tax_amount
        )
      ) || 0,
    totalIgstAmt:
      Number(
        firstDefined(totals.totalIgstAmt, body.totalIgstAmt, body.total_igst_amt)
      ) || 0,
    totalCgstAmt:
      Number(
        firstDefined(totals.totalCgstAmt, body.totalCgstAmt, body.total_cgst_amt)
      ) || 0,
    totalSgstAmt:
      Number(
        firstDefined(totals.totalSgstAmt, body.totalSgstAmt, body.total_sgst_amt)
      ) || 0,
    totalCessAmt:
      Number(
        firstDefined(totals.totalCessAmt, body.totalCessAmt, body.total_cess_amt)
      ) || 0,
    totalAddlCessAmt:
      Number(
        firstDefined(
          totals.totalAddlCessAmt,
          body.totalAddlCessAmt,
          body.total_addl_cess_amt
        )
      ) || 0,
    itemTotal:
      Number(firstDefined(totals.itemTotal, body.itemTotal, body.item_total)) || 0,
    totalAdditionalCharge:
      Number(firstDefined(totals.totalAdditionalCharge, body.totalAdditionalCharge)) ||
      0,
    amountWithAdditionalCharge:
      Number(
        firstDefined(
          totals.amountWithAdditionalCharge,
          body.amountWithAdditionalCharge
        )
      ) || 0,
    finalAmount: Number(firstDefined(totals.finalAmount, body.finalAmount)) || 0,
    roundOff: Number(firstDefined(totals.roundOff, body.roundOff)) || 0,
  };
}

function buildClientTotalsSnapshot(body = {}) {
  const totals = normalizeTotals(body);

  return {
    subtotal: totals.subTotal,
    totalDiscount: totals.totalDiscount,
    totalTax: totals.totalTaxAmount,
    grandTotal: totals.finalAmount,
  };
}

export function normalizeSelectedSeries(body = {}) {
  return (
    body.selectedSeries || {
      _id: body.series_id || null,
      seriesName: body.seriesName || body.selectedSeriesName || null,
    }
  );
}

function normalizePriceLevelObject(body = {}) {
  return body.priceLevelObject || body.selectedPriceLevel || null;
}

function normalizeTaxType(body = {}) {
  return body.tax_type || body.taxType || "igst";
}

function mapSaleOrderItems(items = [], { preserveIds = false } = {}) {
  return items.map((row) => ({
    _id:
      preserveIds && row?._id
        ? row._id
        : new mongoose.Types.ObjectId(),
    item_id: row?.id || row?._id,
    item_name: row?.name || row?.product_name || "",
    hsn: row?.hsn || row?.hsn_code || null,
    unit: row?.unit || null,
    actual_qty: Number(firstDefined(row?.actualQty, row?.actual_qty)) || 0,
    billed_qty: Number(firstDefined(row?.billedQty, row?.billed_qty)) || 0,
    rate: Number(row?.rate) || 0,
    tax_rate: Number(firstDefined(row?.taxRate, row?.tax_rate)) || 0,
    cess_rate:
      Number(
        firstDefined(
          row?.cessRate,
          row?.cess_rate,
          row?.cess,
          row?.cess_percentage
        )
      ) || 0,
    addl_cess_rate:
      Number(
        firstDefined(
          row?.addlCessRate,
          row?.addl_cess_rate,
          row?.addl_cess,
          row?.addlCess,
          row?.addl_cess_percentage
        )
      ) || 0,
    tax_inclusive: Boolean(firstDefined(row?.taxInclusive, row?.tax_inclusive)),
    discount_type: row?.discountType || row?.discount_type || "amount",
    discount_percentage:
      Number(firstDefined(row?.discountPercentage, row?.discount_percentage)) || 0,
    discount_amount:
      Number(firstDefined(row?.discountAmount, row?.discount_amount)) || 0,
    base_price: Number(firstDefined(row?.basePrice, row?.base_price)) || 0,
    taxable_amount:
      Number(firstDefined(row?.taxableAmount, row?.taxable_amount)) || 0,
    igst_amount: Number(firstDefined(row?.igstAmount, row?.igst_amount)) || 0,
    cgst_amount: Number(firstDefined(row?.cgstAmount, row?.cgst_amount)) || 0,
    sgst_amount: Number(firstDefined(row?.sgstAmount, row?.sgst_amount)) || 0,
    tax_amount: Number(firstDefined(row?.taxAmount, row?.tax_amount)) || 0,
    cess_amount: Number(firstDefined(row?.cessAmount, row?.cess_amount)) || 0,
    addl_cess_amount:
      Number(firstDefined(row?.addlCessAmount, row?.addl_cess_amount)) || 0,
    total_amount:
      Number(firstDefined(row?.totalAmount, row?.total_amount, row?.total)) || 0,
    price_level_id: row?.priceLevel || row?.price_level_id || null,
    initial_price_source:
      row?.initialPriceSource || row?.initial_price_source || null,
    description: row?.description || null,
    warranty_card_id: row?.warrantyCardId || row?.warranty_card_id || null,
  }));
}

function mapAdditionalCharges(additionalCharges = []) {
  return additionalCharges.map((charge) => ({
    option: charge?.option || "",
    value: Number(charge?.value) || 0,
    action: charge?.action === "substract" ? "subtract" : charge?.action || "add",
    tax_percentage:
      Number(firstDefined(charge?.taxPercentage, charge?.tax_percentage)) || 0,
    tax_amount: Number(firstDefined(charge?.taxAmt, charge?.tax_amount)) || 0,
    hsn: charge?.hsn || null,
    final_value:
      Number(firstDefined(charge?.finalValue, charge?.final_value)) || 0,
  }));
}

function mapDespatchDetails(despatchDetails = {}) {
  return {
    challan_no: despatchDetails?.challanNo || null,
    container_no: despatchDetails?.containerNo || null,
    despatch_through: despatchDetails?.despatchThrough || null,
    destination: despatchDetails?.destination || null,
    vehicle_no: despatchDetails?.vehicleNo || null,
    order_no: despatchDetails?.orderNo || null,
    terms_of_pay: despatchDetails?.termsOfPay || null,
    terms_of_delivery: despatchDetails?.termsOfDelivery || null,
  };
}

function roundMoney(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

export function buildSaleOrderTotals(body = {}) {
  const calculatedTotals = calculateSaleOrderTotals(
    body.items || [],
    body.additionalCharges || [],
    body.discounts || null
  );
  const normalizedTotals = normalizeTotals(body);
  const totalIgstAmt =
    normalizeTaxType(body) === "igst" ? calculatedTotals.totalTax : 0;
  const splitTaxAmount =
    normalizeTaxType(body) === "cgst_sgst"
      ? roundMoney(calculatedTotals.totalTax / 2)
      : 0;

  return {
    sub_total: calculatedTotals.subtotal,
    total_discount: calculatedTotals.totalDiscount,
    taxable_amount: calculatedTotals.taxableAmount,
    total_tax_amount: calculatedTotals.totalTax,
    total_igst_amt: totalIgstAmt,
    total_cgst_amt: splitTaxAmount,
    total_sgst_amt: splitTaxAmount,
    total_cess_amt: roundMoney(calculatedTotals.totalCess),
    total_addl_cess_amt: roundMoney(calculatedTotals.totalAddlCess),
    item_total: calculatedTotals.itemTotal,
    total_additional_charge: calculatedTotals.totalAdditionalCharge,
    amount_with_additional_charge: calculatedTotals.amountWithAdditionalCharge,
    round_off: normalizedTotals.roundOff || 0,
    final_amount: calculatedTotals.grandTotal,
  };
}

export function logSaleOrderTotalsMismatch(body = {}) {
  const clientTotals = buildClientTotalsSnapshot(body);
  const serverTotals = calculateSaleOrderTotals(
    body.items || [],
    body.additionalCharges || [],
    body.discounts || null
  );

  const hasSignificantDifference = [
    Math.abs((clientTotals.subtotal || 0) - serverTotals.subtotal),
    Math.abs((clientTotals.totalDiscount || 0) - serverTotals.totalDiscount),
    Math.abs((clientTotals.totalTax || 0) - serverTotals.totalTax),
    Math.abs((clientTotals.grandTotal || 0) - serverTotals.grandTotal),
  ].some((difference) => difference > 1);

  if (hasSignificantDifference) {
    console.warn("Sale order totals mismatch detected", {
      clientTotals,
      serverTotals,
    });
  }
}

export function buildSaleOrderPayload(body, voucher, serials, userId) {
  const {
    cmpId,
    transactionDate,
    despatchDetails = {},
    party = {},
    items = [],
    additionalCharges = [],
  } = body;

  const selectedSeries = normalizeSelectedSeries(body);
  const priceLevelObject = normalizePriceLevelObject(body);

  return {
    cmp_id: cmpId,
    voucher_type: "saleOrder",
    series_id: selectedSeries?._id,
    series_name: selectedSeries?.seriesName || voucher.series?.seriesName || null,
    voucher_number: voucher.voucherNumber,
    current_series_number: voucher.nextNumber,
    company_level_serial_number: serials.companyLevelSerialNumber,
    user_level_serial_number: serials.userLevelSerialNumber,
    date: new Date(transactionDate),
    party_id: party?._id,
    party_snapshot: {
      name: party?.partyName || "",
      gst_no: party?.gstNo || null,
      billing_address: party?.billingAddress || null,
      shipping_address: party?.shippingAddress || null,
      mobile: party?.mobileNumber || null,
      state: party?.state || null,
    },
    tax_type: normalizeTaxType(body),
    price_level_id: priceLevelObject?._id || null,
    price_level_name: priceLevelObject?.pricelevel || priceLevelObject?.name || null,
    items: mapSaleOrderItems(items),
    additional_charges: mapAdditionalCharges(additionalCharges),
    despatch_details: mapDespatchDetails(despatchDetails),
    totals: buildSaleOrderTotals(body),
    status: getInitialTransactionStatus("saleOrder"),
    tally_ref: null,
    narration: null,
    created_by: userId || null,
    updated_by: userId || null,
  };
}

export function applySaleOrderUpdate(saleOrder, data = {}, userId = null) {
  const priceLevelObject = normalizePriceLevelObject(data);

  saleOrder.date = new Date(data.transactionDate);
  saleOrder.tax_type = normalizeTaxType(data);
  saleOrder.price_level_id = priceLevelObject?._id || null;
  saleOrder.price_level_name =
    priceLevelObject?.pricelevel || priceLevelObject?.name || null;
  saleOrder.items = mapSaleOrderItems(data.items || [], { preserveIds: true });
  saleOrder.additional_charges = mapAdditionalCharges(data.additionalCharges || []);
  saleOrder.despatch_details = mapDespatchDetails(data.despatchDetails || {});
  saleOrder.totals = buildSaleOrderTotals(data);
  saleOrder.updated_by = userId || null;

  return saleOrder;
}

export default {
  applySaleOrderUpdate,
  buildSaleOrderPayload,
  buildSaleOrderTotals,
  logSaleOrderTotalsMismatch,
  normalizeSelectedSeries,
};
