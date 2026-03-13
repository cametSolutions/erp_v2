// src/api/services/user.service.js
import api from "../client/apiClient";

export const userService = {
  createStaff: async (payload) => {
    const res = await api.post("/users/staff", payload);
    return res.data;
  },
};
