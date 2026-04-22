/**
 * Converts internal voucher type keys (example: `saleOrder`) into
 * user-facing labels (example: `Sale Order`).
 *
 * Accepts:
 * - camelCase or PascalCase strings used in routes/config/api payloads.
 *
 * Returns:
 * - Title-cased, space-separated label for UI headings/dropdowns.
 * - Fallback `"Voucher Type"` when input is missing.
 */
export const formatVoucherType = (voucherType) => {
  if (!voucherType) return "Voucher Type";

  return voucherType
    ?.replace(/([A-Z])/g, " $1") // insert space before capital letters
    ?.replace(/^./, (str) => str.toUpperCase()) // capitalize first character
    ?.replace(/\b\w/g, (char) => char.toUpperCase()); // capitalize first letter of each word
};
