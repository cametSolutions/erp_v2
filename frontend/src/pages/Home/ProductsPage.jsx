import { useEffect, useRef, useState } from "react";
import { Package } from "lucide-react";
import { toast } from "sonner";

import { useMobileHeader } from "@/components/Layout/HomeLayout";
import { Card, CardContent } from "@/components/ui/card";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useInfiniteProductListQuery } from "@/hooks/queries/productQueries";

const PAGE_SIZE = 20;

function ProductRow({ product }) {
  const subtitle = [
    product?.product_code ? `Code: ${product.product_code}` : null,
    // product?.unit ? `Unit: ${product.unit}` : null,
    // product?.hsn_code ? `HSN: ${product.hsn_code}` : null,
  ]
    .filter(Boolean)
    .join(" | ");

  return (
    <Card className="rounded border-none bg-slate-50 py-1 shadow-lg ring-0">
      <CardContent className="flex items-center justify-between gap-3 p-3.5">
        <div className="min-w-0 flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-pink-100 text-pink-600">
            <Package className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">
              {product?.product_name || "Untitled Product"}
            </p>
            <p className="truncate text-xs text-slate-500">
              {subtitle || "No product details"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProductsPage() {
  const [searchText, setSearchText] = useState("");
  const { setHeaderOptions, resetHeaderOptions } = useMobileHeader();
  const loadMoreRef = useRef(null);
  const cmpId = localStorage.getItem("activeCompanyId") || "";
  const debouncedSearchText = useDebouncedValue(searchText.trim(), 500);

  const {
    data,
    error,
    isError,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteProductListQuery({
    cmp_id: cmpId,
    limit: PAGE_SIZE,
    search: debouncedSearchText,
  });

  useEffect(() => {
    setHeaderOptions({
      showMenuDots: false,
      search: {
        show: true,
        value: searchText,
        placeholder: "Search products",
        onChange: setSearchText,
      },
    });

    return () => resetHeaderOptions();
  }, [resetHeaderOptions, searchText, setHeaderOptions]);

  useEffect(() => {
    if (!isError) return;

    const message =
      error?.response?.data?.message || error?.message || "Failed to load products";
    toast.error(message);
  }, [error, isError]);

  useEffect(() => {
    const target = loadMoreRef.current;

    if (!target || !hasNextPage) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px 0px" },
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, data]);

  const products = data?.pages?.flatMap((page) => page?.items || []) || [];

  if (!cmpId) {
    return (
      <div className="w-full font-[sans-serif]">
        <div className="mx-auto w-full max-w-md rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
          Select a company first to view products.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full font-[sans-serif]">
      <div className="mx-auto w-full max-w-md space-y-3">
        {isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-16 animate-pulse rounded-xl border border-slate-200 bg-white"
              />
            ))}
          </div>
        )}

        {!isLoading && products.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
            {debouncedSearchText ? "No matching products" : "No products found"}
          </div>
        )}

        {!isLoading && products.length > 0 && (
          <div className="space-y-2">
            {products.map((product) => (
              <ProductRow
                key={product._id || product.product_master_id}
                product={product}
              />
            ))}
          </div>
        )}

        {hasNextPage && <div ref={loadMoreRef} className="h-4 w-full" />}

        {isFetchingNextPage && (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-medium text-slate-700">
            Loading more products...
          </div>
        )}
      </div>
    </div>
  );
}
