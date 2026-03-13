// src/api/client/partyApi.js

import api from "./apiClient";


export const createParty = (data) => api.post("/party", data);

export const fetchParties = ({ page, limit = 20, cmp_id }) =>
  api.get("/party", {
    params: { page, limit, cmp_id },
  });

export const fetchPartyById = (id) => api.get(`/party/${id}`);

export const updateParty = (id, data) => api.put(`/party/${id}`, data);

export const deleteParty = (id) => api.delete(`/party/${id}`);
