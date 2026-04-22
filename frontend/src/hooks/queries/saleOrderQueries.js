import { useQuery } from "@tanstack/react-query";

import { saleOrderService } from "@/api/services/saleOrder.service";

// Centralized query-key factory for sale-order data.
// Keep all consumers aligned to avoid cache fragmentation.
export const saleOrderQueryKeys = {
  all: ["sale-orders"],
  detail: (saleOrderId, cmpId = "") => [
    ...saleOrderQueryKeys.all,
    "detail",
    saleOrderId,
    cmpId,
  ],
};

/**
 * Fetches one sale-order detail document.
 *
 * @param {string} saleOrderId
 * @param {string} cmpId
 * @param {{
 *   enabled?: boolean,
 *   initialData?: any,
 *   skipGlobalLoader?: boolean
 * }} options
 * @returns {import("@tanstack/react-query").UseQueryResult}
 */
export function useSaleOrderDetailQuery(saleOrderId, cmpId, options = {}) {
  const {
    enabled = true,
    initialData,
    skipGlobalLoader = true,
  } = options;

  return useQuery({
    queryKey: saleOrderQueryKeys.detail(saleOrderId || "", cmpId || ""),
    queryFn: () =>
      saleOrderService.getSaleOrderById(saleOrderId, {
        cmpId,
        skipGlobalLoader,
      }),
    enabled: Boolean(saleOrderId) && enabled,
    initialData,
  });
}
