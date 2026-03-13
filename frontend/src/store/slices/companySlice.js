import { createSlice } from "@reduxjs/toolkit";
import { logout } from "./authSlice";

const initialState = {
  selectedCompanyId: null,
  selectedCompany: null,
};

const companySlice = createSlice({
  name: "company",
  initialState,
  reducers: {
    setSelectedCompany: (state, action) => {
      const company = action.payload || null;
      state.selectedCompany = company;
      state.selectedCompanyId = company?._id || company?.id || null;
    },
    setSelectedCompanyId: (state, action) => {
      state.selectedCompanyId = action.payload || null;
      if (
        state.selectedCompany &&
        (state.selectedCompany._id || state.selectedCompany.id) !==
          state.selectedCompanyId
      ) {
        state.selectedCompany = null;
      }
    },
    clearSelectedCompany: (state) => {
      state.selectedCompanyId = null;
      state.selectedCompany = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(logout, () => initialState);
  },
});

export const { setSelectedCompany, setSelectedCompanyId, clearSelectedCompany } =
  companySlice.actions;
export default companySlice.reducer;
