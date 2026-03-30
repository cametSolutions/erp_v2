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
    party,
    selectedPriceLevel: selectedPriceLevel
      ? {
          _id: selectedPriceLevel?._id,
          name:
            selectedPriceLevel?.pricelevel || selectedPriceLevel?.name || "",
        }
      : null,
    items: items.map((item) => ({
      _id: item?.id,
      product_name: item?.name,
      hsn_code: item?.hsn || "",
      unit: item?.unit || "",
      rate: Number(item?.rate) || 0,
      billedQty: Number(item?.billedQty) || 0,
      actualQty: Number(item?.actualQty) || 0,
      taxRate: Number(item?.taxRate) || 0,
      cgst: Number(item?.cgst) || 0,
      sgst: Number(item?.sgst) || 0,
      igst: Number(item?.igst) || 0,
      cess: Number(item?.cess) || 0,
      addl_cess: Number(item?.addl_cess ?? item?.addlCess) || 0,
      tax_type: item?.taxType || "igst",
      basePrice: Number(item?.basePrice) || 0,
      discountType: item?.discountType || "percentage",
      discountPercentage: Number(item?.discountPercentage) || 0,
      discountAmount: Number(item?.discountAmount) || 0,
      taxableAmount: Number(item?.taxableAmount) || 0,
      taxable_amount:
        Number(item?.taxable_amount ?? item?.taxableAmount) || 0,
      igst_amount: Number(item?.igst_amount) || 0,
      cgst_amount: Number(item?.cgst_amount) || 0,
      sgst_amount: Number(item?.sgst_amount) || 0,
      taxAmount: Number(item?.taxAmount) || 0,
      tax_amount: Number(item?.tax_amount ?? item?.taxAmount) || 0,
      cess_amount: Number(item?.cess_amount) || 0,
      addl_cess_amount: Number(item?.addl_cess_amount) || 0,
      total: Number(item?.totalAmount) || 0,
      totalAmount: Number(item?.totalAmount) || 0,
      total_amount: Number(item?.total_amount ?? item?.totalAmount) || 0,
      taxInclusive: Boolean(item?.taxInclusive),
      isTaxInclusive: Boolean(item?.taxInclusive),
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

export async function createSaleOrder(payload) {

  console.log(payload);
  
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

export const saleOrderService = {
  buildCreateSaleOrderPayload,
  createSaleOrder,
  getSaleOrderById,
};
