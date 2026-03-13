// src/api/client/subGroupApi.js
import api from "./apiClient";

export const fetchSubGroups = (cmp_id, accountGroup) =>
  api.get("/subgroup", { params: { cmp_id, accountGroup },
  });
