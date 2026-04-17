import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { saleOrderService } from "@/api/services/saleOrder.service";
import { saleOrderQueryKeys } from "@/hooks/queries/saleOrderQueries";
import { invalidateVoucherSummaryForCompany } from "@/hooks/queries/voucherQueries";

export function useCancelSaleOrder(options = {}) {
  const { cmp_id = "", onSuccess, onError, ...mutationOptions } = options;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }) => saleOrderService.cancelSaleOrder(id, payload),
    onSuccess: async (data, variables, context) => {
      const saleOrder = data?.data?.saleOrder;
      const saleOrderId = saleOrder?._id || variables?.id || "";
      const resolvedCmpId =
        cmp_id || variables?.payload?.cmpId || variables?.payload?.cmp_id || "";

      if (saleOrderId && saleOrder) {
        queryClient.setQueryData(
          saleOrderQueryKeys.detail(saleOrderId, resolvedCmpId),
          saleOrder
        );
      }

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: saleOrderQueryKeys.all,
        }),
        resolvedCmpId
          ? invalidateVoucherSummaryForCompany(queryClient, resolvedCmpId)
          : Promise.resolve(),
      ]);

      toast.success(data?.message || "Sale order cancelled");

      if (onSuccess) {
        await onSuccess(data, variables, context);
      }
    },
    onError: async (error, variables, context) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to cancel sale order";

      toast.error(message);

      if (onError) {
        await onError(error, variables, context);
      }
    },
    ...mutationOptions,
  });
}
