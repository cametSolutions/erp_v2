import { useQuery } from "@tanstack/react-query";

import { getCompanySettings } from "@/api/services/companySettings.service";

export const companySettingsQueryKeys = {
  all: ["company-settings"],
  detail: (cmp_id) => [...companySettingsQueryKeys.all, cmp_id || ""],
};

export const useCompanySettingsQuery = (cmp_id, enabled = true) =>
  useQuery({
    queryKey: companySettingsQueryKeys.detail(cmp_id),
    queryFn: ({ signal }) =>
      getCompanySettings(cmp_id, {
        signal,
        skipGlobalLoader: true,
      }),
    enabled: Boolean(cmp_id) && enabled,
    staleTime: 30_000,
  });
