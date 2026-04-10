import { useQuery } from "@tanstack/react-query";

import { cashTransactionService } from "@/api/services/cashTransaction.service";

export const cashTransactionQueryKeys = {
  all: ["cash-transactions"],
  detail: (transactionId, cmpId = "") => [
    ...cashTransactionQueryKeys.all,
    "detail",
    transactionId,
    cmpId,
  ],
};

export function useCashTransactionDetailQuery(transactionId, cmpId, options = {}) {
  const {
    enabled = true,
    initialData,
    skipGlobalLoader = true,
  } = options;

  return useQuery({
    queryKey: cashTransactionQueryKeys.detail(transactionId || "", cmpId || ""),
    queryFn: () =>
      cashTransactionService.getCashTransactionById(transactionId, {
        cmp_id: cmpId,
        skipGlobalLoader,
      }),
    enabled: Boolean(transactionId) && enabled,
    initialData,
  });
}
