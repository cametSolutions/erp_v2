import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Barcode,
  ChevronDown,
  ChevronLeft,
  LoaderCircle,
  Package,
  Pencil,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

import { getProductById, productService } from "@/api/services/product.service";
import { useMobileHeader } from "@/components/Layout/HomeLayout";
import ItemEditSheet from "@/components/sales/ItemEditSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  useBrandsQuery,
  useCategoriesQuery,
  useInfiniteProductListQuery,
  usePriceLevelsQuery,
  useSubcategoriesQuery,
} from "@/hooks/queries/productQueries";
import { ROUTES } from "@/routes/paths";
import {
  addItemsFromSelection,
  recalculateItem,
  setPriceLevel,
  setPriceLevelObject,
  updateItem,
} from "@/store/slices/transactionSlice";

const PAGE_SIZE = 20;

function getProductId(product) {
  return product?._id || product?.id || product?.product_master_id;
}

function getMasterOptionId(option) {
  return (
    option?.value ||
    option?.id ||
    option?._id ||
    option?.brand_id ||
    option?.category_id ||
    option?.subcategory_id
  );
}

function getMasterOptionLabel(option) {
  return (
    option?.label ||
    option?.brand ||
    option?.category ||
    option?.subcategory ||
    option?.name ||
    "Unnamed"
  );
}

function getSubcategoryCategoryId(subcategory) {
  return (
    subcategory?.categoryId ||
    subcategory?.category_id ||
    subcategory?.category?._id ||
    subcategory?.category?.id ||
    ""
  );
}

function buildCalcItemFromStaged(stagedItem) {
  if (!stagedItem) return null;

  return {
    rate: Number(stagedItem.rate) || 0,
    billedQty:
      Number(
        stagedItem.billedQty != null
          ? stagedItem.billedQty
          : stagedItem.quantity,
      ) || 0,
    taxRate:
      Number(stagedItem.productDetail?.taxRate ?? stagedItem.taxRate ?? 0) || 0,
    taxInclusive: Boolean(stagedItem.taxInclusive),
    discountType: stagedItem.discountType || "percentage",
    discountPercentage: Number(stagedItem.discountPercentage) || 0,
    discountAmount: Number(stagedItem.discountAmount) || 0,
  };
}

function getProductTaxRate(productDetail) {
  const directTaxRate = productDetail?.taxRate;
  if (directTaxRate != null) return Number(directTaxRate) || 0;

  const igst = productDetail?.igst;
  if (igst != null) return Number(igst) || 0;

  const cgst = Number(productDetail?.cgst) || 0;
  const sgst = Number(productDetail?.sgst) || 0;
  return cgst + sgst;
}

function buildProductDetail(product) {
  const { rate: _ignoredRate, ...detail } = product || {};

  return {
    ...detail,
    _id: getProductId(detail),
    product_name: detail?.product_name || detail?.name || "Untitled Product",
    hsn: detail?.hsn || detail?.hsn_code || "",
    unit: detail?.unit || "",
    taxRate:
      detail?.taxRate != null
        ? Number(detail.taxRate) || 0
        : getProductTaxRate(detail),
    priceLevels: Array.isArray(detail?.priceLevels) ? detail.priceLevels : [],
  };
}

function createStagedItemFromTransactionItem(item) {
  const billedQty = Number(item?.billedQty) || 0;
  const actualQty = Number(item?.actualQty ?? item?.billedQty) || 0;
  const detail = buildProductDetail({
    _id: item?.id,
    product_name: item?.name,
    hsn: item?.hsn,
    unit: item?.unit,
    taxRate: item?.taxRate,
    priceLevels: item?.priceLevels,
  });

  return {
    quantity: billedQty,
    originalQuantity: billedQty,
    productDetail: detail,
    rate: Number(item?.rate) || 0,
    initialPriceSource: item?.initialPriceSource || "manual",
    taxInclusive: Boolean(item?.taxInclusive),
    actualQty,
    billedQty,
    discountType: item?.discountType || "percentage",
    discountPercentage: Number(item?.discountPercentage) || 0,
    discountAmount: Number(item?.discountAmount) || 0,
    description: item?.description || "",
    warrantyCardId: item?.warrantyCardId || null,
    originalSnapshot: {
      rate: Number(item?.rate) || 0,
      taxInclusive: Boolean(item?.taxInclusive),
      actualQty,
      billedQty,
      discountType: item?.discountType || "percentage",
      discountPercentage: Number(item?.discountPercentage) || 0,
      discountAmount: Number(item?.discountAmount) || 0,
      description: item?.description || "",
      warrantyCardId: item?.warrantyCardId || null,
    },
  };
}

