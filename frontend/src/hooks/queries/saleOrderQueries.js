import { useQuery } from "@tanstack/react-query";

import { saleOrderService } from "@/api/services/saleOrder.service";

export const saleOrderQueryKeys = {
  all: ["sale-orders"],
  detail: (saleOrderId, cmpId = "") => [
    ...saleOrderQueryKeys.all,
    "detail",
    saleOrderId,
    cmpId,
  ],
};

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
