// src/pages/outstanding/OutstandingPartyDetailPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { Building2 } from "lucide-react";

import { LedgerFilter } from "./LedgerFilter";
import { useMobileHeader } from "@/components/Layout/HomeLayout";
import { useInfinitePartyOutstandingQuery } from "@/hooks/queries/outstandingQueries";
import { usePartyByIdQuery } from "@/hooks/queries/partyQueries";

export default function OutstandingPartyDetailPage() {
  const { partyId } = useParams();
  const location = useLocation();
  const cmp_id = useSelector((state) => state.company.selectedCompanyId) || "";
  const { setHeaderOptions, resetHeaderOptions } = useMobileHeader();

  const [ledgerType, setLedgerType] = useState("ledger");
  const loadMoreRef = useRef(null);
  const partyNameFromState = location.state?.partyName || "";

  const { data: partyDetail } = usePartyByIdQuery(partyId, Boolean(partyId));

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
  } = useInfinitePartyOutstandingQuery({
    partyId,
    cmp_id: cmp_id,
    limit: 20,
    positiveOnly: true,
  });

  useEffect(() => {
    if (!isError) return;
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to load outstanding";
    toast.error(message);
  }, [isError, error]);

  useEffect(() => {
    setHeaderOptions({ showMenuDots: false });
    return () => resetHeaderOptions();
  }, [resetHeaderOptions, setHeaderOptions]);

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;

    const node = loadMoreRef.current;
    if (!node) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        fetchNextPage();
      }
    });

    observer.observe(node);

    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const bills =
    data?.pages
      ?.flatMap((page) => page?.items || [])
      .filter((bill) => Math.abs(Number(bill?.bill_pending_amt) || 0) > 0) || [];

  const { filteredBills, total, partyName } = useMemo(() => {
    const resolvedPartyName =
      partyNameFromState ||
      partyDetail?.partyName ||
      bills[0]?.party_name ||
      bills[0]?.partyName ||
      bills[0]?.alias ||
      "";

    const getSignedAmount = (bill) => {
      const rawValue = Number(bill.bill_pending_amt || 0);
      const classification = String(bill.classification || "")
        .trim()
        .toLowerCase();

      if (classification === "cr") return -Math.abs(rawValue);
      if (classification === "dr") return Math.abs(rawValue);
      return rawValue;
    };

    const list = bills.filter((bill) => {
      const value = getSignedAmount(bill);
      const classification = String(bill.classification || "")
        .trim()
        .toLowerCase();

      if (ledgerType === "receivable") {
        return classification ? classification === "dr" : value > 0;
      }

      if (ledgerType === "payable") {
        return classification ? classification === "cr" : value < 0;
      }

      return true;
    });

    const sum = list.reduce(
      (acc, bill) => acc + getSignedAmount(bill),
      0,
    );

    return { filteredBills: list, total: sum, partyName: resolvedPartyName };
  }, [bills, ledgerType, partyDetail?.partyName, partyNameFromState]);

  const totalTone =
    total < 0
      ? {
          label: "cr",
          amountClassName: "text-rose-50",
          badgeClassName:
            "border border-rose-400/60 bg-rose-500/90 text-rose-50",
        }
      : {
          label: "dr",
          amountClassName: "text-emerald-50",
          badgeClassName:
            "border border-emerald-400/60 bg-emerald-500/90 text-emerald-50",
        };

  return (
    <div className="w-full font-[sans-serif]">
      <div className="mx-auto w-full max-w-md space-y-3">
        {/* Top header strip: dark blue bg with back, party, total, filter */}
        <section className="rounded-sm bg-[#014f86] px-4 py-9 pt-3 text-slate-50 shadow-sm mt-4 ">
          <div className="mb-3 flex items-center justify-between gap-3">
            <LedgerFilter
              value={ledgerType}
              onChange={setLedgerType}
              className="shrink-0"
            />
          </div>

          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
                {partyName || "Party"}
              </p>
              <p className="mt-1 flex items-center gap-2 truncate text-base font-semibold text-slate-50">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800/80">
                  <Building2 className="h-3.5 w-3.5 text-slate-200" />
                </span>
                <span className="truncate">{partyName || "Party"}</span>
              </p>
            </div>

            <div className="text-right">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
                Total Outstanding
              </p>
              <p
                className={`mt-1 text-3xl font-bold leading-tight ${totalTone.amountClassName}`}
              >
                {Math.abs(total).toFixed(2)}
              </p>
              <span
                className={`mt-1 inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] ${totalTone.badgeClassName}`}
              >
                {totalTone.label}
              </span>
            </div>
          </div>
        </section>

        {/* Bills list below */}
        <section className="rounded-xl bg-white p-2.5">
          <div className="mb-1.5 flex items-center justify-between gap-3 px-0.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Bills
            </p>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
              {filteredBills.length} bills
            </span>
          </div>

          {isLoading && (
            <div className="space-y-1.5">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-10 animate-pulse rounded-lg border border-slate-200 bg-slate-50"
                />
              ))}
            </div>
          )}

          {!isLoading && filteredBills.length === 0 && (
            <div className="mt-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-center text-[11px] text-slate-500">
              No outstanding bills for this party.
            </div>
          )}

          {!isLoading && filteredBills.length > 0 && (
            <div className="divide-y divide-slate-100 border-t border-slate-100">
              {filteredBills.map((bill) => {
                const rawAmt = Number(bill.bill_pending_amt || 0);
                const classification = String(bill.classification || "")
                  .trim()
                  .toLowerCase();
                const isCredit =
                  classification === "cr" ||
                  (classification !== "dr" && rawAmt < 0);

                return (
                  <div
                    key={bill._id}
                    className="flex items-center justify-between px-1.5 py-2 text-[13px]"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">
                        {bill.bill_no}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {new Date(bill.bill_date).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="pl-2 text-right">
                      <p
                        className={`font-semibold ${
                          isCredit ? "text-rose-600" : "text-slate-900"
                        }`}
                      >
                        {Math.abs(rawAmt).toFixed(2)}
                      </p>
                      <p className="mt-0.5 text-[10px] uppercase tracking-wide text-slate-500">
                        {classification || (isCredit ? "cr" : "dr")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {hasNextPage && <div ref={loadMoreRef} className="h-8" />}

          {isFetchingNextPage && (
            <div className="mt-2 space-y-1.5">
              {Array.from({ length: 2 }).map((_, index) => (
                <div
                  key={index}
                  className="h-10 animate-pulse rounded-lg border border-slate-200 bg-slate-50"
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
