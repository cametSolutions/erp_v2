/**
 * Normalizes any voucher number segment before composing the final display string.
 *
 * Accepts:
 * - `string | number | null | undefined`
 *
 * Returns:
 * - A trimmed string.
 * - Empty string when input is null/undefined.
 */
function normalizeVoucherPart(value) {
  if (value == null) return "";
  return String(value).trim();
}

/**
 * Builds a human-friendly voucher number from optional prefix/number/suffix parts.
 *
 * Structure rules:
 * - All input parts are normalized through `normalizeVoucherPart`.
 * - `/` separators are only inserted between parts that actually exist.
 * - When only one part exists, that part is returned directly.
 *
 * Accepts:
 * - `prefix`: Optional text before the numeric part.
 * - `number`: Main numeric token (usually already padded by caller).
 * - `suffix`: Optional text after the numeric part.
 *
 * Returns:
 * - A single formatted voucher string suitable for UI labels.
 */
export function formatVoucherNumber(prefix, number, suffix) {
  const normalizedPrefix = normalizeVoucherPart(prefix);
  const normalizedNumber = normalizeVoucherPart(number);
  const normalizedSuffix = normalizeVoucherPart(suffix);

  if (normalizedPrefix && normalizedNumber && normalizedSuffix) {
    return `${normalizedPrefix} / ${normalizedNumber} / ${normalizedSuffix}`;
  }

  if (normalizedPrefix && normalizedNumber) {
    return `${normalizedPrefix} / ${normalizedNumber}`;
  }

  if (normalizedNumber && normalizedSuffix) {
    return `${normalizedNumber} / ${normalizedSuffix}`;
  }

  return normalizedNumber || normalizedPrefix || normalizedSuffix;
}
