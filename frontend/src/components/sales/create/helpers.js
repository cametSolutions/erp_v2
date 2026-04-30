import { calculateAdditionalChargeAmounts } from "@/utils/salesCalculation";

export function formatCurrency(value) {
  return `Rs. ${(Number(value) || 0).toFixed(2)}`;
}

// Compute derived tax and signed impact of an additional-charge row.
export function calculateAdditionalChargeRow(row, taxType = "igst") {
  return calculateAdditionalChargeAmounts(row, taxType);
}

// Create initial selected-charge draft from master charge definition.
export function buildAdditionalChargeSelection(
  charge,
  existingCharge,
  taxType = "igst",
) {
  if (existingCharge) {
    return calculateAdditionalChargeRow(existingCharge, taxType);
  }

  return calculateAdditionalChargeRow({
    _id: charge?._id,
    option: charge?.name || "Additional Charge",
    value: "",
    action: "add",
    igst: Number(charge?.igst) || 0,
    cgst: Number(charge?.cgst) || 0,
    sgst: Number(charge?.sgst) || 0,
    cess: Number(charge?.cess) || 0,
    addl_cess: Number(charge?.addl_cess) || 0,
    state_cess: Number(charge?.state_cess) || 0,
    hsn: charge?.hsn || "",
    finalValue: 0,
  }, taxType);
}