function buildEditableItem(productId, stagedItem) {
  const detail = buildProductDetail(stagedItem?.productDetail);

  return {
    id: productId,
    name: detail?.product_name || "Untitled Product",
    hsn: detail?.hsn || "",
    unit: detail?.unit || "",
    taxRate: getProductTaxRate(detail),
    priceLevels: Array.isArray(detail?.priceLevels) ? detail.priceLevels : [],
    rate: Number(stagedItem?.rate) || 0,
    initialPriceSource: stagedItem?.initialPriceSource || "manual",
    actualQty: Number(stagedItem?.actualQty ?? stagedItem?.quantity) || 0,
    billedQty: Number(stagedItem?.billedQty ?? stagedItem?.quantity) || 0,
    taxInclusive: Boolean(stagedItem?.taxInclusive),
    discountType: stagedItem?.discountType || "percentage",
    discountPercentage: Number(stagedItem?.discountPercentage) || 0,
    discountAmount: Number(stagedItem?.discountAmount) || 0,
    description: stagedItem?.description || "",
    warrantyCardId: stagedItem?.warrantyCardId || null,
    basePrice: 0,
    taxableAmount: 0,
    taxAmount: 0,
    totalAmount: 0,
  };
}

function getPriceLevelRate(productDetail, priceLevelId) {
  if (!priceLevelId || !Array.isArray(productDetail?.priceLevels)) return null;

  const match = productDetail.priceLevels.find(
    (level) => level?.priceLevel?.toString() === priceLevelId?.toString(),
  );

  return match?.priceRate ?? null;
}

async function fetchPartyLsp(partyId, productId) {
  return productService.fetchPartyLsp(partyId, productId, {
    skipGlobalLoader: true,
  });
}

async function fetchGlobalLsp(productId) {
  return productService.fetchGlobalLsp(productId, {
    skipGlobalLoader: true,
  });
}

async function resolveInitialRate({
  partyId,
  productId,
  productDetail,
  priceLevel,
}) {
  const partyLsp = await fetchPartyLsp(partyId, productId);
  if (partyLsp != null && Number(partyLsp) > 0) {
    return { source: "partyLsp", rate: Number(partyLsp) || 0 };
  }

  const globalLsp = await fetchGlobalLsp(productId);
  if (globalLsp != null && Number(globalLsp) > 0) {
    return { source: "globalLsp", rate: Number(globalLsp) || 0 };
  }

  if (priceLevel) {
    const levelRate = getPriceLevelRate(productDetail, priceLevel);
    if (levelRate != null) {
      return { source: "priceLevel", rate: Number(levelRate) || 0 };
    }
  }

  return { source: "manual", rate: 0 };
}

function FilterDropdown({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
}) {
  return (
    <div className="space-y-2">
      <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 pr-10 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        >
          <option value="">{placeholder}</option>
          {options.map((option) => {
            const optionValue = getMasterOptionId(option);

            return (
              <option key={optionValue} value={optionValue}>
                {getMasterOptionLabel(option)}
              </option>
            );
          })}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>
    </div>
  );
}

