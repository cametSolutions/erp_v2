import { createSlice } from "@reduxjs/toolkit";
import { calculateItemAmounts, calculateItemsWithTotals } from "@/utils/salesCalculation";
import { formatVoucherNumber } from "@/utils/formatVoucherNumber";

function normalizeAdditionalCharge(row) {
  const baseValue = Number(row?.value) || 0;
  const taxPercentage = Number(row?.taxPercentage) || 0;
  const taxAmt = (baseValue * taxPercentage) / 100;
  const sign = row?.action === "subtract" ? -1 : 1;
  const finalValue = (baseValue + taxAmt) * sign;

  return {
    ...row,
    value: row?.value ?? "",
    action: row?.action === "subtract" ? "subtract" : "add",
    taxPercentage,
    taxAmt,
    finalValue,
  };
}

function enrichSelectedSeries(series) {
  if (!series) return null;

  const currentNumber = Number(series?.currentNumber) || 0;
  const voucherNumber = String(currentNumber).padStart(
    Number(series?.widthOfNumericalPart) || 1,
    "0",
  );
  const prefix = series?.prefix || "";
  const suffix = series?.suffix || "";

  return {
    _id: series?._id || null,
    seriesName: series?.seriesName || "",
    currentNumber,
    prefix,
    suffix,
    widthOfNumericalPart: Number(series?.widthOfNumericalPart) || 1,
    voucherNumber: formatVoucherNumber(prefix, voucherNumber, suffix),
  };
}

export function recalculateItem(item) {
  return calculateItemAmounts(item, item?.taxType || "igst");
}

function resolveItemPriceLevelRate(item, nextPriceLevel) {
  if (!nextPriceLevel || !Array.isArray(item?.priceLevels)) return null;

  const match = item.priceLevels.find(
    (level) =>
      level?.priceLevel?.toString() === nextPriceLevel?.toString(),
  );

  return match?.priceRate ?? null;
}

function repriceAllItemsInternal(state) {
  state.items = state.items.map((item) => {
    const nextItem = {
      ...item,
      priceLevel: state.priceLevel,
    };

    if (state.priceLevel) {
      const nextRate = resolveItemPriceLevelRate(nextItem, state.priceLevel);
      nextItem.rate = nextRate != null ? Number(nextRate) || 0 : 0;
      nextItem.initialPriceSource = "priceLevel";
      return recalculateItem(nextItem);
    }

    if (nextItem.initialPriceSource === "priceLevel") {
      nextItem.rate = 0;
    }

    return recalculateItem(nextItem);
  });
}

function recalculateTotals(state) {
  const { items, totals: itemTotals } = calculateItemsWithTotals(
    state.items,
    state.taxType,
  );
  state.items = items;

  const totalAdditionalCharge = state.additionalCharges.reduce(
    (accumulator, charge) => accumulator + (Number(charge?.finalValue) || 0),
    0,
  );

  state.totals = {
    ...itemTotals,
    totalAdditionalCharge,
    amountWithAdditionalCharge: itemTotals.itemTotal + totalAdditionalCharge,
    finalAmount: itemTotals.itemTotal + totalAdditionalCharge,
  };
}

const initialState = {
  cmp_id: null,
  voucherType: "saleOrder",
  transactionDate: null,
  selectedSeries: null,
  taxType: "igst",
  despatchDetails: {
    title: "Despatch Details",
    challanNo: "",
    containerNo: "",
    despatchThrough: "",
    destination: "",
    vehicleNo: "",
    orderNo: "",
    termsOfPay: "",
    termsOfDelivery: "",
  },
  party: null,
  priceLevel: null,
  priceLevelObject: null,
  editingOrderId: null,
  items: [],
  additionalCharges: [],
  totals: {
    subTotal: 0,
    totalDiscount: 0,
    taxableAmount: 0,
    totalTaxAmount: 0,
    totalIgstAmt: 0,
    totalCgstAmt: 0,
    totalSgstAmt: 0,
    totalCessAmt: 0,
    totalAddlCessAmt: 0,
    itemTotal: 0,
    totalAdditionalCharge: 0,
    amountWithAdditionalCharge: 0,
    finalAmount: 0,
    roundOff: 0,
  },
};

