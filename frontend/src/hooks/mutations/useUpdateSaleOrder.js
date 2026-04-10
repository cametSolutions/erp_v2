import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { saleOrderService } from "@/api/services/saleOrder.service";
import { saleOrderQueryKeys } from "@/hooks/queries/saleOrderQueries";
import { ROUTES } from "@/routes/paths";
import { resetSaleOrderDraft } from "@/store/slices/transactionSlice";

export function useUpdateSaleOrder(options = {}) {
  const { cmp_id = "", onSuccess, onError, ...mutationOptions } = options;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }) => saleOrderService.updateSaleOrder(id, payload),
    onSuccess: async (data, variables, context) => {
      const saleOrder = data?.data?.saleOrder;
      const saleOrderId = saleOrder?._id || variables?.id || "";
      const resolvedCmpId = cmp_id || variables?.payload?.cmpId || variables?.payload?.cmp_id || "";

      if (saleOrderId && saleOrder) {
        queryClient.setQueryData(
          saleOrderQueryKeys.detail(saleOrderId, resolvedCmpId),
          saleOrder,
        );
      }

      await queryClient.invalidateQueries({
        queryKey: saleOrderQueryKeys.all,
      });

      dispatch(resetSaleOrderDraft());
      toast.success(data?.message || "Sales order updated");

      if (saleOrderId) {
        navigate(
          ROUTES.saleOrderDetail.replace(":saleOrderId", saleOrderId),
        );
      }

      if (onSuccess) {
        await onSuccess(data, variables, context);
      }
    },
    onError: async (error, variables, context) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update sales order";

      toast.error(message);

      if (onError) {
        await onError(error, variables, context);
      }
    },
    ...mutationOptions,
  });
}
