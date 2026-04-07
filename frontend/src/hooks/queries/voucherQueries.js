import { useQuery } from "@tanstack/react-query";

import api from "@/api/client/apiClient";

function formatLocalDate(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const voucherQueryKeys = {
  all: ["vouchers"],
  summary: (cmpId, date) => [...voucherQueryKeys.all, "summary", cmpId || "", date || ""],
};

export function invalidateVoucherSummaryForCompany(queryClient, cmpId) {
  if (!queryClient || !cmpId) return Promise.resolve();

  return queryClient.invalidateQueries({
    queryKey: [...voucherQueryKeys.all, "summary", cmpId],
    exact: false,
  });
}

export function useVoucherTotalsSummary(cmpId, options = {}) {
  const {
    enabled = true,
    date = formatLocalDate(),
    skipGlobalLoader = true,
    staleTime = 30 * 1000,
    gcTime = 10 * 60 * 1000,
    refetchInterval = false,
  } = options;

  return useQuery({
    queryKey: voucherQueryKeys.summary(cmpId, date),
    queryFn: async () => {
      const response = await api.get("/vouchers/summary", {
        params: { cmpId, date },
        skipGlobalLoader,
      });

      return (
        response.data?.data || {
          date,
          totals: {
            saleOrder: 0,
            receipt: 0,
          },
        }
      );
    },
    enabled: Boolean(cmpId) && enabled,
    staleTime,
    gcTime,
    refetchInterval,
  });
}
