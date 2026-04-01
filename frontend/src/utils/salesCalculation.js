function toNumber(value) {
  return Number(value) || 0;
}

function roundMoney(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

export function resolveTaxType(companyState, partyState) {
  if (!companyState || !partyState) return "igst";
  return companyState === partyState ? "cgst_sgst" : "igst";
}

function getApplicableGstRate(item, taxType) {
  if (taxType === "cgst_sgst") {
    return toNumber(item?.cgst) + toNumber(item?.sgst);
  }

  return toNumber(item?.igst);
}

export function calculateItemAmounts(item, taxType = "igst") {
  const billedQty = toNumber(item?.billedQty ?? item?.billed_qty ?? item?.quantity);
  const rate = toNumber(item?.rate);
  const discountType = item?.discountType || "percentage";
  const providedDiscountPercentage = toNumber(
    item?.discountPercentage ?? item?.discount_percentage,
  );
  const providedDiscountAmount = toNumber(
    item?.discountAmount ?? item?.discount_amount,
  );
  const taxInclusive = Boolean(item?.taxInclusive ?? item?.tax_inclusive);
  const lineTotal = rate * billedQty;
  const applicableGstRate = getApplicableGstRate(item, taxType);

  const basePrice = taxInclusive
    ? (1 + applicableGstRate / 100) !== 0
      ? lineTotal / (1 + applicableGstRate / 100)
      : lineTotal
    : lineTotal;

  const discountPercentage =
    discountType === "percentage"
      ? providedDiscountPercentage
      : basePrice > 0
        ? (providedDiscountAmount / basePrice) * 100
        : 0;

  const unclampedDiscountAmount =
    discountType === "percentage"
      ? (basePrice * providedDiscountPercentage) / 100
      : providedDiscountAmount;

  const discountAmount = Math.min(
    Math.max(unclampedDiscountAmount, 0),
    basePrice,
  );

  const taxableAmount = Math.max(basePrice - discountAmount, 0);
  const cgstRate = toNumber(item?.cgst);
  const sgstRate = toNumber(item?.sgst);
  const igstRate = toNumber(item?.igst);
  const cessRate = toNumber(item?.cess);
  const addlCessRate = toNumber(item?.addl_cess ?? item?.addlCess);

  const cgstAmount =
    taxType === "cgst_sgst" ? taxableAmount * (cgstRate / 100) : 0;
  const sgstAmount =
    taxType === "cgst_sgst" ? taxableAmount * (sgstRate / 100) : 0;
  const igstAmount =
    taxType === "igst" ? taxableAmount * (igstRate / 100) : 0;
  const taxAmount = cgstAmount + sgstAmount + igstAmount;
  const cessAmount = taxableAmount * (cessRate / 100);
  const addlCessAmount = billedQty * addlCessRate;
  const totalAmount =
    taxableAmount + taxAmount + cessAmount + addlCessAmount;

  return {
    ...item,
    taxType,
    billedQty,
    rate,
    taxRate: roundMoney(applicableGstRate),
    cessRate: roundMoney(cessRate),
    addlCessRate: roundMoney(addlCessRate),
    taxInclusive,
    discountType,
    discountPercentage,
    discountAmount: roundMoney(discountAmount),
    basePrice: roundMoney(basePrice),
    taxableAmount: roundMoney(taxableAmount),
    igstAmount: roundMoney(igstAmount),
    cgstAmount: roundMoney(cgstAmount),
    sgstAmount: roundMoney(sgstAmount),
    taxAmount: roundMoney(taxAmount),
    cessAmount: roundMoney(cessAmount),
    addlCessAmount: roundMoney(addlCessAmount),
    totalAmount: roundMoney(totalAmount),
  };
}

export function calculateItemsWithTotals(items = [], taxType = "igst") {
  const nextItems = items.map((item) => calculateItemAmounts(item, item?.taxType || taxType));

  const rawTotals = nextItems.reduce(
    (accumulator, item) => {
      accumulator.sub_total += toNumber(item?.basePrice);
      accumulator.total_discount += toNumber(item?.discountAmount);
      accumulator.taxable_amount += toNumber(
        item?.taxableAmount ?? item?.taxable_amount,
      );
      accumulator.total_igst_amt += toNumber(
        item?.igstAmount ?? item?.igst_amount,
      );
      accumulator.total_cgst_amt += toNumber(
        item?.cgstAmount ?? item?.cgst_amount,
      );
      accumulator.total_sgst_amt += toNumber(
        item?.sgstAmount ?? item?.sgst_amount,
      );
      accumulator.total_cess_amt += toNumber(
        item?.cessAmount ?? item?.cess_amount,
      );
      accumulator.total_addl_cess_amt += toNumber(
        item?.addlCessAmount ?? item?.addl_cess_amount,
      );
      accumulator.item_total += toNumber(item?.totalAmount);
      return accumulator;
    },
    {
      sub_total: 0,
      total_discount: 0,
      taxable_amount: 0,
      total_igst_amt: 0,
      total_cgst_amt: 0,
      total_sgst_amt: 0,
      total_cess_amt: 0,
      total_addl_cess_amt: 0,
      item_total: 0,
    },
  );

  const totalTaxAmount =
    rawTotals.total_igst_amt +
    rawTotals.total_cgst_amt +
    rawTotals.total_sgst_amt;

  return {
    items: nextItems,
    totals: {
      sub_total: roundMoney(rawTotals.sub_total),
      total_discount: roundMoney(rawTotals.total_discount),
      taxable_amount: roundMoney(rawTotals.taxable_amount),
      total_igst_amt: roundMoney(rawTotals.total_igst_amt),
      total_cgst_amt: roundMoney(rawTotals.total_cgst_amt),
      total_sgst_amt: roundMoney(rawTotals.total_sgst_amt),
      total_cess_amt: roundMoney(rawTotals.total_cess_amt),
      total_addl_cess_amt: roundMoney(rawTotals.total_addl_cess_amt),
      total_tax_amount: roundMoney(totalTaxAmount),
      item_total: roundMoney(rawTotals.item_total),
      subTotal: roundMoney(rawTotals.sub_total),
      totalDiscount: roundMoney(rawTotals.total_discount),
      taxableAmount: roundMoney(rawTotals.taxable_amount),
      totalIgstAmt: roundMoney(rawTotals.total_igst_amt),
      totalCgstAmt: roundMoney(rawTotals.total_cgst_amt),
      totalSgstAmt: roundMoney(rawTotals.total_sgst_amt),
      totalCessAmt: roundMoney(rawTotals.total_cess_amt),
      totalAddlCessAmt: roundMoney(rawTotals.total_addl_cess_amt),
      totalTaxAmount: roundMoney(totalTaxAmount),
      itemTotal: roundMoney(rawTotals.item_total),
    },
  };
}

export function buildItemForCalculation(stagedItem) {
  return {
    billedQty: toNumber(stagedItem?.billedQty ?? stagedItem?.quantity),
    rate: toNumber(stagedItem?.rate),
    taxInclusive: Boolean(stagedItem?.taxInclusive),
    discountType: stagedItem?.discountType || "percentage",
    discountAmount: toNumber(stagedItem?.discountAmount),
    discountPercentage: toNumber(stagedItem?.discountPercentage),
    taxType: stagedItem?.taxType || stagedItem?.productDetail?.taxType || "igst",
    cgst: toNumber(stagedItem?.productDetail?.cgst ?? stagedItem?.cgst),
    sgst: toNumber(stagedItem?.productDetail?.sgst ?? stagedItem?.sgst),
    igst: toNumber(stagedItem?.productDetail?.igst ?? stagedItem?.igst),
    cess: toNumber(stagedItem?.productDetail?.cess ?? stagedItem?.cess),
    addl_cess: toNumber(
      stagedItem?.productDetail?.addl_cess ??
        stagedItem?.productDetail?.addlCess ??
        stagedItem?.addl_cess ??
        stagedItem?.addlCess,
    ),
    taxRate:
      toNumber(stagedItem?.productDetail?.taxRate ?? stagedItem?.taxRate),
  };
}
