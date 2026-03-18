import { useInfiniteQuery } from "@tanstack/react-query";

import { productService } from "@/api/services/product.service";

export const productQueryKeys = {
  all: ["products"],
  infiniteList: (cmpId, limit = 20, search = "") => [
    ...productQueryKeys.all,
    "infinite-list",
    { cmpId, limit, search },
  ],
};

export const useInfiniteProductListQuery = ({
  cmp_id,
  limit = 20,
  search = "",
  enabled = true,
}) =>
  useInfiniteQuery({
    queryKey: productQueryKeys.infiniteList(cmp_id || "", limit, search),
    queryFn: ({ pageParam = 1, signal }) =>
      productService.getProducts({
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
