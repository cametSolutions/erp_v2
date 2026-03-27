import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import {
  fetchBrands,
  fetchCategories,
  fetchPriceLevels,
  fetchSubcategories,
  getProducts,
} from "@/api/services/product.service";

const SALE_LOOKUP_STALE_TIME = 5 * 60_000;

export const productQueryKeys = {
  all: ["products"],
  brands: (cmp_id, search = "") => [...productQueryKeys.all, "brands", { cmp_id, search }],
  priceLevels: (cmp_id) => ["priceLevels", cmp_id],
  categories: (cmp_id, search = "") => [
    ...productQueryKeys.all,
    "categories",
    { cmp_id, search },
  ],
  subcategories: (cmp_id, search = "") => [
    ...productQueryKeys.all,
    "subcategories",
    { cmp_id, search },
  ],
  infiniteList: (
    cmp_id,
    limit = 20,
    search = "",
    priceLevel = "",
    brand = "",
    category = "",
    subcategory = ""
  ) => [
    ...productQueryKeys.all,
    "infinite-list",
    { cmp_id, limit, search, priceLevel, brand, category, subcategory },
  ],
};

export const useInfiniteProductListQuery = ({
  cmp_id,
  limit = 20,
  search = "",
  priceLevel = "",
  brand = "",
  category = "",
  subcategory = "",
  enabled = true,
}) =>
  useInfiniteQuery({
    queryKey: productQueryKeys.infiniteList(
      cmp_id || "",
      limit,
      search,
      priceLevel,
      brand,
      category,
      subcategory
    ),
    queryFn: ({ pageParam = 1, signal }) =>
      getProducts({
        page: pageParam,
        limit,
        cmp_id,
        search,
        priceLevel,
        brand,
        category,
        subcategory,
        signal,
        skipGlobalLoader: true,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage?.hasMore ? (lastPage?.page || 1) + 1 : undefined,
    enabled: Boolean(cmp_id) && enabled,
    staleTime: SALE_LOOKUP_STALE_TIME,
  });

export const useBrandsQuery = ({ cmp_id, search = "", enabled = true }) =>
  useQuery({
    queryKey: productQueryKeys.brands(cmp_id || "", search),
    queryFn: () =>
      fetchBrands({
        cmp_id,
        search,
        skipGlobalLoader: true,
      }),
    enabled: Boolean(cmp_id) && enabled,
    staleTime: SALE_LOOKUP_STALE_TIME,
  });

export const usePriceLevelsQuery = ({ cmp_id, enabled = true }) =>
  useQuery({
    queryKey: productQueryKeys.priceLevels(cmp_id || ""),
    queryFn: () => fetchPriceLevels(cmp_id, { skipGlobalLoader: true }),
    enabled: Boolean(cmp_id) && enabled,
    staleTime: SALE_LOOKUP_STALE_TIME,
  });

export const useCategoriesQuery = ({ cmp_id, search = "", enabled = true }) =>
  useQuery({
    queryKey: productQueryKeys.categories(cmp_id || "", search),
    queryFn: () =>
      fetchCategories({
        cmp_id,
        search,
        skipGlobalLoader: true,
      }),
    enabled: Boolean(cmp_id) && enabled,
    staleTime: SALE_LOOKUP_STALE_TIME,
  });

export const useSubcategoriesQuery = ({
  cmp_id,
  search = "",
  enabled = true,
}) =>
  useQuery({
    queryKey: productQueryKeys.subcategories(cmp_id || "", search),
    queryFn: () =>
      fetchSubcategories({
        cmp_id,
        search,
        skipGlobalLoader: true,
      }),
    enabled: Boolean(cmp_id) && enabled,
    staleTime: SALE_LOOKUP_STALE_TIME,
  });
