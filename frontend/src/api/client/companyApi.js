// src/api/companyApi.js

import api from "./apiClient";


export const fetchCompanies = () => api.get("/company");
export const updateCompany = (id, data) => api.put(`/company/${id}`, data);
export const deleteCompany = (id) => api.delete(`/company/${id}`);
export const fetchCompanyById = (id) => api.get(`/company/${id}`);