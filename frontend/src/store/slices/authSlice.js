import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  isLoggedIn: false,
  isInitialized: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isLoggedIn = Boolean(action.payload);
    },
    logout: (state) => {
      state.user = null;
      state.isLoggedIn = false;
    },
    setInitialized: (state, action) => {
      state.isInitialized = action.payload;
    },
  },
});

export const { setUser, logout, setInitialized } = authSlice.actions;
export default authSlice.reducer;
