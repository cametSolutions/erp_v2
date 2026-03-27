import { useQuery } from "@tanstack/react-query";

import { fetchAccountGroups } from "@/api/client/accountGroupApi";

export const accountGroupQueryKeys = {
  all: ["account-groups"],
  list: (cmp_id) => [...accountGroupQueryKeys.all, "list", cmp_id || ""],
};

export const useAccountGroupListQuery = (cmp_id, enabled = true) =>
  useQuery({
    queryKey: accountGroupQueryKeys.list(cmp_id),
    queryFn: async () => {
      const res = await fetchAccountGroups(cmp_id);
      return res.data || [];
    },
    enabled: Boolean(cmp_id) && enabled,
    staleTime: 5 * 60_000,
  });
