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

    if (nextItem.initialPriceSource === "priceLevel") {
      const nextRate = resolveItemPriceLevelRate(nextItem, state.priceLevel);
      if (nextRate != null) {
        nextItem.rate = nextRate;
      }
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

const transactionSlice = createSlice({
  name: "transaction",
  initialState,
  reducers: {
    setCompany(state, action) {
      state.cmp_id = action.payload?.cmp_id ?? null;
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
          `lastSeries_saleOrder_${cmp_id}`,
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
        const raw = localStorage.getItem(`lastSeries_saleOrder_${cmp_id}`);

        if (raw) {
          state.selectedSeries = enrichSelectedSeries(JSON.parse(raw));
          return;
        }

        const legacyId = localStorage.getItem(`lastSeriesId_saleOrder_${cmp_id}`);
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
    updateItem(state, action) {
      const { id, changes } = action.payload || {};
      if (!id || !changes) return;

      const existingItem = state.items.find((item) => item.id === id);
      if (!existingItem) return;

      Object.assign(
        existingItem,
        recalculateItem({
          ...existingItem,
          ...changes,
          taxType: changes?.taxType || existingItem.taxType || state.taxType,
        }),
      );
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
  },
});

export const {
  setCompany,
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
  updateItem,
  setPriceLevel,
  setPriceLevelObject,
  repriceAllItems,
} = transactionSlice.actions;

export default transactionSlice.reducer;
