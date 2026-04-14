import { useMemo } from "react";
import { Landmark, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

import ErrorRetryState from "@/components/common/ErrorRetryState";
import { useCashBankLedgerBalancesQuery } from "@/hooks/queries/cashTransactionQueries";
import { ROUTES } from "@/routes/paths";

function formatCurrency(value) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function CashBankBalancePage() {
  const navigate = useNavigate();
  const cmp_id = useSelector((state) => state.company?.selectedCompanyId || "");

  const cashQuery = useCashBankLedgerBalancesQuery(cmp_id, "cash", {
    enabled: Boolean(cmp_id),
  });

  const bankQuery = useCashBankLedgerBalancesQuery(cmp_id, "bank", {
    enabled: Boolean(cmp_id),
  });

  const cashItems = cashQuery.data || [];
  const bankItems = bankQuery.data || [];

  const totalCash = useMemo(
    () => cashItems.reduce((sum, item) => sum + (Number(item?.current_balance) || 0), 0),
    [cashItems],
  );
  const totalBank = useMemo(
    () => bankItems.reduce((sum, item) => sum + (Number(item?.current_balance) || 0), 0),
    [bankItems],
  );
  const grandTotal = totalCash + totalBank;

  const isLoading = cashQuery.isLoading || bankQuery.isLoading;
  const isError = cashQuery.isError || bankQuery.isError;
  const errorMessage =
    cashQuery.error?.response?.data?.message ||
    bankQuery.error?.response?.data?.message ||
    cashQuery.error?.message ||
    bankQuery.error?.message ||
    "Failed to load cash / bank balances";

  if (!cmp_id) {
    return (
      <div className="mx-auto w-full max-w-3xl px-1 pb-6 pt-3 sm:px-4">
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
          Select a company first.
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-3xl px-1 pb-6 pt-3 sm:px-4">
        <div className="space-y-3">
          <div className="h-36 animate-pulse rounded-lg border border-slate-200 bg-slate-100" />
          <div className="h-16 animate-pulse rounded-lg border border-slate-200 bg-slate-100" />
          <div className="h-16 animate-pulse rounded-lg border border-slate-200 bg-slate-100" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto w-full max-w-3xl px-1 pb-6 pt-3 sm:px-4">
        <div className="rounded-lg border border-slate-200 bg-white">
          <ErrorRetryState
            message={errorMessage}
            onRetry={() => {
              cashQuery.refetch();
              bankQuery.refetch();
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-1 pb-6 pt-3 sm:px-4">
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-[#3e5c76] shadow-sm">
        <div className="px-4 py-4 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/90">
            Cash / Bank Balance
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight">{formatCurrency(grandTotal)}</p>
          <p className="mt-1 text-xs text-slate-200">Current company total balance</p>
        </div>
      </div>

      <div className="mt-3 overflow-hidden rounded-lg">
        <button
          className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-slate-50"
          onClick={() => navigate(ROUTES.CashInHandListPage)}
        >
          <span className="inline-flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Wallet className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold text-slate-900">Cash In Hand</span>
          </span>
          <span className="text-sm font-semibold text-slate-800">{formatCurrency(totalCash)}</span>
        </button>

        <div className="border-t border-slate-100" />

        <button
          className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-slate-50"
          onClick={() => navigate(ROUTES.BankBalanceListPage)}
        >
          <span className="inline-flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
              <Landmark className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold text-slate-900">Bank Balance</span>
          </span>
          <span className="text-sm font-semibold text-slate-800">{formatCurrency(totalBank)}</span>
        </button>
      </div>
    </div>
  );
}
