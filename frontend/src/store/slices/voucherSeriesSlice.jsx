// src/store/slices/voucherSeriesSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  // key: `${cmp_id}-${voucherType}` -> series object
  selectedByCompanyAndType: {},
};

const voucherSeriesSlice = createSlice({
  name: "voucherSeries",
  initialState,
  reducers: {
    setSelectedSeries(state, action) {
      const { cmp_id, voucherType, series } = action.payload;
      const key = `${cmp_id}-${voucherType}`;
      state.selectedByCompanyAndType[key] = series;
    },
  },
});

export const { setSelectedSeries } = voucherSeriesSlice.actions;
export default voucherSeriesSlice.reducer;
