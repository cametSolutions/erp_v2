import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { cashTransactionService } from "@/api/services/cashTransaction.service";
import { outstandingQueryKeys } from "@/hooks/queries/outstandingQueries";
import { partyQueryKeys } from "@/hooks/queries/partyQueries";
import { invalidateVoucherSummaryForCompany } from "@/hooks/queries/voucherQueries";
import { voucherSeriesKeys } from "@/hooks/queries/voucherSeriesQueries";

/**
 * Mutation hook for creating receipt/payment transactions.
 *
 * Side effects:
 * - invalidates voucher-series counters
 * - invalidates voucher summary totals
 * - invalidates outstanding + party queries affected by settlement changes
 *
 * @param {{
 *   cmp_id?: string,
 *   voucher_type?: string,
 *   onSuccess?: Function,
 *   onError?: Function
 * } & object} options
 * @returns {import("@tanstack/react-query").UseMutationResult}
 */
export function useCreateCashTransaction(options = {}) {
  const { cmp_id = "", voucher_type = "", onSuccess, onError, ...mutationOptions } =
    options;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => cashTransactionService.createCashTransaction(payload),
    onSuccess: async (data, variables, context) => {
      const resolvedCmpId = cmp_id || variables?.cmp_id || "";
      const resolvedVoucherType = voucher_type || variables?.voucher_type || "";

      if (resolvedCmpId && resolvedVoucherType) {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: voucherSeriesKeys.list(resolvedCmpId, resolvedVoucherType),
          }),
          queryClient.invalidateQueries({
            queryKey: voucherSeriesKeys.nextNumber(resolvedCmpId, resolvedVoucherType),
          }),
          invalidateVoucherSummaryForCompany(queryClient, resolvedCmpId),
          queryClient.invalidateQueries({
            queryKey: outstandingQueryKeys.all || ["outstanding"],
            exact: false,
          }),
          queryClient.invalidateQueries({
            queryKey: partyQueryKeys.all,
            exact: false,
          }),
        ]);
      }

      toast.success(
        data?.message ||
          `${resolvedVoucherType === "payment" ? "Payment" : "Receipt"} created`
      );

      if (onSuccess) {
        await onSuccess(data, variables, context);
      }
    },
    onError: async (error, variables, context) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to create cash transaction";

      toast.error(message);

      if (onError) {
        await onError(error, variables, context);
      }
    },
    ...mutationOptions,
  });
}
