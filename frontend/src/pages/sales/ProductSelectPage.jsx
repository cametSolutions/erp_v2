import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Barcode,
  ChevronDown,
  Package,
  Pencil,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { useLocation, useNavigate } from "react-router-dom";

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
const PRODUCT_FILTERS_STORAGE_KEY = "sale-order-product-filters";

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

function getStoredProductFilters(cmp_id) {
  if (!cmp_id) return null;
  try {
    const raw = localStorage.getItem(`${PRODUCT_FILTERS_STORAGE_KEY}-${cmp_id}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      search: parsed?.search || "",
      priceLevel: parsed?.priceLevel || "",
      brandId: parsed?.brandId || "",
      categoryId: parsed?.categoryId || "",
      subcategoryId: parsed?.subcategoryId || "",
    };
  } catch {
    return null;
  }
}

function persistProductFilters(cmp_id, filters) {
  if (!cmp_id) return;
  try {
    localStorage.setItem(
      `${PRODUCT_FILTERS_STORAGE_KEY}-${cmp_id}`,
      JSON.stringify(filters),
    );
  } catch {}
}

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

function getProductTaxRate(productDetail) {
  if (productDetail?.taxRate != null) return Number(productDetail.taxRate) || 0;
  if (productDetail?.igst != null) return Number(productDetail.igst) || 0;
  return (Number(productDetail?.cgst) || 0) + (Number(productDetail?.sgst) || 0);
}

function buildProductDetail(product) {
  const { rate: _ignored, ...detail } = product || {};
  return {
    ...detail,
    _id: getProductId(detail),
    product_name: detail?.product_name || detail?.name || "Untitled Product",
    hsn: detail?.hsn || detail?.hsn_code || "",
    unit: detail?.unit || "",
    cgst: Number(detail?.cgst) || 0,
    sgst: Number(detail?.sgst) || 0,
    igst: Number(detail?.igst) || 0,
    cess: Number(detail?.cess) || 0,
    addl_cess: Number(detail?.addl_cess ?? detail?.addlCess) || 0,
    taxRate:
      detail?.taxRate != null ? Number(detail.taxRate) || 0 : getProductTaxRate(detail),
    priceLevels: Array.isArray(detail?.priceLevels) ? detail.priceLevels : [],
  };
}

function getPriceLevelRate(productDetail, priceLevelId) {
  if (!priceLevelId || !Array.isArray(productDetail?.priceLevels)) return null;
  const match = productDetail.priceLevels.find(
    (l) => l?.priceLevel?.toString() === priceLevelId?.toString(),
  );
  return match?.priceRate ?? null;
}

function buildCalcItemFromStaged(stagedItem) {
  if (!stagedItem) return null;
  return {
    rate: Number(stagedItem.rate) || 0,
    billedQty:
      Number(stagedItem.billedQty != null ? stagedItem.billedQty : stagedItem.quantity) || 0,
    taxRate: Number(stagedItem.productDetail?.taxRate ?? stagedItem.taxRate ?? 0) || 0,
    cgst: Number(stagedItem.productDetail?.cgst ?? stagedItem?.cgst ?? 0) || 0,
    sgst: Number(stagedItem.productDetail?.sgst ?? stagedItem?.sgst ?? 0) || 0,
    igst: Number(stagedItem.productDetail?.igst ?? stagedItem?.igst ?? 0) || 0,
    cess: Number(stagedItem.productDetail?.cess ?? stagedItem?.cess ?? 0) || 0,
    addl_cess:
      Number(
        stagedItem.productDetail?.addl_cess ??
          stagedItem.productDetail?.addlCess ??
          stagedItem?.addl_cess ??
          stagedItem?.addlCess ??
          0,
      ) || 0,
    taxType: stagedItem?.taxType || "igst",
    taxInclusive: Boolean(stagedItem.taxInclusive),
    discountType: stagedItem.discountType || "percentage",
    discountPercentage: Number(stagedItem.discountPercentage) || 0,
    discountAmount: Number(stagedItem.discountAmount) || 0,
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
    cgst: item?.cgst,
    sgst: item?.sgst,
    igst: item?.igst,
    cess: item?.cess,
    addl_cess: item?.addl_cess ?? item?.addlCess,
    priceLevels: item?.priceLevels,
  });
  return {
    quantity: billedQty,
    originalQuantity: billedQty,
    productDetail: detail,
    rate: Number(item?.rate) || 0,
    taxType: item?.taxType || "igst",
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
    cgst: Number(detail?.cgst) || 0,
    sgst: Number(detail?.sgst) || 0,
    igst: Number(detail?.igst) || 0,
    cess: Number(detail?.cess) || 0,
    addl_cess: Number(detail?.addl_cess ?? detail?.addlCess) || 0,
    priceLevels: Array.isArray(detail?.priceLevels) ? detail.priceLevels : [],
    rate: Number(stagedItem?.rate) || 0,
    taxType: stagedItem?.taxType || "igst",
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

async function fetchPartyLsp(partyId, productId) {
  return productService.fetchPartyLsp(partyId, productId, { skipGlobalLoader: true });
}

async function fetchGlobalLsp(productId) {
  return productService.fetchGlobalLsp(productId, { skipGlobalLoader: true });
}

async function resolveInitialRate({ partyId, productId, productDetail, priceLevel }) {
  if (priceLevel) {
    const levelRate = getPriceLevelRate(productDetail, priceLevel);
    return { source: "priceLevel", rate: levelRate != null ? Number(levelRate) || 0 : 0 };
  }
  const partyLsp = await fetchPartyLsp(partyId, productId);
  if (partyLsp != null && Number(partyLsp) > 0)
    return { source: "lsp", rate: Number(partyLsp) || 0 };
  const globalLsp = await fetchGlobalLsp(productId);
  if (globalLsp != null && Number(globalLsp) > 0)
    return { source: "gsp", rate: Number(globalLsp) || 0 };
  return { source: "manual", rate: 0 };
}

// ---------------------------------------------------------------------------
// FilterDropdown
// ---------------------------------------------------------------------------

function FilterDropdown({ label, value, onChange, options, placeholder, disabled = false }) {
  return (
    <div className="space-y-2">
      <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 pr-10 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        >
          <option value="">{placeholder}</option>
          {options.map((option) => {
            const v = getMasterOptionId(option);
            return (
              <option key={v} value={v}>
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

// ---------------------------------------------------------------------------
// FilterSheet
// ---------------------------------------------------------------------------

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
  const [draftPriceLevel, setDraftPriceLevel] = useState(appliedPriceLevel || "");
  const [draftBrandId, setDraftBrandId] = useState(appliedBrandId || "");
  const [draftCategoryId, setDraftCategoryId] = useState(appliedCategoryId || "");
  const [draftSubcategoryId, setDraftSubcategoryId] = useState(appliedSubcategoryId || "");

  // Reset drafts to the current applied values every time the sheet opens.
  useEffect(() => {
    if (!open) return;
    setDraftPriceLevel(appliedPriceLevel || "");
    setDraftBrandId(appliedBrandId || "");
    setDraftCategoryId(appliedCategoryId || "");
    setDraftSubcategoryId(appliedSubcategoryId || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const visibleSubcategories = useMemo(() => {
    if (!draftCategoryId) return [];
    return subcategories.filter(
      (s) => getSubcategoryCategoryId(s) === draftCategoryId,
    );
  }, [draftCategoryId, subcategories]);

  const effectiveDraftSubcategoryId = visibleSubcategories.some(
    (s) => getMasterOptionId(s)?.toString() === draftSubcategoryId?.toString(),
  )
    ? draftSubcategoryId
    : "";

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
              <p className="text-sm font-semibold text-slate-900">Filter products</p>
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
                  onChange={(e) => setDraftPriceLevel(e.target.value)}
                  className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 pr-10 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Default (no price level)</option>
                  {priceLevels.map((pl) => (
                    <option key={pl?._id} value={pl?._id}>
                      {pl?.pricelevel || "Unnamed"}
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
              onChange={(v) => { setDraftCategoryId(v); setDraftSubcategoryId(""); }}
              options={categories}
              placeholder="All categories"
            />
            <FilterDropdown
              label="Subcategory"
              value={effectiveDraftSubcategoryId}
              onChange={setDraftSubcategoryId}
              options={visibleSubcategories}
              placeholder={draftCategoryId ? "All subcategories" : "Select category first"}
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
                subcategoryId: effectiveDraftSubcategoryId || "",
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

// ---------------------------------------------------------------------------
// ProductRow
// ---------------------------------------------------------------------------

function ProductRow({ product, stagedItem, loading, priceLevel, onAdd, onEdit, onIncrement, onDecrement }) {
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
    product?.sub_category?.subcategory || product?.subcategoryName || product?.subcategory,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="border-b border-slate-200 bg-white py-3">
      <div className="flex items-stretch gap-3">
        <div className="flex w-16 shrink-0 items-center justify-center rounded-sm bg-indigo-50 px-3">
          <Package className="h-5 w-5 text-indigo-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-900">
            {product?.product_name || "Untitled Product"}
          </p>
          {subtitle && (
            <p className="mt-0.5 truncate text-xs text-slate-500">{subtitle}</p>
          )}

          <div className="mt-2 flex items-center gap-1.5">
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded border border-rose-200 bg-rose-50 text-sm text-rose-500 hover:bg-rose-100 hover:border-rose-300 disabled:opacity-40"
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
              className="flex h-7 w-7 items-center justify-center rounded border border-emerald-200 bg-emerald-50 text-sm text-emerald-600 hover:bg-emerald-100 hover:border-emerald-300 disabled:opacity-40"
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
                <p className="text-[11px] text-slate-600">Total: ₹{totalAmount.toFixed(2)}</p>
              )}
              <p className="text-[11px] text-slate-500">
                {quantity > 0 ? stagedItem?.initialPriceSource || "manual" : "Tap + to add"}
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

// ---------------------------------------------------------------------------
// ProductSelectPage
// ---------------------------------------------------------------------------

export default function ProductSelectPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { setHeaderOptions, resetHeaderOptions } = useMobileHeader();
  const loadMoreRef = useRef(null);
  const didSeedRef = useRef(false);

  const reduxPriceLevel = useSelector((state) => state.transaction.priceLevel);
  const taxType = useSelector((state) => state.transaction.taxType);
  const transactionItems = useSelector((state) => state.transaction.items);
  const party = useSelector((state) => state.transaction.party);
  const cmp_id = useSelector((state) => state.company.selectedCompanyId) || "";

  const storedFilters = useMemo(() => getStoredProductFilters(cmp_id), [cmp_id]);

  const [search, setSearch] = useState(() => storedFilters?.search || "");
  const [appliedPriceLevel, setAppliedPriceLevel] = useState(
    () => reduxPriceLevel || storedFilters?.priceLevel || "",
  );
  const [brandId, setBrandId] = useState(() => storedFilters?.brandId || "");
  const [categoryId, setCategoryId] = useState(() => storedFilters?.categoryId || "");
  const [subcategoryId, setSubcategoryId] = useState(() => storedFilters?.subcategoryId || "");
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [stagedItems, setStagedItems] = useState({});
  const [loadingProductIds, setLoadingProductIds] = useState({});
  const [editingProductId, setEditingProductId] = useState(null);
  const [pendingPriceLevelChange, setPendingPriceLevelChange] = useState(null);

  // ─── THE KEY REF ────────────────────────────────────────────────────────────
  // Tracks the price level last explicitly committed by the user via applyFilters.
  // NEVER auto-synced to state/Redux on every render — written ONLY inside
  // applyFilters. This eliminates all timing ambiguity: when handleFilterApply
  // reads it synchronously, it always reflects the last confirmed commit.
  const committedPriceLevelRef = useRef(
    reduxPriceLevel || storedFilters?.priceLevel || "",
  );

  // Kept in sync every render so async callbacks always see fresh staged items.
  const stagedItemsRef = useRef(stagedItems);
  stagedItemsRef.current = stagedItems;

  const debouncedSearch = useDebouncedValue(search.trim(), 500);
  const returnTo = location.state?.returnTo || ROUTES.createOrder;

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  const { data, error, isError, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useInfiniteProductListQuery({
      cmp_id,
      limit: PAGE_SIZE,
      search: debouncedSearch,
      brand: brandId,
      category: categoryId,
      subcategory: subcategoryId,
    });

  const { data: brandsData = [] } = useBrandsQuery({ cmp_id });
  const { data: priceLevelsData = [] } = usePriceLevelsQuery({ cmp_id });
  const { data: categoriesData = [] } = useCategoriesQuery({ cmp_id });
  const { data: subcategoriesData = [] } = useSubcategoriesQuery({ cmp_id });

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!cmp_id) return;
    const nextFilters = getStoredProductFilters(cmp_id);
    if (!nextFilters) return;
    const pl = reduxPriceLevel || nextFilters.priceLevel || "";
    setSearch(nextFilters.search || "");
    setAppliedPriceLevel(pl);
    committedPriceLevelRef.current = pl; // keep the committed ref in sync on company change
    setBrandId(nextFilters.brandId || "");
    setCategoryId(nextFilters.categoryId || "");
    setSubcategoryId(nextFilters.subcategoryId || "");
  }, [cmp_id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    persistProductFilters(cmp_id, {
      search,
      priceLevel: appliedPriceLevel,
      brandId,
      categoryId,
      subcategoryId,
    });
  }, [appliedPriceLevel, brandId, categoryId, cmp_id, search, subcategoryId]);

  useEffect(() => {
    if (didSeedRef.current) return;
    if (!Array.isArray(transactionItems) || transactionItems.length === 0) return;
    const seeded = transactionItems.reduce((acc, item) => {
      if (!item?.id) return acc;
      acc[item.id] = createStagedItemFromTransactionItem(item);
      return acc;
    }, {});
    setStagedItems(seeded);
    didSeedRef.current = true;
  }, [transactionItems]);

  useEffect(() => {
    if (!isError) return;
    toast.error(
      error?.response?.data?.message || error?.message || "Failed to load products",
    );
  }, [error, isError]);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: "180px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, data]);

  const filterSignature = useMemo(
    () =>
      [cmp_id, debouncedSearch, appliedPriceLevel, brandId, categoryId, subcategoryId].join("|"),
    [appliedPriceLevel, brandId, categoryId, cmp_id, debouncedSearch, subcategoryId],
  );

  const [products, setProducts] = useState([]);
  useEffect(() => { setProducts([]); }, [filterSignature]);
  useEffect(() => {
    setProducts(data?.pages?.flatMap((page) => page?.items || []) || []);
  }, [data, filterSignature]);

  // ---------------------------------------------------------------------------
  // applyFilters — THE ONLY PLACE committedPriceLevelRef IS WRITTEN
  // ---------------------------------------------------------------------------

  const applyFilters = useCallback(
    ({ priceLevel, brandId: nb, categoryId: nc, subcategoryId: ns }) => {
      const pl = priceLevel || "";

      // Write ref BEFORE state updates so any synchronous reader after this
      // call sees the new value immediately.
      committedPriceLevelRef.current = pl;

      setAppliedPriceLevel(pl);
      setBrandId(nb || "");
      setCategoryId(nc || "");
      setSubcategoryId(ns || "");

      const matchedPriceLevel = priceLevelsData.find(
        (level) => (level?._id || level?.id)?.toString() === pl,
      );
      dispatch(setPriceLevel(pl || null));
      dispatch(setPriceLevelObject(matchedPriceLevel ?? null));
    },
    [dispatch, priceLevelsData],
  );

  // ---------------------------------------------------------------------------
  // handleFilterApply — passed as onApply to FilterSheet
  //
  // Reads committedPriceLevelRef and stagedItemsRef synchronously at call time.
  // No closures over stale state, no useEffect timing gaps.
  // ---------------------------------------------------------------------------

  const handleFilterApply = useCallback(
    (candidate) => {
      // Read the ref directly — this always reflects the last committed value
      // because applyFilters writes it before any async/state work.
      const committed = committedPriceLevelRef.current;

      const hasPriceLevelChanged =
        (candidate.priceLevel || "") !== (committed || "");

      const hasStagedItems = Object.values(stagedItemsRef.current).some(
        (item) => (Number(item?.quantity) || 0) > 0,
      );

      if (hasPriceLevelChanged && hasStagedItems) {
        setPendingPriceLevelChange(candidate);
      } else {
        applyFilters(candidate);
      }
    },
    [applyFilters],
  );

  // ---------------------------------------------------------------------------
  // Confirm / cancel price level change
  // ---------------------------------------------------------------------------

  const confirmPriceLevelChange = useCallback(async () => {
    if (!pendingPriceLevelChange) return;
    const { priceLevel } = pendingPriceLevelChange;

    try {
      const repricedEntries = await Promise.all(
        Object.entries(stagedItemsRef.current).map(async ([productId, staged]) => {
          const productDetail = await ensureProductDetail(staged?.productDetail, staged);
          const nextRate = getPriceLevelRate(productDetail, priceLevel);
          return [
            productId,
            {
              ...staged,
              productDetail,
              rate: nextRate != null ? Number(nextRate) || 0 : 0,
              initialPriceSource: "priceLevel",
            },
          ];
        }),
      );
      setStagedItems(Object.fromEntries(repricedEntries));
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to re-price items");
      return;
    }

    applyFilters(pendingPriceLevelChange);
    setPendingPriceLevelChange(null);
  }, [applyFilters, pendingPriceLevelChange]);

  const cancelPriceLevelChange = useCallback(() => {
    setPendingPriceLevelChange(null);
  }, []);

  // ---------------------------------------------------------------------------
  // Product detail helpers
  // ---------------------------------------------------------------------------

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
    const fetched = await getProductById(productId, { skipGlobalLoader: true });
    return buildProductDetail({
      ...(product || {}),
      ...(existingDetail || {}),
      ...(fetched || {}),
    });
  };

  const setLoading = (productId, val) => {
    setLoadingProductIds((cur) => {
      const next = { ...cur };
      if (val) next[productId] = true;
      else delete next[productId];
      return next;
    });
  };

  // ---------------------------------------------------------------------------
  // Add / increment / decrement
  // ---------------------------------------------------------------------------

  const handleAddOrIncrement = async (product) => {
    const productId = getProductId(product);
    if (!productId) return;

    const existingItem = stagedItemsRef.current[productId];
    if (existingItem) {
      const nextQty = (Number(existingItem?.quantity) || 0) + 1;
      setStagedItems((cur) => ({
        ...cur,
        [productId]: {
          ...cur[productId],
          quantity: nextQty,
          billedQty: nextQty,
          actualQty: nextQty,
        },
      }));
      return;
    }

    setLoading(productId, true);
    try {
      const productDetail = await ensureProductDetail(product, null);
      const { rate, source } = await resolveInitialRate({
        partyId: party?._id || party?.id || null,
        productId,
        productDetail,
        priceLevel: committedPriceLevelRef.current || "",
      });
      setStagedItems((cur) => ({
        ...cur,
        [productId]: {
          quantity: 1,
          originalQuantity: 0,
          productDetail,
          rate,
          taxType: taxType || "igst",
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
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to add product");
    } finally {
      setLoading(productId, false);
    }
  };

  const handleDecrement = (product) => {
    const productId = getProductId(product);
    if (!productId || !stagedItemsRef.current[productId]) return;
    setStagedItems((cur) => {
      const existing = cur[productId];
      const nextQty = (Number(existing?.quantity) || 0) - 1;
      if (nextQty <= 0) {
        if ((Number(existing?.originalQuantity) || 0) > 0) {
          return {
            ...cur,
            [productId]: {
              ...existing,
              quantity: 0,
              billedQty: 0,
              actualQty: 0,
            },
          };
        }
        const next = { ...cur };
        delete next[productId];
        return next;
      }
      return {
        ...cur,
        [productId]: { ...existing, quantity: nextQty, billedQty: nextQty, actualQty: nextQty },
      };
    });
  };

  // ---------------------------------------------------------------------------
  // Edit sheet
  // ---------------------------------------------------------------------------

  const openEditSheet = async (product) => {
    const productId = getProductId(product);
    const stagedItem = stagedItemsRef.current[productId];
    if (!productId || !stagedItem) return;
    try {
      const productDetail = await ensureProductDetail(product, stagedItem);
      setStagedItems((cur) => ({
        ...cur,
        [productId]: { ...cur[productId], productDetail },
      }));
      setEditingProductId(productId);
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to load item details");
    }
  };

  const handleStagedSave = (changes) => {
    if (!editingProductId) return;
    setStagedItems((cur) => {
      const existing = cur[editingProductId];
      if (!existing) return cur;
      const nextBilledQty = Number(changes?.billedQty) || 0;
      const nextActualQty = Number(changes?.actualQty) || nextBilledQty;
      return {
        ...cur,
        [editingProductId]: {
          ...existing,
          ...changes,
          quantity: nextBilledQty,
          billedQty: nextBilledQty,
          actualQty: nextActualQty,
          rate: Number(changes?.rate) || 0,
          discountType: changes?.discountType || existing?.discountType || "percentage",
          discountPercentage: Number(changes?.discountPercentage) || 0,
          discountAmount: Number(changes?.discountAmount) || 0,
        },
      };
    });
  };

  const handleStagedRemove = useCallback((item) => {
    const productId = item?.id || editingProductId;
    if (!productId) return;

    setStagedItems((cur) => {
      const existing = cur[productId];
      if (!existing) return cur;

      if ((Number(existing?.originalQuantity) || 0) > 0) {
        return {
          ...cur,
          [productId]: {
            ...existing,
            quantity: 0,
            billedQty: 0,
            actualQty: 0,
          },
        };
      }

      const next = { ...cur };
      delete next[productId];
      return next;
    });
  }, [editingProductId]);

  // ---------------------------------------------------------------------------
  // Continue / Done
  // ---------------------------------------------------------------------------

  const handleContinue = useCallback(() => {
    const payload = [];

    Object.entries(stagedItemsRef.current).forEach(([productId, staged]) => {
      const detail = buildProductDetail(staged?.productDetail);
      const quantity = Number(staged?.quantity) || 0;
      const originalQuantity = Number(staged?.originalQuantity) || 0;
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
        const nextActualQty =
          quantity > 0
            ? Number(staged?.actualQty ?? quantity) || quantity
            : 0;

        dispatch(
          updateItem({
            id: productId,
            changes: {
              ...baseChanges,
              actualQty: nextActualQty,
              billedQty: quantity,
            },
          }),
        );

        return;
      }

      if (quantity <= 0) {
        return;
      }

      payload.push({
        id: productId,
        name: detail?.product_name || "Untitled Product",
        hsn: detail?.hsn || "",
        unit: detail?.unit || "",
        taxRate: getProductTaxRate(detail),
        priceLevels: Array.isArray(detail?.priceLevels) ? detail.priceLevels : [],
        priceLevel: committedPriceLevelRef.current || null,
        rate: Number(staged?.rate) || 0,
        cgst: Number(detail?.cgst) || 0,
        sgst: Number(detail?.sgst) || 0,
        igst: Number(detail?.igst) || 0,
        cess: Number(detail?.cess) || 0,
        addl_cess: Number(detail?.addl_cess ?? detail?.addlCess) || 0,
        taxType: staged?.taxType || taxType || "igst",
        initialPriceSource: staged?.initialPriceSource || "manual",
        actualQty: quantity,
        billedQty: quantity,
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

    if (payload.length > 0) dispatch(addItemsFromSelection(payload));
    navigate(returnTo);
  }, [dispatch, navigate, returnTo, taxType]);

  // ---------------------------------------------------------------------------
  // Mobile header
  // ---------------------------------------------------------------------------

  const openFilterSheet = useCallback(() => setIsFilterSheetOpen(true), []);

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
  }, [handleContinue, openFilterSheet, resetHeaderOptions, search, setHeaderOptions]);

  // ---------------------------------------------------------------------------
  // Derived
  // ---------------------------------------------------------------------------

  const editingStagedItem = editingProductId ? stagedItems[editingProductId] || null : null;

  const stagedItemCount = useMemo(
    () =>
      Object.values(stagedItems).filter((item) => (Number(item?.quantity) || 0) > 0).length,
    [stagedItems],
  );

  const filterCount = useMemo(
    () => [appliedPriceLevel, brandId, categoryId, subcategoryId].filter(Boolean).length,
    [appliedPriceLevel, brandId, categoryId, subcategoryId],
  );

  // ---------------------------------------------------------------------------
  // Early return
  // ---------------------------------------------------------------------------

  if (!cmp_id) {
    return (
      <div className="flex h-full items-center justify-center px-4">
        <div className="w-full max-w-md rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
          Select a company first to choose items.
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <>
      <div className="flex h-full min-h-0 overflow-hidden flex-col bg-slate-50">
        <header className="hidden shrink-0 border-b border-slate-200 bg-white px-4 py-3 md:block">
          <div className="mx-auto flex max-w-5xl flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-sm font-semibold text-slate-900">Select Items</h1>
                <p className="truncate text-[11px] text-slate-500">
                  {party?.partyName || "No party selected"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" size="sm" onClick={handleContinue}>
                  <span className="hidden sm:inline">Continue</span>
                  <span className="sm:hidden">Done</span>
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={openFilterSheet}>
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span>Filters{filterCount > 0 ? ` (${filterCount})` : ""}</span>
                </Button>
                <Button type="button" variant="outline" size="sm">
                  <Barcode className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Scan</span>
                </Button>
              </div>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products by name or code"
                className="min-h-11 pl-9 text-sm"
              />
            </div>
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-5xl min-h-0 flex-1 flex-col overflow-hidden py-1 sm:py-4">
          <div className="min-h-0 flex-1 overflow-hidden rounded-sm border border-slate-200 bg-white">
            <ScrollArea key={filterSignature} className="h-full">
              <div className="space-y-3 p-3 sm:p-4">
                {isLoading && (
                  <div className="space-y-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-28 animate-pulse rounded-xl border border-slate-200 bg-slate-50"
                      />
                    ))}
                  </div>
                )}

                {!isLoading && products.length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                    {debouncedSearch ? "No matching products found" : "No products found"}
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

                {hasNextPage && <div ref={loadMoreRef} className="h-4 w-full" />}

                {isFetchingNextPage && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm text-slate-600">
                    Loading more products...
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* No key prop — FilterSheet resets its draft state via useEffect on open */}
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
        subcategories={Array.isArray(subcategoriesData) ? subcategoriesData : []}
        onApply={handleFilterApply}
      />

      <ItemEditSheet
        open={Boolean(editingStagedItem)}
        onOpenChange={(open) => { if (!open) setEditingProductId(null); }}
        item={
          editingProductId && editingStagedItem
            ? buildEditableItem(editingProductId, editingStagedItem)
            : null
        }
        onSave={handleStagedSave}
        onRemove={handleStagedRemove}
      />

      {pendingPriceLevelChange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">Change Price Level?</h2>
            <p className="mt-2 text-sm text-slate-600">
              {stagedItemCount} staged item{stagedItemCount === 1 ? "" : "s"} will be re-priced
              to{" "}
              {priceLevelsData.find(
                (l) =>
                  (l?._id || l?.id)?.toString() ===
                  pendingPriceLevelChange?.priceLevel?.toString(),
              )?.pricelevel || "Default"}
              . Items without this price level will be set to rate 0.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <Button type="button" variant="outline" onClick={cancelPriceLevelChange}>
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
