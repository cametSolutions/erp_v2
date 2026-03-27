// src/hooks/queries/outstandingQueries.js
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { outstandingService } from "@/api/services/outstanding.service";

export const outstandingQueryKeys = {
  party: (partyId, cmp_id) => ["outstanding", "party", { partyId, cmp_id }],
  partyInfinite: (partyId, cmp_id, limit) => [
    "outstanding",
    "party",
    "infinite",
    { partyId, cmp_id, limit },
  ],
};

export const usePartyOutstandingQuery = (partyId, cmp_id, enabled = true) =>
  useQuery({
    queryKey: outstandingQueryKeys.party(partyId, cmp_id),
    queryFn: ({ signal }) =>
      outstandingService.getPartyOutstanding({
        partyId,
        cmp_id: cmp_id,
        signal,
        skipGlobalLoader: true,
      }),
    enabled: Boolean(partyId && cmp_id) && enabled,
    staleTime: 30_000,
  });

export const useInfinitePartyOutstandingQuery = ({
  partyId,
  cmp_id,
  limit = 20,
  enabled = true,
}) =>
  useInfiniteQuery({
    queryKey: outstandingQueryKeys.partyInfinite(partyId, cmp_id, limit),
    queryFn: ({ pageParam = 1, signal }) =>
      outstandingService.getPartyOutstanding({
        partyId,
        cmp_id,
        page: pageParam,   // 👈 sends page
        limit,             // 👈 sends limit
        signal,
        skipGlobalLoader: true,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage?.hasMore ? (lastPage?.page || 1) + 1 : undefined,
    enabled: Boolean(partyId && cmp_id) && enabled,
  });

