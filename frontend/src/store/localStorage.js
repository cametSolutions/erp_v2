const AUTH_STORAGE_KEY = "erp_v2_auth";
const COMPANY_STORAGE_KEY = "erp_v2_company";
const ACTIVE_COMPANY_ID_KEY = "activeCompanyId";

export const loadAuthFromStorage = () => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

export const saveAuthToStorage = (authState) => {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authState));
  } catch {
    // Ignore storage write errors (private mode/quota)
  }
};

export const clearAuthFromStorage = () => {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // Ignore storage clear errors
  }
};

export const loadCompanyFromStorage = () => {
  try {
    const raw = localStorage.getItem(COMPANY_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

export const saveCompanyToStorage = (companyState) => {
  try {
    localStorage.setItem(COMPANY_STORAGE_KEY, JSON.stringify(companyState));
  } catch {
    // Ignore storage write errors (private mode/quota)
  }
};

export const clearCompanyFromStorage = () => {
  try {
    localStorage.removeItem(COMPANY_STORAGE_KEY);
    localStorage.removeItem(ACTIVE_COMPANY_ID_KEY);
  } catch {
    // Ignore storage clear errors
  }
};

export const syncActiveCompanyId = (companyId) => {
  try {
    if (companyId) {
      localStorage.setItem(ACTIVE_COMPANY_ID_KEY, companyId);
      return;
    }

    localStorage.removeItem(ACTIVE_COMPANY_ID_KEY);
  } catch {
    // Ignore storage write errors (private mode/quota)
  }
};
