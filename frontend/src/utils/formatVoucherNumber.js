function normalizeVoucherPart(value) {
  if (value == null) return "";
  return String(value).trim();
}

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
