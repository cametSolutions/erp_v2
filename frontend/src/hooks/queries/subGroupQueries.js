import { useQuery } from "@tanstack/react-query";

import { fetchSubGroups } from "@/api/client/subGroupApi";

export const subGroupQueryKeys = {
  all: ["sub-groups"],
  list: (cmpId, accountGroupId) => [
    ...subGroupQueryKeys.all,
    "list",
    cmpId || "",
    accountGroupId || "",
  ],
};

export const useSubGroupListQuery = (
  cmpId,
  accountGroupId,
  enabled = true,
) =>
  useQuery({
    queryKey: subGroupQueryKeys.list(cmpId, accountGroupId),
    queryFn: async () => {
      const res = await fetchSubGroups(cmpId, accountGroupId);
      return res.data || [];
    },
    enabled: Boolean(cmpId) && Boolean(accountGroupId) && enabled,
    staleTime: 5 * 60_000,
  });
