// src/features/vouchers/queries/voucherSeriesQueries.js
import { useQuery } from "@tanstack/react-query";
import api from "@/api/client/apiClient";

export const voucherSeriesKeys = {
  all: ["voucherSeries"],
  list: (cmp_id, voucherType) => ["voucherSeries", cmp_id, voucherType],
  nextNumber: (cmp_id, voucherType) => [
    "voucherSeries",
    "nextNumber",
    cmp_id,
    voucherType,
  ],
};

async function fetchVoucherSeries({ cmp_id, voucherType }) {
  const res = await api.get(
    `/sUsers/getSeriesByVoucher/${cmp_id}?voucherType=${voucherType}&restrict=true`,
    { withCredentials: true },
  );
  return res.data; // { series: [...] }
}

async function fetchNextVoucherSeriesNumber({ cmp_id, voucherType }) {
  const res = await api.get(`/sUsers/nextVoucherSeriesNumber/${cmp_id}`, {
    params: { voucherType },
    withCredentials: true,
  });
  return res.data; // { nextCurrentNumber: number }
}

export function useVoucherSeries({ cmp_id, voucherType, enabled = true }) {
  return useQuery({
    queryKey: voucherSeriesKeys.list(cmp_id, voucherType),
    queryFn: () => fetchVoucherSeries({ cmp_id, voucherType }),
    enabled: !!cmp_id && !!voucherType && enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

export function useNextVoucherSeriesNumber({
  cmp_id,
  voucherType,
  enabled = true,
}) {
  return useQuery({
    queryKey: voucherSeriesKeys.nextNumber(cmp_id, voucherType),
    queryFn: () => fetchNextVoucherSeriesNumber({ cmp_id, voucherType }),
    enabled: !!cmp_id && !!voucherType && enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}
