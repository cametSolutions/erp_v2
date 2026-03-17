import api from "../client/apiClient";

export const productService = {
  getProducts: async ({
    page,
    limit,
    cmp_id,
    search,
    signal,
    skipGlobalLoader = false,
  }) => {
    const res = await api.get("/product", {
      params: { page, limit, cmp_id, search },
      signal,
      skipGlobalLoader,
    });

    return res.data;
  },
};
