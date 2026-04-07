import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { saleOrderService } from "@/api/services/saleOrder.service";
import { saleOrderQueryKeys } from "@/hooks/queries/saleOrderQueries";
import { invalidateVoucherSummaryForCompany } from "@/hooks/queries/voucherQueries";
import { voucherSeriesKeys } from "@/hooks/queries/voucherSeriesQueries";

export function useCreateSaleOrder(options = {}) {
  const { cmp_id = "", onSuccess, onError, ...mutationOptions } = options;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => saleOrderService.createSaleOrder(payload),
    onSuccess: async (data, variables, context) => {
      const saleOrder = data?.data?.saleOrder;
      const resolvedCmpId = cmp_id || variables?.cmp_id || "";

      if (saleOrder?._id) {
        queryClient.setQueryData(
          saleOrderQueryKeys.detail(saleOrder._id, resolvedCmpId),
          saleOrder,
        );
      }

      if (resolvedCmpId) {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: voucherSeriesKeys.list(resolvedCmpId, "saleOrder"),
          }),
          queryClient.invalidateQueries({
            queryKey: voucherSeriesKeys.nextNumber(resolvedCmpId, "saleOrder"),
          }),
          invalidateVoucherSummaryForCompany(queryClient, resolvedCmpId),
        ]);
      }

      toast.success(data?.message || "Sales order created");

      if (onSuccess) {
        await onSuccess(data, variables, context);
      }
    },
    onError: async (error, variables, context) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to create sales order";

      toast.error(message);

      if (onError) {
        await onError(error, variables, context);
      }
    },
    ...mutationOptions,
  });
}
