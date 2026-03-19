import mongoose from "mongoose";

import Product from "../Model/ProductSchema.js";
import { Brand, Category, Subcategory } from "../Model/ProductSubDetails.js";

const PRODUCT_POPULATE = [
  { path: "brand", select: "brand brand_id" },
  { path: "category", select: "category category_id" },
  { path: "sub_category", select: "subcategory subcategory_id" },
  { path: "priceLevels.priceLevel", select: "pricelevel pricelevel_id" },
];

function toObjectId(value) {
  if (!value || !mongoose.Types.ObjectId.isValid(value)) return null;
  return new mongoose.Types.ObjectId(value);
}

function mapProductPriceLevels(product) {
  const rawPriceLevels = Array.isArray(product?.priceLevels)
    ? product.priceLevels
    : [];

  const priceLevels = rawPriceLevels.reduce((accumulator, level) => {
    const levelName =
      level?.priceLevel?.pricelevel ||
      level?.pricelevel ||
      level?.levelName ||
      level?.name ||
      null;
    const rate = level?.priceRate ?? level?.pricerate ?? level?.rate ?? null;

    if (levelName && rate != null) {
      accumulator[levelName.toLowerCase()] = rate;
    }

    return accumulator;
  }, {});

  return {
    ...product,
    priceLevels,
  };
}

async function listProductMasters(Model, fieldName, req, res) {
  try {
    const owner = req.user.id;
    const { cmp_id, search = "" } = req.query;

    if (!cmp_id) {
      return res.status(400).json({ message: "cmp_id (company) is required" });
    }

    const filter = {
      Primary_user_id: owner,
      cmp_id,
    };

    const trimmedSearch = String(search || "").trim();
    if (trimmedSearch) {
      const safeSearch = trimmedSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter[fieldName] = new RegExp(safeSearch, "i");
    }

    const items = await Model.find(filter)
      .select(`${fieldName} ${fieldName}_id cmp_id category`)
      .sort({ [fieldName]: 1 })
      .lean();

    return res.json({ items });
  } catch (error) {
    console.error(`list ${fieldName} error:`, error);
    return res.status(500).json({ message: `Failed to fetch ${fieldName}` });
  }
}

export const listProducts = async (req, res) => {
  try {
    const owner = req.user.id;
    const {
      cmp_id,
      page = 1,
      limit = 20,
      search = "",
      brand = "",
      category = "",
      subcategory = "",
    } = req.query;

    if (!cmp_id) {
      return res.status(400).json({ message: "cmp_id (company) is required" });
    }

    const pageNum = Number.parseInt(page, 10) || 1;
    const limitNum = Number.parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const filter = {
      Primary_user_id: owner,
      cmp_id,
    };

    const brandId = toObjectId(brand);
    const categoryId = toObjectId(category);
    const subcategoryId = toObjectId(subcategory);

    if (brand && brandId) {
      filter.brand = brandId;
    }

    if (category && categoryId) {
      filter.category = categoryId;
    }

    if (subcategory && subcategoryId) {
      filter.sub_category = subcategoryId;
    }

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
        .populate(PRODUCT_POPULATE)
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(filter),
    ]);

    const hasMore = skip + items.length < total;

    return res.json({
      items: items.map(mapProductPriceLevels),
      total,
      page: pageNum,
      hasMore,
    });
  } catch (error) {
    console.error("listProducts error:", error);
    return res.status(500).json({ message: "Failed to fetch products" });
  }
};

export const getProductById = async (req, res) => {
  try {
    const owner = req.user.id;
    const { id } = req.params;

    const product = await Product.findOne({
      _id: id,
      Primary_user_id: owner,
    })
      .populate(PRODUCT_POPULATE)
      .lean();

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.json(mapProductPriceLevels(product));
  } catch (error) {
    console.error("getProductById error:", error);
    return res.status(500).json({ message: "Failed to fetch product" });
  }
};

export const listBrands = async (req, res) =>
  listProductMasters(Brand, "brand", req, res);

export const listCategories = async (req, res) =>
  listProductMasters(Category, "category", req, res);

export const listSubcategories = async (req, res) =>
  listProductMasters(Subcategory, "subcategory", req, res);
