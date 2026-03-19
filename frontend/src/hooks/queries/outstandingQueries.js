// src/hooks/queries/outstandingQueries.js
import { useQuery } from "@tanstack/react-query";
import { outstandingService } from "@/api/services/outstanding.service";

export const outstandingQueryKeys = {
  party: (partyId, cmpId) => ["outstanding", "party", { partyId, cmpId }],
};

export const usePartyOutstandingQuery = (partyId, cmpId, enabled = true) =>
  useQuery({
    queryKey: outstandingQueryKeys.party(partyId, cmpId),
    queryFn: ({ signal }) =>
      outstandingService.getPartyOutstanding({
        partyId,
        cmp_id: cmpId,
        signal,
        skipGlobalLoader: true,
      }),
    enabled: Boolean(partyId && cmpId) && enabled,
    staleTime: 30_000,
  });
