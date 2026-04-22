export function formatCurrency(value) {
  return `Rs. ${(Number(value) || 0).toFixed(2)}`;
}

// Compute derived tax and signed impact of an additional-charge row.
export function calculateAdditionalChargeRow(row) {
  const value = Number(row?.value) || 0;
  const taxPercentage = Number(row?.taxPercentage) || 0;
  const taxAmt = (value * taxPercentage) / 100;
  const sign = row?.action === "subtract" ? -1 : 1;
  const finalValue = (value + taxAmt) * sign;

  return {
    ...row,
    value: row?.value ?? "",
    taxPercentage,
    taxAmt,
    finalValue,
  };
}

// Create initial selected-charge draft from master charge definition.
export function buildAdditionalChargeSelection(charge, existingCharge) {
  if (existingCharge) {
    return calculateAdditionalChargeRow(existingCharge);
  }

  return calculateAdditionalChargeRow({
    _id: charge?._id,
    option: charge?.name || "Additional Charge",
    value: "",
    action: "add",
    taxPercentage: Number(charge?.taxPercentage) || 0,
    taxAmt: 0,
    hsn: charge?.hsn || "",
    finalValue: 0,
  });
}
