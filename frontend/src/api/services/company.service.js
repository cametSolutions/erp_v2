import api from "../client/apiClient";

export const companyService = {
  getCompanies: async () => {
    const response = await api.get("/company");
    return response.data || [];
  },
  getCompanyById: async (id) => {
    if (!id) return null;
    const response = await api.get(`/company/${id}`);
    return response.data || null;
  },
};