function clearSaleOrderStorage(cmp_id) {
  if (!cmp_id) return;

  try {
    localStorage.removeItem(`sale-order-product-filters-${cmp_id}`);
    localStorage.removeItem(`lastSeries_saleOrder_${cmp_id}`);
    localStorage.removeItem(`lastSeriesId_saleOrder_${cmp_id}`);
  } catch (error) {
    console.error("Failed to clear sale order local storage", error);
  }
}

function getSeriesStorageKey(voucherType, cmp_id) {
  return `lastSeries_${voucherType || "saleOrder"}_${cmp_id}`;
}

function getLegacySeriesStorageKey(voucherType, cmp_id) {
  return `lastSeriesId_${voucherType || "saleOrder"}_${cmp_id}`;
}

function mapSaleOrderParty(doc = {}) {
  const snapshot = doc?.party_snapshot || {};

  return {
    _id: doc?.party_id || null,
    partyName: snapshot?.name || "",
    gstNo: snapshot?.gst_no || "",
    billingAddress: snapshot?.billing_address || "",
    shippingAddress: snapshot?.shipping_address || "",
    mobileNumber: snapshot?.mobile || "",
    state: snapshot?.state || "",
  };
}

function mapSaleOrderItem(row = {}, taxType = "igst") {
  return recalculateItem({
    _id: row?._id || null,
    id: row?.item_id || null,
    name: row?.item_name || "",
    hsn: row?.hsn || "",
    unit: row?.unit || "",
    actualQty: Number(row?.actual_qty) || 0,
    billedQty: Number(row?.billed_qty) || 0,
    rate: Number(row?.rate) || 0,
    taxRate: Number(row?.tax_rate) || 0,
    cgst: taxType === "cgst_sgst" ? Number(row?.tax_rate) / 2 || 0 : 0,
    sgst: taxType === "cgst_sgst" ? Number(row?.tax_rate) / 2 || 0 : 0,
    igst: taxType === "igst" ? Number(row?.tax_rate) || 0 : 0,
    cess: Number(row?.cess_rate) || 0,
    addl_cess: Number(row?.addl_cess_rate) || 0,
    taxType,
    priceLevel: row?.price_level_id || null,
    priceLevels: Array.isArray(row?.priceLevels) ? row.priceLevels : [],
    initialPriceSource: "saved",
    taxInclusive: Boolean(row?.tax_inclusive),
    discountType: row?.discount_type || "amount",
    discountPercentage: Number(row?.discount_percentage) || 0,
    discountAmount: Number(row?.discount_amount) || 0,
    basePrice: Number(row?.base_price) || 0,
    taxableAmount: Number(row?.taxable_amount) || 0,
    igstAmount: Number(row?.igst_amount) || 0,
    cgstAmount: Number(row?.cgst_amount) || 0,
    sgstAmount: Number(row?.sgst_amount) || 0,
    taxAmount: Number(row?.tax_amount) || 0,
    cessAmount: Number(row?.cess_amount) || 0,
    addlCessAmount: Number(row?.addl_cess_amount) || 0,
    totalAmount: Number(row?.total_amount) || 0,
    description: row?.description || "",
    warrantyCardId: row?.warranty_card_id || null,
  });
}

function mapSaleOrderAdditionalCharge(charge = {}) {
  return normalizeAdditionalCharge({
    _id: charge?._id || null,
    option: charge?.option || "",
    value: charge?.value ?? "",
    action: charge?.action === "subtract" ? "subtract" : "add",
    taxPercentage: Number(charge?.tax_percentage) || 0,
    taxAmt: Number(charge?.tax_amount) || 0,
    hsn: charge?.hsn || "",
    finalValue: Number(charge?.final_value) || 0,
  });
}

