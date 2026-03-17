import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Trash2, Users } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { useDeleteConfirm } from "@/components/common/DeleteConfirmProvider";
import { useMobileHeader } from "@/components/Layout/HomeLayout";
import { Card, CardContent } from "@/components/ui/card";
import { partyService } from "@/api/services/party.service";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  partyQueryKeys,
  useInfinitePartyListQuery,
} from "@/hooks/queries/partyQueries";
import { ROUTES } from "@/routes/paths";

const PAGE_SIZE = 20;

function PartyRow({ party, onEdit, onDelete }) {
  return (
    <Card className="rounded border-none bg-slate-50 py-1 shadow-lg ring-0">
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

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onEdit(party)}
            className="rounded-md p-2 text-slate-600 transition-colors hover:bg-slate-100"
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(party)}
            className="rounded-md p-2 text-rose-600 transition-colors hover:bg-rose-50"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PartyListPage() {
  const [searchText, setSearchText] = useState("");
  const loadMoreRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const confirmDelete = useDeleteConfirm();
  const { setHeaderOptions, resetHeaderOptions } = useMobileHeader();
  const cmpId = localStorage.getItem("activeCompanyId") || "";
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
  });

  useEffect(() => {
    setHeaderOptions({
      showMenuDots: true,
      menuItems: [
        {
          label: isCustomersRoute ? "Add Customer" : "Add Party",
          onSelect: () => navigate(ROUTES.mastersPartyRegister),
        },
      ],
      search: {
        show: true,
        value: searchText,
        placeholder: `Search ${emptyLabel}`,
        onChange: setSearchText,
      },
    });

    return () => resetHeaderOptions();
  }, [
    emptyLabel,
    isCustomersRoute,
    navigate,
    resetHeaderOptions,
    searchText,
    setHeaderOptions,
  ]);

  useEffect(() => {
    if (!isError) return;

    const message =
      error?.response?.data?.message || error?.message || `Failed to load ${emptyLabel}`;
    toast.error(message);
  }, [emptyLabel, error, isError]);

  useEffect(() => {
    const target = loadMoreRef.current;

    if (!target || !hasNextPage) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px 0px" },
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, data]);

  const parties = data?.pages?.flatMap((page) => page?.items || []) || [];

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

  return (
    <div className="w-full font-[sans-serif]">
      <div className="mx-auto w-full max-w-md space-y-3">
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
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {hasNextPage && <div ref={loadMoreRef} className="h-4 w-full" />}

        {isFetchingNextPage && (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-medium text-slate-700">
            Loading more {emptyLabel}...
          </div>
        )}
      </div>
    </div>
  );
}
