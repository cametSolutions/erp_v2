import { useQuery } from "@tanstack/react-query";

import { fetchAccountGroups } from "@/api/client/accountGroupApi";

export const accountGroupQueryKeys = {
  all: ["account-groups"],
  list: (cmpId) => [...accountGroupQueryKeys.all, "list", cmpId || ""],
};

export const useAccountGroupListQuery = (cmpId, enabled = true) =>
  useQuery({
    queryKey: accountGroupQueryKeys.list(cmpId),
    queryFn: async () => {
      const res = await fetchAccountGroups(cmpId);
      return res.data || [];
    },
    enabled: Boolean(cmpId) && enabled,
    staleTime: 5 * 60_000,
  });
