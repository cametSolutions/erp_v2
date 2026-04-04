import { useQuery } from "@tanstack/react-query";

import { getPrintConfig } from "@/api/services/printConfig.service";

export const printConfigQueryKeys = {
  all: ["print-config"],
  detail: (cmp_id, voucherType) => [
    ...printConfigQueryKeys.all,
    cmp_id,
    voucherType,
  ],
};

export const usePrintConfigQuery = (cmp_id, voucherType) =>
  useQuery({
    queryKey: printConfigQueryKeys.detail(cmp_id, voucherType),
    queryFn: () => getPrintConfig(cmp_id, voucherType),
    enabled: Boolean(cmp_id),
    staleTime: 60 * 1000,
  });