function FilterSheet({
  open,
  onOpenChange,
  appliedPriceLevel,
  appliedBrandId,
  appliedCategoryId,
  appliedSubcategoryId,
  priceLevels,
  brands,
  categories,
  subcategories,
  onApply,
}) {
  const [draftPriceLevel, setDraftPriceLevel] = useState(
    appliedPriceLevel || "",
  );
  const [draftBrandId, setDraftBrandId] = useState(appliedBrandId || "");
  const [draftCategoryId, setDraftCategoryId] = useState(
    appliedCategoryId || "",
  );
  const [draftSubcategoryId, setDraftSubcategoryId] = useState(
    appliedSubcategoryId || "",
  );

  useEffect(() => {
    if (!open) return;

    setDraftPriceLevel(appliedPriceLevel || "");
    setDraftBrandId(appliedBrandId || "");
    setDraftCategoryId(appliedCategoryId || "");
    setDraftSubcategoryId(appliedSubcategoryId || "");
  }, [
    appliedBrandId,
    appliedCategoryId,
    appliedPriceLevel,
    appliedSubcategoryId,
    open,
  ]);

  useEffect(() => {
    if (!draftCategoryId) return;

    const isVisible = subcategories.some((subcategory) => {
      const categoryId = getSubcategoryCategoryId(subcategory);
      if (!categoryId) return false;
      return categoryId === draftCategoryId;
    });

    if (!isVisible) {
      setDraftSubcategoryId("");
    }
  }, [draftCategoryId, draftSubcategoryId, subcategories]);

  const visibleSubcategories = useMemo(() => {
    if (!draftCategoryId) return [];

    return subcategories.filter((subcategory) => {
      const categoryId = getSubcategoryCategoryId(subcategory);
      if (!categoryId) return false;
      return categoryId === draftCategoryId;
    });
  }, [draftCategoryId, subcategories]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full w-full max-w-full flex-col border-l bg-white p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b border-slate-100 px-4 py-4">
          <SheetTitle className="text-sm">Filters</SheetTitle>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-5 px-4 py-4">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">
                Filter products
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Use the dropdowns below to narrow the product list.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                Price Level
              </label>
              <div className="relative">
                <select
                  value={draftPriceLevel}
                  onChange={(event) => setDraftPriceLevel(event.target.value)}
                  className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 pr-10 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Default (no price level)</option>
                  {priceLevels.map((priceLevel) => (
                    <option key={priceLevel?._id} value={priceLevel?._id}>
                      {priceLevel?.pricelevel || "Unnamed"}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <FilterDropdown
              label="Brand"
              value={draftBrandId}
              onChange={setDraftBrandId}
              options={brands}
              placeholder="All brands"
            />

            <FilterDropdown
              label="Category"
              value={draftCategoryId}
              onChange={(value) => {
                setDraftCategoryId(value);
                setDraftSubcategoryId("");
              }}
              options={categories}
              placeholder="All categories"
            />

            <FilterDropdown
              label="Subcategory"
              value={draftSubcategoryId}
              onChange={setDraftSubcategoryId}
              options={visibleSubcategories}
              placeholder={
                draftCategoryId
                  ? "All subcategories"
                  : "Select category first"
              }
              disabled={!draftCategoryId}
            />
          </div>
        </ScrollArea>

        <SheetFooter className="border-t border-slate-100 px-4 py-4">
          <Button
            type="button"
            variant="outline"
            className="min-h-10"
            onClick={() => {
              setDraftPriceLevel("");
              setDraftBrandId("");
              setDraftCategoryId("");
              setDraftSubcategoryId("");
            }}
          >
            Reset
          </Button>
          <Button
            type="button"
            className="min-h-10"
            onClick={() => {
              onApply({
                priceLevel: draftPriceLevel || "",
                brandId: draftBrandId || "",
                categoryId: draftCategoryId || "",
                subcategoryId: draftSubcategoryId || "",
              });
              onOpenChange(false);
            }}
          >
            Apply
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function ProductRow({
  product,
  stagedItem,
  loading,
  priceLevel,
  onAdd,
  onEdit,
  onIncrement,
  onDecrement,
}) {
  const quantity = Number(stagedItem?.quantity) || 0;
  const displayRate =
    (stagedItem?.rate > 0 ? stagedItem.rate : null) ??
    getPriceLevelRate(buildProductDetail(product), priceLevel) ??
    0;
  let totalAmount = null;
  if (stagedItem && quantity > 0) {
    const calcItem = buildCalcItemFromStaged(stagedItem);
    if (calcItem) {
      const result = recalculateItem({ ...calcItem });
      totalAmount = result.totalAmount || 0;
    }
  }

  const subtitle = [
    product?.brand?.brand || product?.brandName || product?.brand,
    product?.category?.category || product?.categoryName || product?.category,
    product?.sub_category?.subcategory ||
      product?.subcategoryName ||
      product?.subcategory,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="border-b border-slate-200 bg-white  py-3 ">
      <div className="flex items-stretch gap-3">
        <div className="flex w-16 shrink-0 items-center justify-center rounded-sm bg-indigo-50 px-3">
          <div className="flex items-center justify-center">
            <Package className="h-5 w-5 text-indigo-400" />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-900">
              {product?.product_name || "Untitled Product"}
            </p>
            {subtitle && (
              <p className="mt-0.5 truncate text-xs text-slate-500">
                {subtitle}
              </p>
            )}
          </div>

          <div className="mt-2 flex items-center gap-1.5">
            <button
              type="button"
              className="
                flex h-7 w-7 items-center justify-center rounded
                border border-rose-200 bg-rose-50
                text-sm text-rose-500
                hover:bg-rose-100 hover:border-rose-300
                disabled:opacity-40
              "
              disabled={loading || quantity <= 0}
              onClick={() => onDecrement(product)}
            >
              −
            </button>

            <span className="min-w-[1.75rem] text-center text-xs font-semibold text-slate-900">
              {quantity}
            </span>

            <button
              type="button"
              className="
                flex h-7 w-7 items-center justify-center rounded
                border border-emerald-200 bg-emerald-50
                text-sm text-emerald-600
                hover:bg-emerald-100 hover:border-emerald-300
                disabled:opacity-40
              "
              disabled={loading}
              onClick={() => (quantity > 0 ? onIncrement(product) : onAdd(product))}
            >
              +
            </button>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {(Number(displayRate) || 0).toFixed(2)}
              </p>
              {totalAmount != null && (
                <p className="text-[11px] text-slate-600">
                  Total: ₹{totalAmount.toFixed(2)}
                </p>
              )}
              <p className="text-[11px] text-slate-500">
                {quantity > 0
                  ? stagedItem?.initialPriceSource || "manual"
                  : "Tap + to add"}
              </p>
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40"
              disabled={loading || quantity <= 0}
              onClick={() => onEdit(product)}
            >
              <Pencil className="h-3 w-3" />
              Edit item
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
export default function ProductSelectPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { setHeaderOptions, resetHeaderOptions } = useMobileHeader();
  const loadMoreRef = useRef(null);
  const didSeedRef = useRef(false);
  const reduxPriceLevel = useSelector((state) => state.transaction.priceLevel);
  const transactionItems = useSelector((state) => state.transaction.items);
  const party = useSelector((state) => state.transaction.party);
  const cmpId = useSelector((state) => state.company.selectedCompanyId) || "";
  const [search, setSearch] = useState("");
  const [appliedPriceLevel, setAppliedPriceLevel] = useState(
    reduxPriceLevel || "",
  );
  const [brandId, setBrandId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [stagedItems, setStagedItems] = useState({});
  const [loadingProductIds, setLoadingProductIds] = useState({});
  const [editingProductId, setEditingProductId] = useState(null);
  const [pendingPriceLevelChange, setPendingPriceLevelChange] = useState(null);
  const debouncedSearch = useDebouncedValue(search.trim(), 500);

  console.log(stagedItems);
  

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
    search: debouncedSearch,
    priceLevel: appliedPriceLevel,
    brand: brandId,
    category: categoryId,
    subcategory: subcategoryId,
  });

  const { data: brandsData = [] } = useBrandsQuery({ cmp_id: cmpId });
  const { data: priceLevelsData = [] } = usePriceLevelsQuery({ cmp_id: cmpId });
  const { data: categoriesData = [] } = useCategoriesQuery({ cmp_id: cmpId });
  const { data: subcategoriesData = [] } = useSubcategoriesQuery({
    cmp_id: cmpId,
  });

  useEffect(() => {
    if (didSeedRef.current) return;

    const seededItems = (transactionItems || []).reduce((accumulator, item) => {
      if (!item?.id) return accumulator;
      accumulator[item.id] = createStagedItemFromTransactionItem(item);
      return accumulator;
    }, {});

    setStagedItems(seededItems);
    didSeedRef.current = true;
  }, [transactionItems]);

  useEffect(() => {
    if (!reduxPriceLevel) return;
    if (reduxPriceLevel === appliedPriceLevel) return;
    setAppliedPriceLevel(reduxPriceLevel);
  }, [appliedPriceLevel, reduxPriceLevel]);

  useEffect(() => {
    if (!isError) return;

    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to load products";
    toast.error(message);
  }, [error, isError]);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !hasNextPage) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "180px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, data]);

  const products = useMemo(
    () => data?.pages?.flatMap((page) => page?.items || []) || [],
    [data],
  );

  const editingStagedItem = editingProductId
    ? stagedItems[editingProductId] || null
    : null;

  const stagedItemCount = useMemo(
    () =>
      Object.values(stagedItems).filter(
        (item) => (Number(item?.quantity) || 0) > 0,
      ).length,
    [stagedItems],
  );

  const filterCount = useMemo(() => {
    return [appliedPriceLevel, brandId, categoryId, subcategoryId].filter(
      Boolean,
    ).length;
  }, [appliedPriceLevel, brandId, categoryId, subcategoryId]);

  const applyFilters = useCallback(
    ({
      priceLevel,
      brandId: nextBrandId,
      categoryId: nextCategoryId,
      subcategoryId: nextSubcategoryId,
    }) => {
      const matchedPriceLevel = priceLevelsData.find(
        (level) => level?._id?.toString() === priceLevel?.toString(),
      );

      setAppliedPriceLevel(priceLevel || "");
      setBrandId(nextBrandId || "");
      setCategoryId(nextCategoryId || "");
      setSubcategoryId(nextSubcategoryId || "");
      dispatch(setPriceLevel(priceLevel || null));
      dispatch(setPriceLevelObject(matchedPriceLevel || null));
    },
    [dispatch, priceLevelsData],
  );

  const ensureProductDetail = async (product, stagedItem) => {
    const productId = getProductId(product) || stagedItem?.productDetail?._id;
    const existingDetail = stagedItem?.productDetail;

    if (
      existingDetail?.unit &&
      Array.isArray(existingDetail?.priceLevels) &&
      existingDetail.priceLevels.length > 0
    ) {
      return buildProductDetail(existingDetail);
    }

    const fetchedDetail = await getProductById(productId, {
      skipGlobalLoader: true,
    });

    return buildProductDetail({
      ...(product || {}),
      ...(existingDetail || {}),
      ...(fetchedDetail || {}),
    });
  };

  const setLoading = (productId, isLoadingValue) => {
    setLoadingProductIds((current) => {
      const next = { ...current };
      if (isLoadingValue) {
        next[productId] = true;
      } else {
        delete next[productId];
      }
      return next;
    });
  };

  const handleAddOrIncrement = async (product) => {
    const productId = getProductId(product);
    if (!productId) return;

    const existingItem = stagedItems[productId];
    if (existingItem) {
      const nextQuantity = (Number(existingItem?.quantity) || 0) + 1;
      setStagedItems((current) => ({
        ...current,
        [productId]: {
          ...current[productId],
          quantity: nextQuantity,
          billedQty: nextQuantity,
          actualQty: nextQuantity,
        },
      }));
      return;
    }

    setLoading(productId, true);

    try {
      const productDetail = await ensureProductDetail(product, existingItem);
      const { rate, source } = await resolveInitialRate({
        partyId: party?._id || party?.id || null,
        productId,
        productDetail,
        priceLevel: appliedPriceLevel || "",
      });

      setStagedItems((current) => ({
        ...current,
        [productId]: {
          quantity: 1,
          originalQuantity: 0,
          productDetail,
          rate,
          initialPriceSource: source,
          taxInclusive: false,
          actualQty: 1,
          billedQty: 1,
          discountType: "percentage",
          discountPercentage: 0,
          discountAmount: 0,
          description: "",
          warrantyCardId: null,
          originalSnapshot: null,
        },
      }));
    } catch (incrementError) {
      const message =
        incrementError?.response?.data?.message ||
        incrementError?.message ||
        "Failed to add this product";
      toast.error(message);
    } finally {
      setLoading(productId, false);
    }
  };

  const handleDecrement = (product) => {
    const productId = getProductId(product);
    if (!productId || !stagedItems[productId]) return;

    setStagedItems((current) => {
      const existingItem = current[productId];
      const nextQuantity = (Number(existingItem?.quantity) || 0) - 1;

      if (nextQuantity <= 0) {
        const next = { ...current };
        delete next[productId];
        return next;
      }

      return {
        ...current,
        [productId]: {
          ...existingItem,
          quantity: nextQuantity,
          billedQty: nextQuantity,
          actualQty: nextQuantity,
        },
      };
    });
  };

  const openEditSheet = async (product) => {
    const productId = getProductId(product);
    const stagedItem = stagedItems[productId];
    if (!productId || !stagedItem) return;

    try {
      const productDetail = await ensureProductDetail(product, stagedItem);
      setStagedItems((current) => ({
        ...current,
        [productId]: {
          ...current[productId],
          productDetail,
        },
      }));
      setEditingProductId(productId);
    } catch (editError) {
      const message =
        editError?.response?.data?.message ||
        editError?.message ||
        "Failed to load item details";
      toast.error(message);
    }
  };

  const handleStagedSave = (changes) => {
    if (!editingProductId) return;

    setStagedItems((current) => {
      const existingItem = current[editingProductId];
      if (!existingItem) return current;

      const nextBilledQty = Number(changes?.billedQty) || 0;
      const nextActualQty = Number(changes?.actualQty) || nextBilledQty;

      return {
        ...current,
        [editingProductId]: {
          ...existingItem,
          ...changes,
          quantity: nextBilledQty,
          billedQty: nextBilledQty,
          actualQty: nextActualQty,
          rate: Number(changes?.rate) || 0,
          discountType:
            changes?.discountType ||
            existingItem?.discountType ||
            "percentage",
          discountPercentage: Number(changes?.discountPercentage) || 0,
          discountAmount: Number(changes?.discountAmount) || 0,
        },
      };
    });
  };

  const openFilterSheet = useCallback(() => {
    setIsFilterSheetOpen(true);
  }, []);

  const confirmPriceLevelChange = useCallback(() => {
    if (!pendingPriceLevelChange) return;

    const { priceLevel } = pendingPriceLevelChange;

    setStagedItems((current) => {
      const next = { ...current };

      Object.entries(next).forEach(([productId, staged]) => {
        const nextRate = getPriceLevelRate(staged?.productDetail, priceLevel);

        next[productId] = {
          ...staged,
          rate: nextRate != null ? Number(nextRate) || 0 : 0,
          initialPriceSource: "priceLevel",
        };
      });

      return next;
    });

    applyFilters(pendingPriceLevelChange);
    setPendingPriceLevelChange(null);
  }, [applyFilters, pendingPriceLevelChange]);

  const cancelPriceLevelChange = useCallback(() => {
    setPendingPriceLevelChange(null);
  }, []);

  const handleContinue = useCallback(() => {
    const payload = [];

    Object.entries(stagedItems).forEach(([productId, staged]) => {
      const detail = buildProductDetail(staged?.productDetail);
      const quantity = Number(staged?.quantity) || 0;
      const originalQuantity = Number(staged?.originalQuantity) || 0;
      const deltaQuantity = Math.max(quantity - originalQuantity, 0);
      const baseChanges = {
        rate: Number(staged?.rate) || 0,
        taxInclusive: Boolean(staged?.taxInclusive),
        discountType: staged?.discountType || "percentage",
        discountPercentage: Number(staged?.discountPercentage) || 0,
        discountAmount: Number(staged?.discountAmount) || 0,
        description: staged?.description || "",
        warrantyCardId: staged?.warrantyCardId || null,
      };

      if (originalQuantity > 0) {
        const snapshot = staged?.originalSnapshot || {};

        if (deltaQuantity > 0) {
          dispatch(updateItem({ id: productId, changes: baseChanges }));
        } else {
          const keptSameQuantity = quantity === originalQuantity;
          const shouldUpdateExisting =
            snapshot.rate !== baseChanges.rate ||
            snapshot.taxInclusive !== baseChanges.taxInclusive ||
            snapshot.discountType !== baseChanges.discountType ||
            snapshot.discountPercentage !== baseChanges.discountPercentage ||
            snapshot.discountAmount !== baseChanges.discountAmount ||
            snapshot.description !== baseChanges.description ||
            snapshot.warrantyCardId !== baseChanges.warrantyCardId ||
            (keptSameQuantity &&
              (snapshot.actualQty !== (Number(staged?.actualQty) || quantity) ||
                snapshot.billedQty !== quantity));

          if (shouldUpdateExisting) {
            dispatch(
              updateItem({
                id: productId,
                changes: {
                  ...baseChanges,
                  ...(keptSameQuantity
                    ? {
                        actualQty: Number(staged?.actualQty) || quantity,
                        billedQty: quantity,
                      }
                    : {}),
                },
              }),
            );
          }
        }
      }

      if (deltaQuantity <= 0) return;

      payload.push({
        id: productId,
        name: detail?.product_name || "Untitled Product",
        hsn: detail?.hsn || "",
        unit: detail?.unit || "",
        taxRate: getProductTaxRate(detail),
        priceLevels: Array.isArray(detail?.priceLevels) ? detail.priceLevels : [],
        priceLevel: appliedPriceLevel || null,
        rate: Number(staged?.rate) || 0,
        initialPriceSource: staged?.initialPriceSource || "manual",
        actualQty: deltaQuantity,
        billedQty: deltaQuantity,
        taxInclusive: Boolean(staged?.taxInclusive),
        discountType: staged?.discountType || "percentage",
        discountPercentage: Number(staged?.discountPercentage) || 0,
        discountAmount: Number(staged?.discountAmount) || 0,
        description: staged?.description || "",
        warrantyCardId: staged?.warrantyCardId || null,
        basePrice: 0,
        taxableAmount: 0,
        taxAmount: 0,
        totalAmount: 0,
      });
    });

    if (payload.length > 0) {
      dispatch(addItemsFromSelection(payload));
    }

    navigate(ROUTES.createOrder);
  }, [appliedPriceLevel, dispatch, navigate, stagedItems]);

  useEffect(() => {
    setHeaderOptions({
      showMenuDots: true,
      actionButtons: [
        {
          label: "Done",
          primaryButton: true,
          onClick: handleContinue,
          variant: "default",
          size: "sm",
          className: "px-2.5 w-[110px] bg-violet-800 text-white",
        },

        {
          label: "",
          icon: SlidersHorizontal,
          onClick: openFilterSheet,
          variant: "outline",
          size: "sm",
          className: "px-2.5",
        },
        {
          label: "",
          icon: Barcode,
          onClick: () => {},
          variant: "outline",
          size: "sm",
          className: "px-2.5",
        },
      ],
      search: {
        show: true,
        value: search,
        placeholder: "Search products by name or code",
        onChange: setSearch,
      },
    });

    return () => resetHeaderOptions();
  }, [
    handleContinue,
    openFilterSheet,
    resetHeaderOptions,
    search,
    setHeaderOptions,
  ]);

  if (!cmpId) {
    return (
      <div className="flex h-full items-center justify-center px-4">
        <div className="w-full max-w-md rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
          Select a company first to choose items.
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-full min-h-0 overflow-hidden flex-col bg-slate-50">
        <header className="hidden shrink-0 border-b border-slate-200 bg-white px-4 py-3 md:block">
          <div className="mx-auto flex max-w-5xl flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <div className="min-w-0">
                  <h1 className="text-sm font-semibold text-slate-900">
                    Select Items
                  </h1>
                  <p className="truncate text-[11px] text-slate-500">
                    {party?.partyName || "No party selected"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button type="button" size="sm" onClick={handleContinue}>
                  <span className="hidden sm:inline">Continue</span>
                  <span className="sm:hidden">Done</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={openFilterSheet}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span>
                    Filters{filterCount > 0 ? ` (${filterCount})` : ""}
                  </span>
                </Button>

                <Button type="button" variant="outline" size="sm">
                  <Barcode className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Scan</span>
                </Button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search products by name or code"
                className="min-h-11 pl-9 text-sm"
              />
            </div>
          </div>
        </header>

        <div className=" mx-auto flex w-full max-w-5xl min-h-0 flex-1 flex-col overflow-hidden py-1 sm:py-4">
          <div className="min-h-0 flex-1 overflow-hidden rounded-sm border border-slate-200 bg-white">
            <ScrollArea className="h-full">
              <div className="space-y-3 p-3 sm:p-4">
                {isLoading && (
                  <div className="space-y-2">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <div
                        key={index}
                        className="h-28 animate-pulse rounded-xl border border-slate-200 bg-slate-50"
                      />
                    ))}
                  </div>
                )}

                {!isLoading && products.length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                    {debouncedSearch
                      ? "No matching products found"
                      : "No products found"}
                  </div>
                )}

                {!isLoading &&
                  products.map((product) => {
                    const productId = getProductId(product);
                    return (
                      <ProductRow
                        key={productId}
                        product={product}
                        stagedItem={stagedItems[productId]}
                        loading={Boolean(loadingProductIds[productId])}
                        priceLevel={appliedPriceLevel || ""}
                        onAdd={handleAddOrIncrement}
                        onEdit={openEditSheet}
                        onIncrement={handleAddOrIncrement}
                        onDecrement={handleDecrement}
                      />
                    );
                  })}

                {hasNextPage && (
                  <div ref={loadMoreRef} className="h-4 w-full" />
                )}

                {isFetchingNextPage && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm text-slate-600">
                    Loading more products...
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* <footer className="border-t border-slate-200 bg-white px-4 py-3">
          <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-slate-500">
              {selectedCount} item{selectedCount === 1 ? "" : "s"} staged
              {appliedPriceLevel ? ` · ${appliedPriceLevel}` : ""}
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
              >
                Back
              </Button>
              <Button type="button" onClick={handleContinue}>
                Continue
              </Button>
            </div>
          </div>
        </footer> */}
      </div>

      <FilterSheet
        open={isFilterSheetOpen}
        onOpenChange={setIsFilterSheetOpen}
        appliedPriceLevel={appliedPriceLevel}
        appliedBrandId={brandId}
        appliedCategoryId={categoryId}
        appliedSubcategoryId={subcategoryId}
        priceLevels={Array.isArray(priceLevelsData) ? priceLevelsData : []}
        brands={Array.isArray(brandsData) ? brandsData : []}
        categories={Array.isArray(categoriesData) ? categoriesData : []}
        subcategories={
          Array.isArray(subcategoriesData) ? subcategoriesData : []
        }
        onApply={({
          priceLevel,
          brandId: nextBrandId,
          categoryId: nextCategoryId,
          subcategoryId: nextSubcategoryId,
        }) => {
          const hasPriceLevelChanged =
            (priceLevel || "") !== (appliedPriceLevel || "");
          const hasStagedItems = Object.values(stagedItems).some(
            (item) => (Number(item?.quantity) || 0) > 0,
          );

          if (hasPriceLevelChanged && hasStagedItems) {
            setPendingPriceLevelChange({
              priceLevel,
              brandId: nextBrandId,
              categoryId: nextCategoryId,
              subcategoryId: nextSubcategoryId,
            });
            return;
          }

          applyFilters({
            priceLevel,
            brandId: nextBrandId,
            categoryId: nextCategoryId,
            subcategoryId: nextSubcategoryId,
          });
        }}
      />

      <ItemEditSheet
        open={Boolean(editingStagedItem)}
        onOpenChange={(open) => {
          if (!open) setEditingProductId(null);
        }}
        item={
          editingProductId && editingStagedItem
            ? buildEditableItem(editingProductId, editingStagedItem)
            : null
        }
        onSave={handleStagedSave}
      />

      {pendingPriceLevelChange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">
              Change Price Level?
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              {stagedItemCount} staged item{stagedItemCount === 1 ? "" : "s"}{" "}
              will be re-priced to{" "}
              {priceLevelsData.find(
                (level) =>
                  level?._id?.toString() ===
                  pendingPriceLevelChange?.priceLevel?.toString(),
              )?.pricelevel || "Default"}
              . Items without this price level will be set to rate 0.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={cancelPriceLevelChange}
              >
                Cancel
              </Button>
              <Button type="button" onClick={confirmPriceLevelChange}>
                Yes, Re-price
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
