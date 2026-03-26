// src/features/vouchers/queries/voucherSeriesQueries.js
import { useQuery } from "@tanstack/react-query";
import api from "@/api/client/apiClient";

export const voucherSeriesKeys = {
  all: ["voucherSeries"],
  list: (cmpId, voucherType) => ["voucherSeries", cmpId, voucherType],
  nextNumber: (cmpId, voucherType) => [
    "voucherSeries",
    "nextNumber",
    cmpId,
    voucherType,
  ],
};

async function fetchVoucherSeries({ cmpId, voucherType }) {
  const res = await api.get(
    `/sUsers/getSeriesByVoucher/${cmpId}?voucherType=${voucherType}&restrict=true`,
    { withCredentials: true },
  );
  return res.data; // { series: [...] }
}

async function fetchNextVoucherSeriesNumber({ cmpId, voucherType }) {
  const res = await api.get(`/sUsers/nextVoucherSeriesNumber/${cmpId}`, {
    params: { voucherType },
    withCredentials: true,
  });
  return res.data; // { nextCurrentNumber: number }
}

export function useVoucherSeries({ cmpId, voucherType, enabled = true }) {
  return useQuery({
    queryKey: voucherSeriesKeys.list(cmpId, voucherType),
    queryFn: () => fetchVoucherSeries({ cmpId, voucherType }),
    enabled: !!cmpId && !!voucherType && enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

export function useNextVoucherSeriesNumber({
  cmpId,
  voucherType,
  enabled = true,
}) {
  return useQuery({
    queryKey: voucherSeriesKeys.nextNumber(cmpId, voucherType),
    queryFn: () => fetchNextVoucherSeriesNumber({ cmpId, voucherType }),
    enabled: !!cmpId && !!voucherType && enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}