function mapSaleOrderDespatchDetails(details = {}) {
  return {
    ...initialState.despatchDetails,
    challanNo: details?.challan_no || "",
    containerNo: details?.container_no || "",
    despatchThrough: details?.despatch_through || "",
    destination: details?.destination || "",
    vehicleNo: details?.vehicle_no || "",
    orderNo: details?.order_no || "",
    termsOfPay: details?.terms_of_pay || "",
    termsOfDelivery: details?.terms_of_delivery || "",
  };
}

const transactionSlice = createSlice({
  name: "transaction",
  initialState,
  reducers: {
    setCompany(state, action) {
      state.cmp_id = action.payload?.cmp_id ?? null;
    },
    setVoucherType(state, action) {
      state.voucherType = action.payload || "saleOrder";
      state.selectedSeries = null;
    },
    setTransactionDate(state, action) {
      state.transactionDate = action.payload?.transactionDate ?? null;
    },
    setSelectedSeries(state, action) {
      const { series, cmp_id } = action.payload || {};
      const enrichedSeries = enrichSelectedSeries(series);
      state.selectedSeries = enrichedSeries;

      if (!enrichedSeries?._id || !cmp_id) return;

      try {
        localStorage.setItem(
          getSeriesStorageKey(state.voucherType, cmp_id),
          JSON.stringify(enrichedSeries),
        );
      } catch (error) {
        console.error("Failed to persist last series id", error);
      }
    },
    hydrateSelectedSeries(state, action) {
      const { cmp_id } = action.payload || {};
      if (!cmp_id) return;

      try {
        const raw = localStorage.getItem(
          getSeriesStorageKey(state.voucherType, cmp_id)
        );

        if (raw) {
          state.selectedSeries = enrichSelectedSeries(JSON.parse(raw));
          return;
        }

        const legacyId = localStorage.getItem(
          getLegacySeriesStorageKey(state.voucherType, cmp_id)
        );
        state.selectedSeries = legacyId ? { _id: legacyId } : null;
      } catch (error) {
        console.error("Failed to hydrate last series id", error);
      }
    },
    setDespatchDetails(state, action) {
      state.despatchDetails = {
        ...state.despatchDetails,
        ...action.payload,
      };
    },
    resetDespatchDetails(state) {
      state.despatchDetails = { ...initialState.despatchDetails };
    },
    setParty(state, action) {
      const party = action.payload || null;
      state.party = party;
      state.taxType = party?.taxType || "igst";
      state.items = state.items.map((item) => ({
        ...item,
        taxType: party?.taxType || "igst",
      }));
      recalculateTotals(state);
    },
    clearParty(state) {
      state.party = null;
      state.taxType = "igst";
      state.items = state.items.map((item) => ({
        ...item,
        taxType: "igst",
      }));
      recalculateTotals(state);
    },
    setAdditionalCharges(state, action) {
      const rows = Array.isArray(action.payload) ? action.payload : [];
      state.additionalCharges = rows.map(normalizeAdditionalCharge);
      recalculateTotals(state);
    },
    resetAdditionalCharges(state) {
      state.additionalCharges = [];
      recalculateTotals(state);
    },
    addItemsFromSelection(state, action) {
      const incomingItems = Array.isArray(action.payload) ? action.payload : [];

      incomingItems.forEach((incomingItem) => {
        if (!incomingItem?.id) return;

        const existingItem = state.items.find((item) => item.id === incomingItem.id);
        const incomingActualQty = Number(incomingItem.actualQty) || 0;
        const incomingBilledQty = Number(incomingItem.billedQty) || 0;

        if (existingItem) {
          Object.assign(
            existingItem,
            recalculateItem({
              ...existingItem,
              actualQty: (Number(existingItem.actualQty) || 0) + incomingActualQty,
              billedQty: (Number(existingItem.billedQty) || 0) + incomingBilledQty,
              taxType: existingItem.taxType || state.taxType,
            }),
          );
          return;
        }

        state.items.push(
          recalculateItem({
            ...incomingItem,
            priceLevel: state.priceLevel,
            taxType: incomingItem?.taxType || state.taxType,
          })
        );
      });

      recalculateTotals(state);
    },
    loadSaleOrderForEdit(state, action) {
      const incomingId = action.payload?._id?.toString();
      if (!incomingId) return;
      if (state.editingOrderId === incomingId) return;
      state.editingOrderId = incomingId;

      const doc = action.payload || {};
      const taxType = doc?.tax_type || "igst";

      state.cmp_id = doc?.cmp_id || state.cmp_id || null;
      state.transactionDate = doc?.date || null;
      state.taxType = taxType;
      state.party = mapSaleOrderParty(doc);
      state.items = Array.isArray(doc?.items)
        ? doc.items.map((row) => mapSaleOrderItem(row, taxType))
        : [];
      state.additionalCharges = Array.isArray(doc?.additional_charges)
        ? doc.additional_charges.map(mapSaleOrderAdditionalCharge)
        : [];
      state.despatchDetails = mapSaleOrderDespatchDetails(doc?.despatch_details);
      state.priceLevel = null;
      state.priceLevelObject = null;
      state.selectedSeries = {
        _id: doc?.series_id || null,
        seriesName: doc?.series_name || "",
        voucherNumber: doc?.voucher_number || "",
      };
      recalculateTotals(state);
    },
    updateItem(state, action) {
      const { id, changes } = action.payload || {};
      if (!id || !changes) return;

      const existingItemIndex = state.items.findIndex((item) => item.id === id);
      if (existingItemIndex === -1) return;

      const existingItem = state.items[existingItemIndex];
      if (!existingItem) return;

      const nextItem = recalculateItem({
        ...existingItem,
        ...changes,
        taxType: changes?.taxType || existingItem.taxType || state.taxType,
      });

      const nextBilledQty = Number(nextItem?.billedQty) || 0;
      const nextActualQty = Number(nextItem?.actualQty) || 0;

      if (nextBilledQty <= 0 && nextActualQty <= 0) {
        state.items.splice(existingItemIndex, 1);
      } else {
        Object.assign(existingItem, nextItem);
      }

      recalculateTotals(state);
    },
    removeItem(state, action) {
      const id = action.payload?.id || action.payload;
      if (!id) return;

      state.items = state.items.filter((item) => item.id !== id);
      recalculateTotals(state);
    },
    setPriceLevel(state, action) {
      state.priceLevel = action.payload || null;
    },
    setPriceLevelObject(state, action) {
      state.priceLevelObject = action.payload || null;
    },
    repriceAllItems(state) {
      repriceAllItemsInternal(state);
      recalculateTotals(state);
    },
    resetSaleOrderDraft(state) {
      const cmp_id = state.cmp_id;
      state.cmp_id = initialState.cmp_id;
      state.voucherType = initialState.voucherType;
      state.transactionDate = initialState.transactionDate;
      state.selectedSeries = initialState.selectedSeries;
      state.taxType = initialState.taxType;
      state.despatchDetails = { ...initialState.despatchDetails };
      state.party = initialState.party;
      state.priceLevel = initialState.priceLevel;
      state.priceLevelObject = initialState.priceLevelObject;
      state.editingOrderId = initialState.editingOrderId;
      state.items = [];
      state.additionalCharges = [];
      state.totals = { ...initialState.totals };

      clearSaleOrderStorage(cmp_id);
    },
  },
});

export const {
  setCompany,
  setVoucherType,
  setTransactionDate,
  setSelectedSeries,
  hydrateSelectedSeries,
  setDespatchDetails,
  resetDespatchDetails,
  setParty,
  clearParty,
  setAdditionalCharges,
  resetAdditionalCharges,
  addItemsFromSelection,
  loadSaleOrderForEdit,
  updateItem,
  removeItem,
  setPriceLevel,
  setPriceLevelObject,
  repriceAllItems,
  resetSaleOrderDraft,
} = transactionSlice.actions;

export default transactionSlice.reducer;
