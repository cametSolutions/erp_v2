import Product from "../Model/ProductSchema.js";

export const listProducts = async (req, res) => {
  try {
    const owner = req.user.id;
    const { cmp_id, page = 1, limit = 20, search = "" } = req.query;

    if (!cmp_id) {
      return res.status(400).json({ message: "cmp_id (company) is required" });
    }

    const pageNum = Number.parseInt(page, 10) || 1;
    const limitNum = Number.parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const filter = {
      // Primary_user_id: owner,
      cmp_id,
    };

    const trimmedSearch = String(search || "").trim();
    if (trimmedSearch) {
      const safeSearch = trimmedSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const searchRegex = new RegExp(safeSearch, "i");

      filter.$or = [
        { product_name: searchRegex },
        { product_code: searchRegex },
        { hsn_code: searchRegex },
        { unit: searchRegex },
      ];
    }

    const [items, total] = await Promise.all([
      Product.find(filter)
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limitNum),
      Product.countDocuments(filter),
    ]);

    const hasMore = skip + items.length < total;

    return res.json({
      items,
      total,
      page: pageNum,
      hasMore,
    });
  } catch (error) {
    console.error("listProducts error:", error);
    return res.status(500).json({ message: "Failed to fetch products" });
  }
};
