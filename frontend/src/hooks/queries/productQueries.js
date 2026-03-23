import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

import {
  fetchBrands,
  fetchCategories,
  fetchPriceLevels,
  fetchSubcategories,
  getProducts,
} from "@/api/services/product.service";

export const productQueryKeys = {
  all: ["products"],
  brands: (cmpId, search = "") => [...productQueryKeys.all, "brands", { cmpId, search }],
  priceLevels: (cmpId) => ["priceLevels", cmpId],
  categories: (cmpId, search = "") => [
    ...productQueryKeys.all,
    "categories",
    { cmpId, search },
  ],
  subcategories: (cmpId, search = "") => [
    ...productQueryKeys.all,
    "subcategories",
    { cmpId, search },
  ],
  infiniteList: (
    cmpId,
    limit = 20,
    search = "",
    priceLevel = "",
    brand = "",
    category = "",
    subcategory = ""
  ) => [
    ...productQueryKeys.all,
    "infinite-list",
    { cmpId, limit, search, priceLevel, brand, category, subcategory },
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
    staleTime: 30_000,
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
    staleTime: 60_000,
  });

export const usePriceLevelsQuery = ({ cmp_id, enabled = true }) =>
  useQuery({
    queryKey: productQueryKeys.priceLevels(cmp_id || ""),
    queryFn: () => fetchPriceLevels(cmp_id, { skipGlobalLoader: true }),
    enabled: Boolean(cmp_id) && enabled,
    staleTime: 60_000,
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
    staleTime: 60_000,
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
    staleTime: 60_000,
  });
