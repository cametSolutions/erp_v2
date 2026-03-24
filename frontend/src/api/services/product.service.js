import api from "../client/apiClient";

function getResponseData(response) {
  return response?.data?.item || response?.data?.data || response?.data || null;
}

function normalizePriceLevels(priceLevels) {
  return Array.isArray(priceLevels) ? priceLevels : [];
}

function mapMasterItem(item, type) {
  if (!item) return null;

  if (type === "subcategory") {
    return {
      id: item?._id || item?.id || item?.subcategory_id,
      value: item?._id || item?.id || item?.subcategory_id,
      label: item?.subcategory || item?.label || "Unnamed",
      categoryId: item?.category || null,
      raw: item,
    };
  }

  if (type === "category") {
    return {
      id: item?._id || item?.id || item?.category_id,
      value: item?._id || item?.id || item?.category_id,
      label: item?.category || item?.label || "Unnamed",
      raw: item,
    };
  }

  return {
    id: item?._id || item?.id || item?.brand_id,
    value: item?._id || item?.id || item?.brand_id,
    label: item?.brand || item?.label || "Unnamed",
    raw: item,
  };
}

function mapMasterList(response, type) {
  const payload = getResponseData(response);
  const items = payload?.items || payload || [];

  if (!Array.isArray(items)) return [];
  return items.map((item) => mapMasterItem(item, type)).filter(Boolean);
}

export async function getProducts({
  page,
  limit,
  cmp_id,
  search,
  priceLevel,
  brand,
  category,
  subcategory,
  signal,
  skipGlobalLoader = false,
}) {
  const res = await api.get("/product", {
    params: {
      page,
      limit,
      cmp_id,
      search,
      priceLevel,
      brand,
      category,
      subcategory,
    },
    signal,
    skipGlobalLoader,
  });

  return res.data;
}

export async function getProductById(id, options = {}) {
  if (!id) return null;

  try {
    const response = await api.get(`/product/${id}`, {
      ...options,
      skipGlobalLoader: options?.skipGlobalLoader ?? true,
    });
    const product = getResponseData(response);

    return product || null;
  } catch (error) {
    const status = error?.response?.status;
    if (status !== 404 && status !== 400) {
      throw error;
    }
    return null;
  }
}

export async function fetchBrands(options = {}) {
  try {
    const response = await api.get("/product/brands", {
      ...options,
      params: {
        cmp_id: options?.cmp_id,
        search: options?.search,
      },
      skipGlobalLoader: options?.skipGlobalLoader ?? true,
    });
    return mapMasterList(response, "brand");
  } catch (error) {
    const status = error?.response?.status;
    if (status !== 404 && status !== 400) throw error;
    return [];
  }
}

export async function fetchCategories(options = {}) {
  try {
    const response = await api.get("/product/categories", {
      ...options,
      params: {
        cmp_id: options?.cmp_id,
        search: options?.search,
      },
      skipGlobalLoader: options?.skipGlobalLoader ?? true,
    });
    return mapMasterList(response, "category");
  } catch (error) {
    const status = error?.response?.status;
    if (status !== 404 && status !== 400) throw error;
    return [];
  }
}

export async function fetchSubcategories(options = {}) {
  try {
    const response = await api.get("/product/subcategories", {
      ...options,
      params: {
        cmp_id: options?.cmp_id,
        search: options?.search,
      },
      skipGlobalLoader: options?.skipGlobalLoader ?? true,
    });
    return mapMasterList(response, "subcategory");
  } catch (error) {
    const status = error?.response?.status;
    if (status !== 404 && status !== 400) throw error;
    return [];
  }
}

export async function fetchPriceLevels(cmp_id, options = {}) {
  if (!cmp_id) return [];

  try {
    const response = await api.get("/price-levels", {
      ...options,
      params: {
        cmp_id,
      },
      skipGlobalLoader: options?.skipGlobalLoader ?? true,
    });

    const payload = getResponseData(response);
    return Array.isArray(payload) ? payload : [];
  } catch (error) {
    const status = error?.response?.status;
    if (status !== 404 && status !== 400) throw error;
    return [];
  }
}

export async function fetchPartyLsp(partyId, productId, options = {}) {
  const resolvedPartyId =
    typeof partyId === "object" ? partyId?.partyId : partyId;
  const resolvedProductId =
    typeof partyId === "object" ? partyId?.productId : productId;
  const resolvedOptions =
    typeof partyId === "object" ? productId || {} : options;

  if (!resolvedPartyId || !resolvedProductId) return null;

  try {
    const response = await api.get("/pricing/lsp", {
      params: { partyId: resolvedPartyId, productId: resolvedProductId },
      ...resolvedOptions,
      skipGlobalLoader: resolvedOptions?.skipGlobalLoader ?? true,
    });

    const data = getResponseData(response);
    return data?.rate ?? data?.price ?? data?.lsp ?? data ?? null;
  } catch (error) {
    const status = error?.response?.status;
    if (status !== 404 && status !== 400) throw error;
    return null;
  }
}

export async function fetchGlobalLsp(productId, options = {}) {
  const resolvedProductId =
    typeof productId === "object" ? productId?.productId : productId;
  const resolvedOptions =
    typeof productId === "object" ? options || {} : options;

  if (!resolvedProductId) return null;

  try {
    const response = await api.get("/pricing/lsp/global", {
      params: { productId: resolvedProductId },
      ...resolvedOptions,
      skipGlobalLoader: resolvedOptions?.skipGlobalLoader ?? true,
    });

    const data = getResponseData(response);
    return data?.rate ?? data?.price ?? data?.lsp ?? data ?? null;
  } catch (error) {
    const status = error?.response?.status;
    if (status !== 404 && status !== 400) throw error;
    return null;
  }
}

export const productService = {
  getProducts,
  getProductById,
  fetchBrands,
  fetchCategories,
  fetchPriceLevels,
  fetchSubcategories,
  fetchPartyLsp,
  fetchGlobalLsp,
  normalizePriceLevels,
};
