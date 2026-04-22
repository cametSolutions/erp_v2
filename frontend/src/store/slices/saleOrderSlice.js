// src/slices/voucherSlices/saleOrderSlice.js
import { createSlice } from "@reduxjs/toolkit";

// NOTE:
// This appears to be a legacy/alternate sale-order slice.
// Active create/edit flow currently uses `transactionSlice`.
// Kept documented here because it still exists in codebase.

const initialState = {
  // header
  transactionDate: "",          // string date from UI
  voucherType: "saleOrder",
  voucherNumber: null,          // number from backend / series

  // serials (filled by backend typically, but keep in state for edit/view)
  serialNumber: null,
  userLevelSerialNumber: null,

  // series
  series_id: null,              // {_id} or plain id string
  usedSeriesNumber: null,       // currentNumber from series object

  // users and org
  Primary_user_id: null,        // admin id
  cmp_id: null,
  Secondary_user_id: null,      // staff id

  // party
  party: {
    _id: null,
    partyName: "",
    accountGroupName: "",
    accountGroup_id: null,
    subGroupName: "",
    subGroup_id: null,
    mobileNumber: "",
    country: "",
    state: "",
    pin: "",
    emailID: "",
    gstNo: "",
    party_master_id: "",
    billingAddress: "",
    shippingAddress: "",
    accountGroup: "",
    totalOutstanding: 0,
    latestBillDate: null,
    newAddress: null,
  },

  // price level
  selectedPriceLevel: {
    _id: null,
    name: "",
  },

  // items (mirror your schema)
  items: [],

  // despatch
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

  // additional charges
  additionalCharges: [],

  // note
  note: "",

  // totals
  subTotal: 0,
  totalAdditionalCharge: 0,
  finalAmount: 0,
};

const saleOrderSlice = createSlice({
  name: "saleOrder",
  initialState,
  reducers: {
    // reset
    resetSaleOrder: () => initialState,

    // header
    // payload: string date
    setTransactionDate: (state, action) => {
      state.transactionDate = action.payload;
    },
    // payload: voucher type string
    setVoucherType: (state, action) => {
      state.voucherType = action.payload;
    },
    // payload: voucher number string/number
    setVoucherNumber: (state, action) => {
      state.voucherNumber = action.payload;
    },

    // serials
    // payload: company-level serial number
    setSerialNumber: (state, action) => {
      state.serialNumber = action.payload;
    },
    // payload: user-level serial number
    setUserLevelSerialNumber: (state, action) => {
      state.userLevelSerialNumber = action.payload;
    },

    // series
    setSeriesId: (state, action) => {
      state.series_id = action.payload;
    },
    setUsedSeriesNumber: (state, action) => {
      state.usedSeriesNumber = action.payload;
    },

    // users & org
    setPrimaryUserId: (state, action) => {
      state.Primary_user_id = action.payload;
    },
    setCmpId: (state, action) => {
      state.cmp_id = action.payload;
    },
    setSecondaryUserId: (state, action) => {
      state.Secondary_user_id = action.payload;
    },

    // party
    // payload: partial party object
    setParty: (state, action) => {
      state.party = { ...state.party, ...action.payload };
    },
    clearParty: (state) => {
      state.party = { ...initialState.party };
    },

    // price level
    setSelectedPriceLevel: (state, action) => {
      state.selectedPriceLevel = action.payload || initialState.selectedPriceLevel;
    },

    // items CRUD (simple; you can reuse your existing item logic if needed)
    // payload: full item array
    setItems: (state, action) => {
      state.items = action.payload || [];
    },
    // payload: one item object
    addItem: (state, action) => {
      state.items.push(action.payload);
    },
    // payload: { _id, item }
    updateItem: (state, action) => {
      const { _id, item } = action.payload;
      const idx = state.items.findIndex((i) => i._id === _id);
      if (idx !== -1) state.items[idx] = item;
    },
    // payload: _id
    removeItem: (state, action) => {
      const id = action.payload;
      state.items = state.items.filter((i) => i._id !== id);
    },

    // despatch
    setDespatchDetails: (state, action) => {
      state.despatchDetails = {
        ...state.despatchDetails,
        ...action.payload,
        title: "Despatch Details",
      };
    },

    // additional charges
    // payload: charge row array
    setAdditionalCharges: (state, action) => {
      state.additionalCharges = action.payload || [];
    },
    addAdditionalCharge: (state, action) => {
      state.additionalCharges.push(action.payload);
    },
    updateAdditionalCharge: (state, action) => {
      const { index, row } = action.payload;
      if (index >= 0 && index < state.additionalCharges.length) {
        state.additionalCharges[index] = row;
      }
    },
    removeAdditionalCharge: (state, action) => {
      const index = action.payload;
      state.additionalCharges.splice(index, 1);
    },

    // note
    setNote: (state, action) => {
      state.note = action.payload;
    },

    // totals (and a helper to recalc finalAmount if you want)
    // payload: number
    setSubTotal: (state, action) => {
      state.subTotal = action.payload || 0;
    },
    setTotalAdditionalCharge: (state, action) => {
      state.totalAdditionalCharge = action.payload || 0;
    },
    setFinalAmount: (state, action) => {
      // allow direct override from backend
      state.finalAmount = action.payload || 0;
    },
    recalcFinalAmount: (state) => {
      // Legacy helper formula:
      // finalAmount = subTotal + totalAdditionalCharge (rounded to 2 decimals)
      state.finalAmount =
        Number((state.subTotal + state.totalAdditionalCharge).toFixed(2));
    },

    // load whole document (for edit/view)
    // payload: API document in sale-order-like structure
    loadSaleOrderFromApi: (state, action) => {
      const doc = action.payload || {};
      return {
        ...initialState,
        ...doc,
        despatchDetails: {
          ...initialState.despatchDetails,
          ...(doc.despatchDetails || {}),
          title: "Despatch Details",
        },
      };
    },
  },
});

export const {
  resetSaleOrder,
  setTransactionDate,
  setVoucherType,
  setVoucherNumber,
  setSerialNumber,
  setUserLevelSerialNumber,
  setSeriesId,
  setUsedSeriesNumber,
  setPrimaryUserId,
  setCmpId,
  setSecondaryUserId,
  setParty,
  clearParty,
  setSelectedPriceLevel,
  setItems,
  addItem,
  updateItem,
  removeItem,
  setDespatchDetails,
  setAdditionalCharges,
  addAdditionalCharge,
  updateAdditionalCharge,
  removeAdditionalCharge,
  setNote,
  setSubTotal,
  setTotalAdditionalCharge,
  setFinalAmount,
  recalcFinalAmount,
  loadSaleOrderFromApi,
} = saleOrderSlice.actions;

export default saleOrderSlice.reducer;
