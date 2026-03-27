import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { partyService } from "@/api/services/party.service";

const SALE_LOOKUP_STALE_TIME = 5 * 60_000;

export const partyQueryKeys = {
  all: ["parties"],
  infiniteList: (cmp_id, limit = 20, search = "", ledgerType = "all") => [
    ...partyQueryKeys.all,
    "infinite-list",
    { cmp_id, limit, search, ledgerType },
  ],
  list: (cmp_id, page = 1, limit = 20, search = "", ledgerType = "all") => [
    ...partyQueryKeys.all,
    "list",
    { cmp_id, page, limit, search, ledgerType },
  ],
  detail: (partyId) => [...partyQueryKeys.all, "detail", partyId],
};

export const useInfinitePartyListQuery = ({
  cmp_id,
  limit = 20,
  search = "",
  ledgerType = "all",
  enabled = true,
}) =>
  useInfiniteQuery({
    queryKey: partyQueryKeys.infiniteList(
      cmp_id || "",
      limit,
      search,
      ledgerType,
    ),
    queryFn: ({ pageParam = 1, signal }) =>
      partyService.getParties({
        page: pageParam,
        limit,
        cmp_id,
        search,
        ledgerType,
        signal,
        skipGlobalLoader: true,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage?.hasMore ? (lastPage?.page || 1) + 1 : undefined,
    enabled: Boolean(cmp_id) && enabled,
    staleTime: SALE_LOOKUP_STALE_TIME,
  });


export const usePartyListQuery = ({
  cmp_id,
  page = 1,
  limit = 20,
  search = "",
  enabled = true,
}) =>
  useQuery({
    queryKey: partyQueryKeys.list(cmp_id || "", page, limit, search),
    queryFn: ({ signal }) =>
      partyService.getParties({
        page,
        limit,
        cmp_id,
        search,
        signal,
        skipGlobalLoader: true,
      }),
    enabled: Boolean(cmp_id) && enabled,
    staleTime: SALE_LOOKUP_STALE_TIME,
  });

export const usePartyOptionsQuery = (cmp_id, enabled = true) =>
  useQuery({
    queryKey: partyQueryKeys.list(cmp_id || "", 1, 1000, ""),
    queryFn: ({ signal }) =>
      partyService.getParties({
        page: 1,
        limit: 1000,
        cmp_id,
        search: "",
        signal,
        skipGlobalLoader: true,
      }),
    enabled: Boolean(cmp_id) && enabled,
    select: (data) =>
      (data?.items || []).map((party) => ({
        id: party?._id || party?.id,
        name: party?.partyName || "Untitled Party",
        mobile: party?.mobileNumber || "",
      })),
    staleTime: SALE_LOOKUP_STALE_TIME,
  });

export const usePartyByIdQuery = (partyId, enabled = true) =>
  useQuery({
    queryKey: partyQueryKeys.detail(partyId || ""),
    queryFn: ({ signal }) =>
      partyService.getPartyById(partyId, { signal, skipGlobalLoader: true }),
    enabled: Boolean(partyId) && enabled,
    staleTime: 30_000,
  });
