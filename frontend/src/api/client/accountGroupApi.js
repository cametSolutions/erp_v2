// src/api/client/accountGroupApi.js
import api from "./apiClient";

export const fetchAccountGroups = (cmp_id) =>
  api.get("/account-group", { params: { cmp_id } });
