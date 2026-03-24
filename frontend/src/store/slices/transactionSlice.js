import { createSlice } from "@reduxjs/toolkit";

function normalizeAdditionalCharge(row) {
  const baseValue = Number(row?.value) || 0;
  const taxPercentage = Number(row?.taxPercentage) || 0;
  const taxAmt = (baseValue * taxPercentage) / 100;
  const sign = row?.action === "substract" ? -1 : 1;
  const finalValue = (baseValue + taxAmt) * sign;

  return {
    ...row,
    value: row?.value ?? "",
    action: row?.action === "substract" ? "substract" : "add",
    taxPercentage,
    taxAmt,
    finalValue,
  };
}

export function recalculateItem(item) {
  const billedQty = Number(item?.billedQty) || 0;
  const rate = Number(item?.rate) || 0;
  const taxRate = Number(item?.taxRate) || 0;
  const discountType = item?.discountType || "percentage";
  const discountPercentage = Number(item?.discountPercentage) || 0;
  const discountAmountValue = Number(item?.discountAmount) || 0;
  const taxInclusive = Boolean(item?.taxInclusive);

  const lineTotal = rate * billedQty;
  let baseBeforeTax;
  let effectiveDiscountAmount;
  let taxableAmount;
  let taxAmount;
  let totalAmount;

  if (taxInclusive) {
    const divisor = 1 + taxRate / 100;
    baseBeforeTax = divisor ? lineTotal / divisor : lineTotal;
  } else {
    baseBeforeTax = lineTotal;
  }

  if (discountType === "percentage") {
    effectiveDiscountAmount = (baseBeforeTax * discountPercentage) / 100;
  } else {
    effectiveDiscountAmount = discountAmountValue;
  }

  effectiveDiscountAmount = Math.min(
    Math.max(effectiveDiscountAmount, 0),
    baseBeforeTax,
  );

  taxableAmount = baseBeforeTax - effectiveDiscountAmount;
  if (taxableAmount < 0) taxableAmount = 0;

  taxAmount = (taxableAmount * taxRate) / 100;
  totalAmount = taxableAmount + taxAmount;

  item.basePrice = baseBeforeTax;
  item.discountType = discountType;
  item.discountPercentage = discountPercentage;
  item.discountAmount = effectiveDiscountAmount;
  item.taxableAmount = taxableAmount;
  item.taxAmount = taxAmount;
  item.totalAmount = totalAmount;

  return item;
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
  const itemTotals = state.items.reduce(
    (accumulator, item) => {
      accumulator.subTotal += Number(item?.basePrice) || 0;
      accumulator.totalDiscount += Number(item?.discountAmount) || 0;
      accumulator.taxableAmount += Number(item?.taxableAmount) || 0;
      accumulator.totalTaxAmount += Number(item?.taxAmount) || 0;
      accumulator.totalIgstAmt += Number(item?.taxAmount) || 0;
      accumulator.itemTotal += Number(item?.totalAmount) || 0;
      return accumulator;
    },
    {
      subTotal: 0,
      totalDiscount: 0,
      taxableAmount: 0,
      totalTaxAmount: 0,
      totalIgstAmt: 0,
      totalCessAmt: 0,
      totalAddlCessAmt: 0,
      itemTotal: 0,
      totalAdditionalCharge: 0,
      amountWithAdditionalCharge: 0,
      finalAmount: 0,
      roundOff: 0,
    }
  );

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
  cmpId: null,
  voucherType: "saleOrder",
  transactionDate: null,
  selectedSeries: null,
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
      state.cmpId = action.payload?.cmpId ?? null;
    },
    setTransactionDate(state, action) {
      state.transactionDate = action.payload?.transactionDate ?? null;
    },
    setSelectedSeries(state, action) {
      const { series, cmpId } = action.payload || {};
      state.selectedSeries = series || null;

      if (!series?._id || !cmpId) return;

      try {
        localStorage.setItem(`lastSeriesId_saleOrder_${cmpId}`, series._id);
      } catch (error) {
        console.error("Failed to persist last series id", error);
      }
    },
    hydrateSelectedSeries(state, action) {
      const { cmpId } = action.payload || {};
      if (!cmpId) return;

      try {
        const id = localStorage.getItem(`lastSeriesId_saleOrder_${cmpId}`);
        state.selectedSeries = id ? { _id: id } : null;
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
      state.party = action.payload || null;
    },
    clearParty(state) {
      state.party = null;
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
          existingItem.actualQty =
            (Number(existingItem.actualQty) || 0) + incomingActualQty;
          existingItem.billedQty =
            (Number(existingItem.billedQty) || 0) + incomingBilledQty;
          recalculateItem(existingItem);
          return;
        }

        state.items.push(
          recalculateItem({
            ...incomingItem,
            priceLevel: state.priceLevel,
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

      Object.assign(existingItem, changes);
      recalculateItem(existingItem);
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
