import { useQuery } from "@tanstack/react-query";

import { fetchSubGroups } from "@/api/client/subGroupApi";

export const subGroupQueryKeys = {
  all: ["sub-groups"],
  list: (cmp_id, accountGroupId) => [
    ...subGroupQueryKeys.all,
    "list",
    cmp_id || "",
    accountGroupId || "",
  ],
};

export const useSubGroupListQuery = (
  cmp_id,
  accountGroupId,
  enabled = true,
) =>
  useQuery({
    queryKey: subGroupQueryKeys.list(cmp_id, accountGroupId),
    queryFn: async () => {
      const res = await fetchSubGroups(cmp_id, accountGroupId);
      return res.data || [];
    },
    enabled: Boolean(cmp_id) && Boolean(accountGroupId) && enabled,
    staleTime: 5 * 60_000,
  });
