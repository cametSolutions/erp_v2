import api from "@/api/client/apiClient";

function normalizeOptionalVoucherPart(value) {
  if (value == null) return undefined;

  const normalized = String(value).trim();
  return normalized ? normalized : undefined;
}

export function buildCreateSaleOrderPayload({
  cmp_id,
  party,
  items = [],
  despatchDetails,
  additionalCharges,
  totals,
  selectedPriceLevel,
  headerPayload = {},
}) {
  const sanitizedHeaderPayload = {
    ...headerPayload,
    voucherPrefix: normalizeOptionalVoucherPart(headerPayload?.voucherPrefix),
    voucherSuffix: normalizeOptionalVoucherPart(headerPayload?.voucherSuffix),
  };

  return {
    ...sanitizedHeaderPayload,
    cmp_id,
    cmpId: cmp_id,
    party,
    selectedPriceLevel: selectedPriceLevel
      ? {
          _id: selectedPriceLevel?._id,
          name:
            selectedPriceLevel?.pricelevel || selectedPriceLevel?.name || "",
        }
      : null,
    items: items.map((item) => ({
      _id: item?._id ?? null,
      id: item?.id ?? item?._id,
      name: item?.name ?? item?.product_name ?? "",
      hsn: item?.hsn ?? item?.hsn_code ?? "",
      unit: item?.unit || "",
      rate: Number(item?.rate) || 0,
      billedQty: Number(item?.billedQty ?? item?.billed_qty) || 0,
      actualQty: Number(item?.actualQty ?? item?.actual_qty) || 0,
      taxRate: Number(item?.taxRate ?? item?.tax_rate) || 0,
      cgst: Number(item?.cgst) || 0,
      sgst: Number(item?.sgst) || 0,
      igst: Number(item?.igst) || 0,
      cessRate: Number(item?.cessRate ?? item?.cess_rate ?? item?.cess) || 0,
      addlCessRate:
        Number(
          item?.addlCessRate ??
            item?.addl_cess_rate ??
            item?.addl_cess ??
            item?.addlCess
        ) || 0,
      taxType: item?.taxType || "igst",
      basePrice: Number(item?.basePrice ?? item?.base_price) || 0,
      discountType: item?.discountType || "percentage",
      discountPercentage:
        Number(item?.discountPercentage ?? item?.discount_percentage) || 0,
      discountAmount:
        Number(item?.discountAmount ?? item?.discount_amount) || 0,
      taxableAmount: Number(item?.taxableAmount ?? item?.taxable_amount) || 0,
      igstAmount: Number(item?.igstAmount ?? item?.igst_amount) || 0,
      cgstAmount: Number(item?.cgstAmount ?? item?.cgst_amount) || 0,
      sgstAmount: Number(item?.sgstAmount ?? item?.sgst_amount) || 0,
      taxAmount: Number(item?.taxAmount ?? item?.tax_amount) || 0,
      cessAmount: Number(item?.cessAmount ?? item?.cess_amount) || 0,
      addlCessAmount:
        Number(item?.addlCessAmount ?? item?.addl_cess_amount) || 0,
      totalAmount: Number(item?.totalAmount ?? item?.total_amount) || 0,
      taxInclusive: Boolean(item?.taxInclusive ?? item?.tax_inclusive),
      description: item?.description || "",
    })),
    despatchDetails,
    additionalCharges,
    subTotal: Number(totals?.subTotal) || 0,
    totalDiscount: Number(totals?.totalDiscount) || 0,
    taxableAmount: Number(totals?.taxableAmount) || 0,
    total_igst_amt: Number(totals?.total_igst_amt ?? totals?.totalIgstAmt) || 0,
    total_cgst_amt: Number(totals?.total_cgst_amt ?? totals?.totalCgstAmt) || 0,
    total_sgst_amt: Number(totals?.total_sgst_amt ?? totals?.totalSgstAmt) || 0,
    total_cess_amt: Number(totals?.total_cess_amt ?? totals?.totalCessAmt) || 0,
    total_addl_cess_amt:
      Number(totals?.total_addl_cess_amt ?? totals?.totalAddlCessAmt) || 0,
    totalTaxAmount: Number(totals?.totalTaxAmount) || 0,
    total_tax_amount:
      Number(totals?.total_tax_amount ?? totals?.totalTaxAmount) || 0,
    item_total: Number(totals?.item_total ?? totals?.itemTotal) || 0,
    totalAdditionalCharge: Number(totals?.totalAdditionalCharge) || 0,
    amountWithAdditionalCharge: Number(totals?.amountWithAdditionalCharge) || 0,
    finalAmount: Number(totals?.finalAmount) || 0,
  };
}

export function buildUpdateSaleOrderPayload({
  cmp_id,
  party,
  items = [],
  despatchDetails,
  additionalCharges,
  totals,
  selectedPriceLevel,
  selectedSeries,
  headerPayload = {},
}) {
  const basePayload = buildCreateSaleOrderPayload({
    cmp_id,
    party,
    items,
    despatchDetails,
    additionalCharges,
    totals,
    selectedPriceLevel,
    headerPayload,
  });

  return {
    ...basePayload,
    selectedSeries: selectedSeries
      ? {
          _id: selectedSeries?._id,
          seriesName: selectedSeries?.seriesName || "",
          voucherNumber: selectedSeries?.voucherNumber || "",
        }
      : null,
  };
}

export async function createSaleOrder(payload) {
  const response = await api.post("/sUsers/createSaleOrder", payload, {
    headers: { "Content-Type": "application/json" },
    withCredentials: true,
  });

  return response.data;
}

export async function getSaleOrderById(saleOrderId, { cmpId, ...options } = {}) {
  if (!saleOrderId) return null;

  const response = await api.get(`/sUsers/saleOrders/${saleOrderId}`, {
    params: cmpId ? { cmpId } : {},
    skipGlobalLoader: true,
    ...options,
  });

  return response.data?.data?.saleOrder || null;
}

export async function updateSaleOrder(saleOrderId, payload) {
  const response = await api.put(`/sUsers/saleOrders/${saleOrderId}`, payload, {
    headers: { "Content-Type": "application/json" },
    withCredentials: true,
  });

  return response.data;
}

export const saleOrderService = {
  buildCreateSaleOrderPayload,
  buildUpdateSaleOrderPayload,
  createSaleOrder,
  getSaleOrderById,
  updateSaleOrder,
};
