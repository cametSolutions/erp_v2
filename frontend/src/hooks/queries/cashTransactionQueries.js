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
  cashBankBalances: (cmpId = "", cashBankType = "") => [
    ...cashTransactionQueryKeys.all,
    "cash-bank-balances",
    cmpId,
    cashBankType,
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

export function useCashBankLedgerBalancesQuery(
  cmpId,
  cashBankType = "",
  options = {}
) {
  const { enabled = true, skipGlobalLoader = true } = options;

  return useQuery({
    queryKey: cashTransactionQueryKeys.cashBankBalances(cmpId || "", cashBankType || ""),
    queryFn: () =>
      cashTransactionService.getCashBankLedgerBalances({
        cmp_id: cmpId,
        cash_bank_type: cashBankType || undefined,
        skipGlobalLoader,
      }),
    enabled: Boolean(cmpId) && enabled,
  });
}
