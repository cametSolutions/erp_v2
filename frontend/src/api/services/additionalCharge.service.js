import api from "../client/apiClient";

export async function fetchAdditionalCharges({ cmp_id, signal, skipGlobalLoader = false }) {
  const response = await api.get("/additional-charges", {
    params: { cmp_id },
    signal,
    skipGlobalLoader,
  });

  const payload = response?.data || [];
  return Array.isArray(payload) ? payload : [];
}

export const additionalChargeService = {
  fetchAdditionalCharges,
};
