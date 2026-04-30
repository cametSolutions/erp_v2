function roundMoney(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function toPaise(value) {
  return Math.round((Number(value) || 0) * 100);
}

function fromPaise(value) {
  return roundMoney((Number(value) || 0) / 100);
}

function firstDefined(...values) {
  return values.find((value) => value !== undefined);
}

function resolveItemQuantity(item = {}) {
  return Number(
    firstDefined(item?.billedQty, item?.billed_qty, item?.qty, item?.quantity)
  ) || 0;
}

function resolveItemRate(item = {}) {
  return Number(item?.rate) || 0;
}

function resolveItemTaxRate(item = {}) {
  return Number(firstDefined(item?.taxRate, item?.tax_rate, item?.gst)) || 0;
}

function resolveItemTaxInclusive(item = {}) {
  return Boolean(firstDefined(item?.taxInclusive, item?.tax_inclusive));
}

function resolveItemCessRate(item = {}) {
  return Number(firstDefined(item?.cessRate, item?.cess_rate, item?.cess)) || 0;
}

function resolveItemAddlCessRate(item = {}) {
  return (
    Number(
      firstDefined(
        item?.addlCessRate,
        item?.addl_cess_rate,
        item?.addl_cess,
        item?.addlCess,
      )
    ) || 0
  );
}

function resolveItemDiscount(item = {}, lineSubtotalPaise = 0) {
  const discountType = item?.discountType || item?.discount_type || "amount";
  const discountAmount = Number(
    firstDefined(item?.discountAmount, item?.discount_amount)
  ) || 0;
  const discountPercentage = Number(
    firstDefined(item?.discountPercentage, item?.discount_percentage)
  ) || 0;

  const resolvedDiscountPaise =
    discountType === "percentage"
      ? Math.round(lineSubtotalPaise * (discountPercentage / 100))
      : toPaise(discountAmount);

  return Math.min(Math.max(resolvedDiscountPaise, 0), lineSubtotalPaise);
}

function resolveChargeAmountPaise(charge = {}) {
  return resolveChargeBreakdownPaise(charge).finalValuePaise;
}

function resolveChargeRate(charge = {}, key, legacyFallback = 0) {
  const explicitRate = Number(firstDefined(charge?.[key], charge?.[key])) || 0;
  if (explicitRate > 0) return explicitRate;
  return Number(legacyFallback) || 0;
}

function resolveChargeBreakdownPaise(charge = {}, taxType = "igst") {
  const normalizedAction =
    charge?.action === "subtract" || charge?.action === "substract"
      ? "subtract"
      : "add";
  const sign = normalizedAction === "subtract" ? -1 : 1;
  const baseValuePaise = toPaise(charge?.value);
  const legacyTaxPercentage = Number(
    firstDefined(charge?.taxPercentage, charge?.tax_percentage)
  ) || 0;

  const igstRate =
    taxType === "igst"
      ? resolveChargeRate(charge, "igst", legacyTaxPercentage)
      : 0;
  const cgstRate =
    taxType === "cgst_sgst"
      ? resolveChargeRate(charge, "cgst", legacyTaxPercentage / 2)
      : 0;
  const sgstRate =
    taxType === "cgst_sgst"
      ? resolveChargeRate(charge, "sgst", legacyTaxPercentage / 2)
      : 0;
  const igstAmountPaise = Math.round(baseValuePaise * (igstRate / 100));
  const cgstAmountPaise = Math.round(baseValuePaise * (cgstRate / 100));
  const sgstAmountPaise = Math.round(baseValuePaise * (sgstRate / 100));
  const explicitTaxAmount = firstDefined(charge?.taxAmt, charge?.tax_amount);
  const derivedTaxAmountPaise =
    igstAmountPaise + cgstAmountPaise + sgstAmountPaise;
  const hasSplitTaxDefinition =
    igstRate > 0 ||
    cgstRate > 0 ||
    sgstRate > 0 ||
    firstDefined(
      charge?.igstAmount,
      charge?.igst_amount,
      charge?.cgstAmount,
      charge?.cgst_amount,
      charge?.sgstAmount,
      charge?.sgst_amount
    ) !== undefined;
  const taxAmountPaise =
    explicitTaxAmount !== undefined &&
    explicitTaxAmount !== null &&
    !hasSplitTaxDefinition
      ? toPaise(explicitTaxAmount)
      : derivedTaxAmountPaise;
  const cessAmountPaise = 0;
  const addlCessAmountPaise = 0;
  const stateCessAmountPaise = 0;
  const explicitFinalValue = firstDefined(charge?.finalValue, charge?.final_value);

  if (explicitFinalValue !== undefined && explicitFinalValue !== null) {
    const finalValuePaise = toPaise(explicitFinalValue);

    if (finalValuePaise < 0) {
      return {
        baseValuePaise: baseValuePaise * sign,
        igstAmountPaise: igstAmountPaise * sign,
        cgstAmountPaise: cgstAmountPaise * sign,
        sgstAmountPaise: sgstAmountPaise * sign,
        taxAmountPaise: taxAmountPaise * sign,
        cessAmountPaise: cessAmountPaise * sign,
        addlCessAmountPaise: addlCessAmountPaise * sign,
        stateCessAmountPaise: stateCessAmountPaise * sign,
        finalValuePaise,
      };
    }

    return {
      baseValuePaise: baseValuePaise * sign,
      igstAmountPaise: igstAmountPaise * sign,
      cgstAmountPaise: cgstAmountPaise * sign,
      sgstAmountPaise: sgstAmountPaise * sign,
      taxAmountPaise: taxAmountPaise * sign,
      cessAmountPaise: cessAmountPaise * sign,
      addlCessAmountPaise: addlCessAmountPaise * sign,
      stateCessAmountPaise: stateCessAmountPaise * sign,
      finalValuePaise: finalValuePaise * sign,
    };
  }

  return {
    baseValuePaise: baseValuePaise * sign,
    igstAmountPaise: igstAmountPaise * sign,
    cgstAmountPaise: cgstAmountPaise * sign,
    sgstAmountPaise: sgstAmountPaise * sign,
    taxAmountPaise: taxAmountPaise * sign,
    cessAmountPaise: cessAmountPaise * sign,
    addlCessAmountPaise: addlCessAmountPaise * sign,
    stateCessAmountPaise: stateCessAmountPaise * sign,
    finalValuePaise:
      (baseValuePaise +
        taxAmountPaise +
        cessAmountPaise +
        addlCessAmountPaise +
        stateCessAmountPaise) * sign,
  };
}

function resolveDocumentDiscountPaise(discounts) {
  if (discounts == null) return 0;

  if (Array.isArray(discounts)) {
    return discounts.reduce(
      (sum, discount) =>
        sum + toPaise(firstDefined(discount?.amount, discount?.value, discount)),
      0
    );
  }

  if (typeof discounts === "object") {
    return toPaise(
      firstDefined(discounts?.amount, discounts?.value, discounts?.totalDiscount)
    );
  }

  return toPaise(discounts);
}

export function calculateSaleOrderTotals(
  items = [],
  charges = [],
  discounts = null,
  taxType = "igst",
) {
  const normalizedItems = Array.isArray(items) ? items : [];
  const normalizedCharges = Array.isArray(charges) ? charges : [];

  let subtotalPaise = 0;
  let totalDiscountPaise = 0;
  let totalTaxPaise = 0;
  let totalCessPaise = 0;
  let totalAddlCessPaise = 0;
  let totalAdditionalChargeTaxPaise = 0;
  let totalAdditionalChargeIgstPaise = 0;
  let totalAdditionalChargeCgstPaise = 0;
  let totalAdditionalChargeSgstPaise = 0;
  let totalAdditionalChargeCessPaise = 0;
  let totalAdditionalChargeAddlCessPaise = 0;
  let totalAdditionalChargeStateCessPaise = 0;

  normalizedItems.forEach((item) => {
    const quantity = resolveItemQuantity(item);
    const rate = resolveItemRate(item);
    const lineTotalPaise = toPaise(quantity * rate);
    const taxRate = resolveItemTaxRate(item);
    const taxInclusive = resolveItemTaxInclusive(item);
    const itemSubtotalPaise = taxInclusive
      ? taxRate > 0
        ? Math.round(lineTotalPaise / (1 + taxRate / 100))
        : lineTotalPaise
      : lineTotalPaise;
    const itemDiscountPaise = resolveItemDiscount(item, itemSubtotalPaise);
    const taxablePaise = Math.max(itemSubtotalPaise - itemDiscountPaise, 0);
    const itemTaxPaise = Math.round(taxablePaise * (taxRate / 100));
    const itemCessPaise = Math.round(
      taxablePaise * (resolveItemCessRate(item) / 100)
    );
    const itemAddlCessPaise = Math.round(
      quantity * resolveItemAddlCessRate(item) * 100
    );

    subtotalPaise += itemSubtotalPaise;
    totalDiscountPaise += itemDiscountPaise;
    totalTaxPaise += itemTaxPaise;
    totalCessPaise += itemCessPaise;
    totalAddlCessPaise += itemAddlCessPaise;
  });

  const chargeTotalPaise = normalizedCharges.reduce((sum, charge) => {
    const breakdown = resolveChargeBreakdownPaise(charge, taxType);
    totalAdditionalChargeTaxPaise += breakdown.taxAmountPaise;
    totalAdditionalChargeIgstPaise += breakdown.igstAmountPaise;
    totalAdditionalChargeCgstPaise += breakdown.cgstAmountPaise;
    totalAdditionalChargeSgstPaise += breakdown.sgstAmountPaise;
    totalAdditionalChargeCessPaise += breakdown.cessAmountPaise;
    totalAdditionalChargeAddlCessPaise += breakdown.addlCessAmountPaise;
    totalAdditionalChargeStateCessPaise += breakdown.stateCessAmountPaise;
    return sum + breakdown.finalValuePaise;
  }, 0);
  const documentDiscountPaise = resolveDocumentDiscountPaise(discounts);

  totalDiscountPaise += documentDiscountPaise;

  const grandTotalPaise =
    subtotalPaise -
    totalDiscountPaise +
    totalTaxPaise +
    totalCessPaise +
    totalAddlCessPaise +
    chargeTotalPaise;

  return {
    subtotal: fromPaise(subtotalPaise),
    taxableAmount: fromPaise(Math.max(subtotalPaise - totalDiscountPaise, 0)),
    totalDiscount: fromPaise(totalDiscountPaise),
    totalTax: fromPaise(totalTaxPaise),
    totalCess: fromPaise(totalCessPaise),
    totalAddlCess: fromPaise(totalAddlCessPaise),
    itemTotal: fromPaise(
      Math.max(subtotalPaise - totalDiscountPaise, 0) +
        totalTaxPaise +
        totalCessPaise +
        totalAddlCessPaise
    ),
    totalAdditionalCharge: fromPaise(chargeTotalPaise),
    totalAdditionalChargeTax: fromPaise(totalAdditionalChargeTaxPaise),
    totalAdditionalChargeIgst: fromPaise(totalAdditionalChargeIgstPaise),
    totalAdditionalChargeCgst: fromPaise(totalAdditionalChargeCgstPaise),
    totalAdditionalChargeSgst: fromPaise(totalAdditionalChargeSgstPaise),
    totalAdditionalChargeCess: fromPaise(totalAdditionalChargeCessPaise),
    totalAdditionalChargeAddlCess: fromPaise(
      totalAdditionalChargeAddlCessPaise
    ),
    totalAdditionalChargeStateCess: fromPaise(
      totalAdditionalChargeStateCessPaise
    ),
    amountWithAdditionalCharge: fromPaise(Math.max(grandTotalPaise, 0)),
    grandTotal: fromPaise(Math.max(grandTotalPaise, 0)),
  };
}

export default calculateSaleOrderTotals;
