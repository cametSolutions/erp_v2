// Current series storage key (new format).
/**
 * Builds localStorage key for persisted voucher series object.
 *
 * Accepts:
 * - `voucherType` string (defaults to `saleOrder` when missing).
 * - `cmp_id` company identifier.
 *
 * Returns:
 * - Namespaced key so each company + voucher type maintains its own preference.
 */
export function getSeriesStorageKey(voucherType, cmp_id) {
  return `lastSeries_${voucherType || "saleOrder"}_${cmp_id}`;
}

// Legacy series storage key kept for backward compatibility migration.
/**
 * Builds previous-format key used before we started storing whole series object.
 * Kept to support migration for existing users.
 */
export function getLegacySeriesStorageKey(voucherType, cmp_id) {
  return `lastSeriesId_${voucherType || "saleOrder"}_${cmp_id}`;
}

/**
 * Reads stored series preference for voucher/company.
 * Falls back to legacy key format when newer key is missing.
 *
 * Accepts:
 * - `voucherType` (saleOrder/receipt/etc.)
 * - `cmp_id` active company id.
 *
 * Returns:
 * - Parsed series object (shape includes `_id` and optionally metadata),
 * - or `{ _id }` synthesized from legacy key,
 * - or `null` when not available/invalid.
 */
export function readStoredSeries(voucherType, cmp_id) {
  if (!cmp_id) return null;

  try {
    const raw = localStorage.getItem(getSeriesStorageKey(voucherType, cmp_id));

    if (raw) {
      return JSON.parse(raw);
    }

    const legacyId = localStorage.getItem(
      getLegacySeriesStorageKey(voucherType, cmp_id),
    );

    return legacyId ? { _id: legacyId } : null;
  } catch (error) {
    console.error("Failed to read stored transaction series", error);
    return null;
  }
}

// Persists selected series and removes legacy key.
/**
 * Persists currently selected voucher series in localStorage.
 *
 * Accepts:
 * - `voucherType`, `cmp_id`, and `series` object.
 *
 * Behavior:
 * - No-op when required ids are missing.
 * - Writes JSON payload to new key.
 * - Deletes legacy key so future reads use single source.
 */
export function persistStoredSeries(voucherType, cmp_id, series) {
  if (!cmp_id || !series?._id) return;

  try {
    localStorage.setItem(
      getSeriesStorageKey(voucherType, cmp_id),
      JSON.stringify(series),
    );
    localStorage.removeItem(getLegacySeriesStorageKey(voucherType, cmp_id));
  } catch (error) {
    console.error("Failed to persist transaction series", error);
  }
}

// Clears sale-order scoped local draft helpers and stored series keys.
/**
 * Clears sale-order specific local draft artifacts for a company.
 * Useful when starting a fresh order flow or resetting stale state.
 */
export function clearSaleOrderDraftStorage(cmp_id) {
  if (!cmp_id) return;

  try {
    localStorage.removeItem(`sale-order-product-filters-${cmp_id}`);
    localStorage.removeItem(getSeriesStorageKey("saleOrder", cmp_id));
    localStorage.removeItem(getLegacySeriesStorageKey("saleOrder", cmp_id));
  } catch (error) {
    console.error("Failed to clear sale order local storage", error);
  }
}
