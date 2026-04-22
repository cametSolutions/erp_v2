// src/hooks/queries/outstandingQueries.js
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { outstandingService } from "@/api/services/outstanding.service";

export const outstandingQueryKeys = {
  all: ["outstanding"],
  party: (partyId, cmp_id) => ["outstanding", "party", { partyId, cmp_id }],
  settlement: (partyId, cmp_id, classification) => [
    "outstanding",
    "settlement",
    { partyId, cmp_id, classification },
  ],
  partyInfinite: (partyId, cmp_id, limit, positiveOnly = false) => [
    "outstanding",
    "party",
    "infinite",
    { partyId, cmp_id, limit, positiveOnly },
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
  positiveOnly = false,
  enabled = true,
}) =>
  useInfiniteQuery({
    queryKey: outstandingQueryKeys.partyInfinite(
      partyId,
      cmp_id,
      limit,
      positiveOnly
    ),
    queryFn: ({ pageParam = 1, signal }) =>
      outstandingService.getPartyOutstanding({
        partyId,
        cmp_id,
        page: pageParam,   // 👈 sends page
        limit,             // 👈 sends limit
        positiveOnly,
        signal,
        skipGlobalLoader: true,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage?.hasMore ? (lastPage?.page || 1) + 1 : undefined,
    enabled: Boolean(partyId && cmp_id) && enabled,
  });

export const useSettlementOutstandingQuery = ({
  partyId,
  cmp_id,
  classification,
  enabled = true,
}) =>
  // Settlement query used in receipt/payment amount allocation step.
  // Returns positive pending bills for selected party and classification.
  useQuery({
    queryKey: outstandingQueryKeys.settlement(
      partyId,
      cmp_id,
      classification
    ),
    queryFn: ({ signal }) =>
      outstandingService.getPartyOutstanding({
        partyId,
        cmp_id,
        page: 1,
        limit: 200,
        classification,
        isCancelled: false,
        positiveOnly: true,
        signal,
        skipGlobalLoader: true,
      }),
    enabled: Boolean(partyId && cmp_id && classification) && enabled,
    staleTime: 30_000,
  });
