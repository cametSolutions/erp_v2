// src/api/services/user.service.js
import api from "../client/apiClient";

export const userService = {
  createStaff: async (payload) => {
    const res = await api.post("/users/staff", payload);
    return res.data;
  },

  // NEW: list staff users
  getUsers: async () => {
    const res = await api.get("/users/staff");
    return res.data; // array
  },

  // NEW: get single staff user by id
  getUserById: async (id) => {
    const res = await api.get(`/users/staff/${id}`);
    return res.data;
  },
};
