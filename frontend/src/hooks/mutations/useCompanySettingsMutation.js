import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { updateCompanySettings } from "@/api/services/companySettings.service";
import { companySettingsQueryKeys } from "@/hooks/queries/companySettingsQueries";

export const useCompanySettingsMutation = (cmp_id) => {
  const queryClient = useQueryClient();
  const queryKey = companySettingsQueryKeys.detail(cmp_id);

  return useMutation({
    mutationFn: (payload) => updateCompanySettings(cmp_id, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data);
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message || error?.message || "Failed to save settings"
      );
    },
  });
};
