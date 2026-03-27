import { useQuery } from "@tanstack/react-query";

import { fetchAdditionalCharges } from "@/api/services/additionalCharge.service";

export const additionalChargeQueryKeys = {
  all: ["additional-charges"],
  list: (cmp_id) => [...additionalChargeQueryKeys.all, cmp_id],
};

export function useAdditionalChargesQuery({ cmp_id, enabled = true }) {
  return useQuery({
    queryKey: additionalChargeQueryKeys.list(cmp_id || ""),
    queryFn: ({ signal }) =>
      fetchAdditionalCharges({
        cmp_id,
        signal,
        skipGlobalLoader: true,
      }),
    enabled: Boolean(cmp_id) && enabled,
    staleTime: 5 * 60_000,
  });
}
