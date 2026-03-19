// src/api/services/party.service.js
import api from "../client/apiClient";

export const partyService = {
  createParty: async (payload) => {
    const res = await api.post("/party", payload);
    return res.data;
  },

  getParties: async ({
    page,
    limit,
    cmp_id,
    search,
    ledgerType,
    signal,
    skipGlobalLoader = false,
  }) => {
    const res = await api.get("/party", {
      params: { page, limit, cmp_id, search,ledgerType },
      signal,
      skipGlobalLoader,
    });
    return res.data; // expect { items, hasMore, total, page }
  },

  getPartyById: async (id, options = {}) => {
    const res = await api.get(`/party/${id}`, options);
    return res.data;
  },

  updateParty: async (id, payload) => {
    const res = await api.put(`/party/${id}`, payload);
    return res.data;
  },

  deleteParty: async (id) => {
    const res = await api.delete(`/party/${id}`);
    return res.data;
  },
};
