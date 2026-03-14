import api from "../client/apiClient.js";

export const authService = {
  register: async (payload) => {
    const res = await api.post("/auth/register", payload);
    return res.data;
  },
  login: async (payload) => {
    const res = await api.post("/auth/login", payload);
    return res.data;
  },
  me: async () => {
    const res = await api.get("/auth/me", { skipGlobalLoader: true });
    return res.data;
  },
  logout: async () => {
    const res = await api.post("/auth/logout");
    return res.data;
  },
};
