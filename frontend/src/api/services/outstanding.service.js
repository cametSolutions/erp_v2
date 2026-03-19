// src/api/services/outstanding.service.js
import api from "../client/apiClient";

export const outstandingService = {
  getPartyOutstanding: async ({ partyId, cmp_id, signal, skipGlobalLoader }) => {
    const res = await api.get(`/outstanding/party/${partyId}`, {
      params: { cmp_id },
      signal,
      skipGlobalLoader,
    });
    return res.data; // { items: [...] }
  },
};
