export function getSeriesStorageKey(voucherType, cmp_id) {
  return `lastSeries_${voucherType || "saleOrder"}_${cmp_id}`;
}

export function getLegacySeriesStorageKey(voucherType, cmp_id) {
  return `lastSeriesId_${voucherType || "saleOrder"}_${cmp_id}`;
}

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
