// src/hooks/queries/partyQueries.js
import { useQuery } from "@tanstack/react-query";
import { partyService } from "@/api/services/party.service";

export const partyQueryKeys = {
  all: ["parties"],
  list: (cmp_id, page = 1, limit = 20) => [
    ...partyQueryKeys.all,
    "list",
    { cmp_id, page, limit },
  ],
  detail: (partyId) => [...partyQueryKeys.all, "detail", partyId],
};

// Paginated list for PartyListPage
export const usePartyListQuery = ({
  cmp_id,
  page = 1,
  limit = 20,
  enabled = true,
}) =>
  useQuery({
    queryKey: partyQueryKeys.list(cmp_id || "", page, limit),
    queryFn: () => partyService.getParties({ page, limit, cmp_id }),
    enabled: Boolean(cmp_id) && enabled,
    staleTime: 30_000,
    keepPreviousData: true,
  });

// Flat options for dropdowns (if you ever need)
export const usePartyOptionsQuery = (cmp_id, enabled = true) =>
  useQuery({
    queryKey: partyQueryKeys.list(cmp_id || "", 1, 1000),
    queryFn: () => partyService.getParties({ page: 1, limit: 1000, cmp_id }),
    enabled: Boolean(cmp_id) && enabled,
    select: (data) =>
      (data?.items || []).map((p) => ({
        id: p?._id || p?.id,
        name: p?.partyName || "Untitled Party",
        mobile: p?.mobileNumber || "",
      })),
    staleTime: 30_000,
  });

// Single party for edit form
export const usePartyByIdQuery = (partyId, enabled = true) =>
  useQuery({
    queryKey: partyQueryKeys.detail(partyId || ""),
    queryFn: () => partyService.getPartyById(partyId),
    enabled: Boolean(partyId) && enabled,
    staleTime: 30_000,
  });
