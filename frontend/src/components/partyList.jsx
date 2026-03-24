// src/components/PartyList.jsx
import { useEffect, useState, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Trash2, Users } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

import { useDeleteConfirm } from "@/components/common/DeleteConfirmProvider";
import { useMobileHeader } from "@/components/Layout/HomeLayout";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { partyService } from "@/api/services/party.service";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  partyQueryKeys,
  useInfinitePartyListQuery,
} from "@/hooks/queries/partyQueries";
import { ROUTES } from "@/routes/paths";

const PAGE_SIZE = 20;

function PartyRow({ party, rightContent, onClick }) {
  return (
    <Card
      className="cursor-pointer rounded border-none bg-slate-50 py-1 shadow-lg ring-0"
      onClick={onClick}
    >
      <CardContent className="flex items-center justify-between gap-3 p-3.5">
        <div className="min-w-0 flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <Users className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">
              {party?.partyName || "Untitled Party"}
            </p>
            <p className="truncate text-xs text-slate-500">
              {party?.mobileNumber || party?.emailID || "No contact details"}
            </p>
          </div>
        </div>

        <div
          className="flex items-center gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          {rightContent}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * PartyList component
 *
 * Props:
 * - mode: "master" | "outstanding" | "select"
 *   - master: used in Party masters screen (edit/delete actions).
 *   - outstanding: used in Outstanding screen (shows total outstanding, navigates on click).
 *   - select: used in transaction flows (Sale Order, Receipt) inside a sheet to pick a party.
 * - onSelect?: function(party)
 */
export function PartyList({ mode = "master", onSelect }) {
  const [searchText, setSearchText] = useState("");
  // ledger | receivable | payable (for outstanding screen)
  const [ledgerType, setLedgerType] = useState("ledger");
  const loadMoreRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const confirmDelete = useDeleteConfirm();
  const { setHeaderOptions, resetHeaderOptions } = useMobileHeader();
  const cmpId =
    useSelector((state) => state.company.selectedCompanyId) || "";

  const debouncedSearchText = useDebouncedValue(searchText.trim(), 500);
  const isCustomersRoute = location.pathname === ROUTES.mastersCustomers;
  const pageLabel = isCustomersRoute ? "Customers" : "Parties";
  const emptyLabel = isCustomersRoute ? "customers" : "parties";

  const {
    data,
    error,
    isError,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfinitePartyListQuery({
    cmp_id: cmpId,
    limit: PAGE_SIZE,
    search: debouncedSearchText,
    ledgerType: mode === "outstanding" ? ledgerType : undefined,
  });

  // Mobile header config (master & outstanding)
  useEffect(() => {
    if (mode === "select") {
      resetHeaderOptions();
      return;
    }

    setHeaderOptions({
      showMenuDots: mode === "master",
      menuItems:
        mode === "master"
          ? [
              {
                label: isCustomersRoute ? "Add Customer" : "Add Party",
                onSelect: () => navigate(ROUTES.mastersPartyRegister),
              },
            ]
          : [],
      search: {
        show: true,
        value: searchText,
        placeholder:
          mode === "master" ? `Search ${emptyLabel}` : "Search parties",
        onChange: setSearchText,
      },
    });

    return () => resetHeaderOptions();
  }, [
    emptyLabel,
    isCustomersRoute,
    mode,
    navigate,
    resetHeaderOptions,
    searchText,
    setHeaderOptions,
  ]);

  // Error toast
  useEffect(() => {
    if (!isError) return;
    const message =
      error?.response?.data?.message ||
      error?.message ||
      `Failed to load ${emptyLabel}`;
    toast.error(message);
  }, [emptyLabel, error, isError]);

  const parties =
    data?.pages?.flatMap((page) => page?.items || []) || [];

  // IntersectionObserver for infinite scroll
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

  const handleEdit = (party) => {
    navigate(`${ROUTES.mastersPartyRegister}?partyId=${party._id}`);
  };

  const handleDelete = async (party) => {
    const ok = await confirmDelete({
      title: `Delete this ${isCustomersRoute ? "customer" : "party"}?`,
      description:
        "This record will be removed permanently. This action cannot be undone.",
      confirmLabel: "Delete",
    });
    if (!ok) return;

    try {
      const res = await partyService.deleteParty(party._id);
      toast.success(res?.message || `${pageLabel.slice(0, -1)} deleted`);

      queryClient.removeQueries({
        queryKey: partyQueryKeys.detail(party._id),
        exact: true,
      });
      queryClient.invalidateQueries({ queryKey: partyQueryKeys.all });
    } catch (err) {
      const message =
        err?.response?.data?.message || err?.message || "Delete failed";
      toast.error(message);
    }
  };

  if (!cmpId) {
    return (
      <div className="w-full font-[sans-serif]">
        <div className="mx-auto w-full max-w-md rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
          Select a company first to view {emptyLabel}.
        </div>
      </div>
    );
  }

  const renderRightMaster = (party) => (
    <>
      <button
        type="button"
        onClick={() => handleEdit(party)}
        className="rounded-md p-2 text-slate-600 transition-colors hover:bg-slate-100"
        title="Edit"
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => handleDelete(party)}
        className="rounded-md p-2 text-rose-600 transition-colors hover:bg-rose-50"
        title="Delete"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </>
  );

  const renderRightOutstanding = (party) => (
    <div className="text-right">
      <div className="text-sm font-semibold text-red-600">
        {party.totalOutstanding != null
          ? party.totalOutstanding.toFixed(2)
          : "0.00"}
      </div>
      <div className="text-xs text-slate-500">
        {party.classification || "dr"}
      </div>
    </div>
  );

  const renderRightSelect = (party) => (
    <div className="text-right">
      <div className="text-sm font-semibold text-emerald-600">
        {party.totalOutstanding?.toFixed(2) ?? "0.00"}
      </div>
      <div className="text-[10px] text-slate-500">Tap to select</div>
    </div>
  );

  // Header total based on current filter & current page parties
  const { headerBalance, headerClassification } = useMemo(() => {
    const sum = parties.reduce((acc, p) => {
      const val = p.totalOutstanding || 0;
      if (ledgerType === "receivable" && val <= 0) return acc;
      if (ledgerType === "payable" && val >= 0) return acc;
      return acc + val;
    }, 0);
    return {
      headerBalance: sum,
      headerClassification: sum >= 0 ? "dr" : "cr",
    };
  }, [parties, ledgerType]);

  const listContent = (
    <>
      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-16 animate-pulse rounded-xl border border-slate-200 bg-white"
            />
          ))}
        </div>
      )}

      {!isLoading && parties.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
          {debouncedSearchText
            ? `No matching ${emptyLabel}`
            : `No ${emptyLabel} found`}
        </div>
      )}

      {!isLoading && parties.length > 0 && (
        <div className="space-y-2">
          {parties.map((party) => (
            <PartyRow
              key={party._id}
              party={party}
              rightContent={
                mode === "master"
                  ? renderRightMaster(party)
                  : mode === "outstanding"
                    ? renderRightOutstanding(party)
                    : renderRightSelect(party)
              }
              onClick={
                mode === "master"
                  ? undefined
                  : mode === "outstanding"
                    ? () =>
                        navigate(
                          ROUTES.outstandingPartyDetail.replace(
                            ":partyId",
                            party._id,
                          ),
                        )
                    : () => onSelect && onSelect(party)
              }
            />
          ))}
        </div>
      )}

      {hasNextPage && <div ref={loadMoreRef} className="h-8" />}
    </>
  );

  return (
    <div
      className={`w-full font-[sans-serif] ${
        mode === "select" ? "flex h-full min-h-0 flex-col" : ""
      }`}
    >
      <div
        className={`mx-auto w-full max-w-md ${
          mode === "select" ? "flex h-full min-h-0 flex-col" : "space-y-3"
        }`}
      >
        {mode === "outstanding" && (
          <div className="mb-1 rounded-xl bg-sky-700 px-4 py-3 text-white">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Ledger filter */}
                <select
                  className="rounded-md bg-sky-600 px-2 py-1 text-xs outline-none"
                  value={ledgerType}
                  onChange={(e) => setLedgerType(e.target.value)}
                >
                  <option value="ledger">Ledger</option>
                  <option value="payable">Payables</option>
                  <option value="receivable">Receivables</option>
                </select>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {Math.abs(headerBalance).toFixed(2)}{" "}
                <span className="text-sm font-semibold">
                  {headerClassification}
                </span>
              </div>
            </div>
          </div>
        )}

        {mode === "select" && (
          <div className="shrink-0 border-b border-slate-100 bg-white pb-3">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
              Search Party
            </p>
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search parties"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-200"
            />
          </div>
        )}

        {mode === "select" ? (
          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-3 py-3">{listContent}</div>
          </ScrollArea>
        ) : (
          listContent
        )}
      </div>
    </div>
  );
}
