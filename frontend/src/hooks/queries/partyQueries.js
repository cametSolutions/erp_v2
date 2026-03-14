import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import { partyService } from "@/api/services/party.service";

export const partyQueryKeys = {
  all: ["parties"],
  infiniteList: (cmpId, limit = 20, search = "") => [
    ...partyQueryKeys.all,
    "infinite-list",
    { cmpId, limit, search },
  ],
  list: (cmpId, page = 1, limit = 20, search = "") => [
    ...partyQueryKeys.all,
    "list",
    { cmpId, page, limit, search },
  ],
  detail: (partyId) => [...partyQueryKeys.all, "detail", partyId],
};

export const useInfinitePartyListQuery = ({
  cmp_id,
  limit = 20,
  search = "",
  enabled = true,
}) =>
  useInfiniteQuery({
    queryKey: partyQueryKeys.infiniteList(cmp_id || "", limit, search),
    queryFn: ({ pageParam = 1, signal }) =>
      partyService.getParties({
        page: pageParam,
        limit,
        cmp_id,
        search,
        signal,
        skipGlobalLoader: true,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage?.hasMore ? (lastPage?.page || 1) + 1 : undefined,
    enabled: Boolean(cmp_id) && enabled,
    staleTime: 30_000,
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
    staleTime: 30_000,
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
    staleTime: 30_000,
  });

export const usePartyByIdQuery = (partyId, enabled = true) =>
  useQuery({
    queryKey: partyQueryKeys.detail(partyId || ""),
    queryFn: ({ signal }) =>
      partyService.getPartyById(partyId, { signal, skipGlobalLoader: true }),
    enabled: Boolean(partyId) && enabled,
    staleTime: 30_000,
  });
