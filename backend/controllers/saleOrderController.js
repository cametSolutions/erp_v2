import mongoose from "mongoose";

import SaleOrder from "../Model/SaleOrder.js";
import getNextVoucherNumber from "../utils/getNextVoucherNumber.js";
import getNextTransactionSerialNumbers from "../utils/getNextTransactionSerialNumbers.js";

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

function normalizeSelectedSeries(body = {}) {
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

function mapTotals(body = {}) {
  const totals = normalizeTotals(body);

  return {
    sub_total: totals.subTotal,
    total_discount: totals.totalDiscount,
    taxable_amount: totals.taxableAmount,
    total_tax_amount: totals.totalTaxAmount,
    total_igst_amt: totals.totalIgstAmt,
    total_cgst_amt: totals.totalCgstAmt || 0,
    total_sgst_amt: totals.totalSgstAmt || 0,
    total_cess_amt: totals.totalCessAmt || 0,
    total_addl_cess_amt: totals.totalAddlCessAmt || 0,
    item_total: totals.itemTotal,
    total_additional_charge: totals.totalAdditionalCharge,
    amount_with_additional_charge: totals.amountWithAdditionalCharge,
    round_off: totals.roundOff,
    final_amount: totals.finalAmount,
  };
}

function buildSaleOrderPayload(body, nextVoucher, serialNumbers, userId) {
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
  const tax_type = normalizeTaxType(body);

  return {
    cmp_id: cmpId,
    voucher_type: "saleOrder",
    series_id: selectedSeries?._id,
    series_name: selectedSeries?.seriesName || nextVoucher.series?.seriesName || null,
    voucher_number: nextVoucher.voucherNumber,
    current_series_number: nextVoucher.nextNumber,
    company_level_serial_number: serialNumbers.companyLevelSerialNumber,
    user_level_serial_number: serialNumbers.userLevelSerialNumber,
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
    tax_type,
    price_level_id: priceLevelObject?._id || null,
    price_level_name: priceLevelObject?.pricelevel || priceLevelObject?.name || null,
    items: mapSaleOrderItems(items),
    additional_charges: mapAdditionalCharges(additionalCharges),
    despatch_details: mapDespatchDetails(despatchDetails),
    totals: mapTotals(body),
    status: "open",
    tally_ref: null,
    narration: null,
    created_by: userId || null,
    updated_by: userId || null,
  };
}

export async function createSaleOrder(req, res) {
  const session = await mongoose.startSession();

  try {
    let createdSaleOrder = null;
    const body = req.body || {};
    const cmpId = body.cmpId || body.cmp_id;
    const selectedSeries = normalizeSelectedSeries(body);
    const userId = req.user?._id || req.user?.id || null;

    await session.withTransaction(async () => {
      const nextVoucher = await getNextVoucherNumber({
        cmpId,
        voucherType: "saleOrder",
        seriesId: selectedSeries?._id,
        session,
      });

      const serialNumbers = await getNextTransactionSerialNumbers({
        cmpId,
        transactionType: "saleOrder",
        userId,
        session,
      });

      const saleOrderDoc = buildSaleOrderPayload(
        { ...body, cmpId },
        nextVoucher,
        serialNumbers,
        userId
      );

      console.log("Sale Order Document:", saleOrderDoc);

      const [created] = await SaleOrder.create([saleOrderDoc], { session });
      createdSaleOrder = await SaleOrder.findById(created._id).session(session).lean();
    });

    return res.status(201).json({
      success: true,
      data: {
        saleOrder: createdSaleOrder,
      },
    });
  } catch (error) {
    console.error("createSaleOrder error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create sale order",
    });
  } finally {
    await session.endSession();
  }
}

export async function getSaleOrderById(req, res) {
  try {
    const { saleOrderId } = req.params;
    const cmpId = req.query.cmpId;

    if (!saleOrderId) {
      return res.status(400).json({
        success: false,
        message: "saleOrderId is required",
      });
    }

    const filter = { _id: saleOrderId };
    if (cmpId) {
      filter.cmp_id = cmpId;
    }

    const saleOrder = await SaleOrder.findOne(filter).lean();

    if (!saleOrder) {
      return res.status(404).json({
        success: false,
        message: "Sale order not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        saleOrder,
      },
    });
  } catch (error) {
    console.error("getSaleOrderById error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch sale order",
    });
  }
}

export async function updateSaleOrder(req, res) {
  const session = await mongoose.startSession();

  try {
    const saleOrderId = req.params.saleOrderId || req.params.id;
    const body = req.body || {};
    const cmpId = body.cmpId || body.cmp_id;
    const userId = req.user?._id || req.user?.id || null;

    if (!saleOrderId || !cmpId) {
      return res.status(400).json({
        success: false,
        message: "saleOrderId and cmpId are required",
      });
    }

    let updatedSaleOrder = null;

    await session.withTransaction(async () => {
      const saleOrder = await SaleOrder.findOne({
        _id: saleOrderId,
        cmp_id: cmpId,
      }).session(session);

      if (!saleOrder) {
        throw new Error("SALE_ORDER_NOT_FOUND");
      }

      if (saleOrder.status !== "open") {
        throw new Error(`CANNOT_EDIT_${saleOrder.status}`);
      }

      const priceLevelObject = normalizePriceLevelObject(body);

      saleOrder.date = new Date(body.transactionDate);
      saleOrder.tax_type = normalizeTaxType(body);
      saleOrder.price_level_id = priceLevelObject?._id || null;
      saleOrder.price_level_name =
        priceLevelObject?.pricelevel || priceLevelObject?.name || null;
      saleOrder.items = mapSaleOrderItems(body.items || [], { preserveIds: true });
      saleOrder.additional_charges = mapAdditionalCharges(
        body.additionalCharges || [],
      );
      saleOrder.despatch_details = mapDespatchDetails(body.despatchDetails || {});
      saleOrder.totals = mapTotals(body);
      saleOrder.updated_by = userId || null;

      await saleOrder.save({ session });
      updatedSaleOrder = saleOrder.toObject();
    });

    return res.status(200).json({
      success: true,
      data: {
        saleOrder: updatedSaleOrder,
      },
    });
  } catch (error) {
    console.error("updateSaleOrder error:", error);

    if (error.message === "SALE_ORDER_NOT_FOUND") {
      return res.status(400).json({
        success: false,
        message: "Sale order not found",
      });
    }

    if (error.message?.startsWith("CANNOT_EDIT_")) {
      const status = error.message.replace("CANNOT_EDIT_", "");
      return res.status(400).json({
        success: false,
        message: `Cannot edit a ${status} sale order`,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update sale order",
    });
  } finally {
    await session.endSession();
  }
}

export default {
  createSaleOrder,
  getSaleOrderById,
  updateSaleOrder,
};
