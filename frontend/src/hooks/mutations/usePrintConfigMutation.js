import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { patchPrintConfig } from "@/api/services/printConfig.service";
import { printConfigQueryKeys } from "@/hooks/queries/printConfigQueries";

export const usePrintConfigMutation = (cmp_id, voucherType) => {
  const queryClient = useQueryClient();
  const queryKey = printConfigQueryKeys.detail(cmp_id, voucherType);

  return useMutation({
    mutationFn: (partial) => patchPrintConfig(cmp_id, voucherType, partial),
    onMutate: async (partial) => {
      await queryClient.cancelQueries({
        queryKey,
      });

      const previous = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old) => {
        if (!old) return old;

        return {
          ...old,
          config: {
            ...old.config,
            ...partial,
          },
        };
      });

      return { previous };
    },
    onError: (_error, _partial, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }

      toast.error("Failed to save setting");
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKey, data);
      queryClient.invalidateQueries({
        queryKey,
      });
    },
  });
};
