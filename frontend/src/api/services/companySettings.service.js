import api from "../client/apiClient";

export const getCompanySettings = async (cmp_id, options = {}) => {
  const res = await api.get("/company-settings", {
    ...options,
    params: {
      cmp_id,
    },
  });

  return res.data;
};

export const updateCompanySettings = async (cmp_id, payload) => {
  const res = await api.put("/company-settings", payload, {
    params: {
      cmp_id,
    },
  });

  return res.data;
};

export const companySettingsService = {
  getCompanySettings,
  updateCompanySettings,
};
