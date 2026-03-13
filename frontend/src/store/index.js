import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import uiReducer from "./slices/uiSlice";
import companyReducer from "./slices/companySlice";
import {
  loadAuthFromStorage,
  saveAuthToStorage,
  clearAuthFromStorage,
  loadCompanyFromStorage,
  saveCompanyToStorage,
  clearCompanyFromStorage,
  syncActiveCompanyId,
} from "./localStorage";

const persistedAuth = loadAuthFromStorage();
const persistedCompany = loadCompanyFromStorage();

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    company: companyReducer,
  },
  preloadedState:
    persistedAuth || persistedCompany
      ? {
          ...(persistedAuth ? { auth: persistedAuth } : {}),
          ...(persistedCompany ? { company: persistedCompany } : {}),
        }
      : undefined,
});

store.subscribe(() => {
  const state = store.getState();
  const authState = state.auth;
  const companyState = state.company;

  if (authState?.isLoggedIn && authState?.user) {
    saveAuthToStorage(authState);
    saveCompanyToStorage(companyState);
    syncActiveCompanyId(companyState?.selectedCompanyId);
    return;
  }

  clearAuthFromStorage();
  clearCompanyFromStorage();
});
