import mongoose from "mongoose";

import Product from "../Model/ProductSchema.js";
import { Brand, Category, Godown, Subcategory } from "../Model/ProductSubDetails.js";
import PriceLevel from "../Model/PriceLevel.js";
import TaxClassification from "../Model/TaxClassificationSchema.js";

export class ManualProductInputError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const isObject = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function requiredText(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ManualProductInputError(`${field} is required`);
  }
  return value.trim();
}

function optionalText(value, field) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") throw new ManualProductInputError(`${field} must be text`);
  return value.trim() || null;
}

function finiteNumber(value, field, required = false) {
  if (value === undefined || value === null || value === "") {
    if (required) throw new ManualProductInputError(`${field} is required`);
    return undefined;
  }
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new ManualProductInputError(`${field} must be a finite number`);
  }
  return value;
}

function booleanValue(value, field, defaultValue = false) {
  if (value === undefined) return defaultValue;
  if (typeof value !== "boolean") throw new ManualProductInputError(`${field} must be true or false`);
  return value;
}

async function resolveScopedReference(Model, value, label, scope) {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new ManualProductInputError(`Invalid ${label}`);
  }
  const document = await Model.findOne({ _id: value, ...scope }).select("_id category").lean();
  if (!document) throw new ManualProductInputError(`Selected ${label} was not found`, 404);
  return document;
}

export async function prepareManualProductPayload(payload, scope, existingProduct = null) {
  if (!isObject(payload)) throw new ManualProductInputError("Product payload is required");

  const product_name = requiredText(payload.product_name, "product_name");
  const base_unit = requiredText(payload.base_unit, "base_unit");
  const product_code = optionalText(payload.product_code, "product_code");
  const alt_unit = optionalText(payload.alt_unit, "alt_unit");
  const batchEnabled = booleanValue(payload.batchEnabled, "batchEnabled");
  const gdnEnabled = booleanValue(payload.gdnEnabled, "gdnEnabled");

  const duplicateFilter = {
    // Product names and codes are company masters, so shared-company users
    // must not be able to create conflicting active products.
    cmp_id: scope.cmp_id,
    is_deleted: { $ne: true },
    product_name: new RegExp(`^${escapeRegex(product_name)}$`, "i"),
  };
  if (existingProduct) duplicateFilter._id = { $ne: existingProduct._id };
  if (await Product.exists(duplicateFilter)) {
    throw new ManualProductInputError("A product with this name already exists", 409);
  }
  if (product_code) {
    const codeFilter = { cmp_id: scope.cmp_id, is_deleted: { $ne: true }, product_code: new RegExp(`^${escapeRegex(product_code)}$`, "i") };
    if (existingProduct) codeFilter._id = { $ne: existingProduct._id };
    if (await Product.exists(codeFilter)) {
      throw new ManualProductInputError("A product with this code already exists", 409);
    }
  }

  const [brand, category, subCategory] = await Promise.all([
    payload.brand ? resolveScopedReference(Brand, payload.brand, "brand", scope) : null,
    payload.category ? resolveScopedReference(Category, payload.category, "category", scope) : null,
    payload.sub_category ? resolveScopedReference(Subcategory, payload.sub_category, "subcategory", scope) : null,
  ]);
  if (subCategory && category && String(subCategory.category) !== String(category._id)) {
    throw new ManualProductInputError("Selected subcategory does not belong to the selected category");
  }

  const hsn_code = requiredText(payload.hsn_code, "hsn_code").toUpperCase();
  const isSameHsn = existingProduct && existingProduct.hsn_code === hsn_code;
  const taxClassification = isSameHsn ? null : await TaxClassification.findOne({ ...scope, hsn_code }).lean();
  if (!isSameHsn && !taxClassification) throw new ManualProductInputError("Selected HSN/SAC classification was not found", 404);
  if (!isSameHsn && (taxClassification.calculation_mode !== "on_value" || !taxClassification.on_value)) {
    throw new ManualProductInputError("Only On Value HSN/SAC classifications can be used for products");
  }

  const base_denominator = finiteNumber(payload.base_denominator, "base_denominator");
  const alt_conversion = finiteNumber(payload.alt_conversion, "alt_conversion");
  if (alt_unit && (!(base_denominator > 0) || !(alt_conversion > 0))) {
    throw new ManualProductInputError("base_denominator and alt_conversion must be greater than 0 when alt_unit is present");
  }
  if (!alt_unit && (base_denominator !== undefined || alt_conversion !== undefined)) {
    throw new ManualProductInputError("base_denominator and alt_conversion must be absent when alt_unit is not present");
  }

  const rawPriceLevels = payload.priceLevels ?? [];
  if (!Array.isArray(rawPriceLevels)) throw new ManualProductInputError("priceLevels must be an array");
  const priceLevelIds = new Set();
  const priceLevels = [];
  for (const [index, row] of rawPriceLevels.entries()) {
    if (!isObject(row)) throw new ManualProductInputError(`priceLevels.${index} must be an object`);
    const priceLevel = await resolveScopedReference(PriceLevel, row.priceLevel, "price level", scope);
    const priceLevelId = String(priceLevel._id);
    if (priceLevelIds.has(priceLevelId)) throw new ManualProductInputError("A price level can only be selected once");
    priceLevelIds.add(priceLevelId);
    priceLevels.push({
      priceLevel: priceLevel._id,
      priceRate: finiteNumber(row.priceRate, `priceLevels.${index}.priceRate`, true),
      priceDisc: finiteNumber(row.priceDisc, `priceLevels.${index}.priceDisc`) ?? 0,
      applicabledt: optionalText(row.applicabledt, `priceLevels.${index}.applicabledt`) ?? undefined,
    });
  }

  const rawGodowns = payload.GodownList ?? [];
  if (!Array.isArray(rawGodowns)) throw new ManualProductInputError("GodownList must be an array");
  const godownPairs = new Set();
  const GodownList = [];
  for (const [index, row] of rawGodowns.entries()) {
    if (!isObject(row)) throw new ManualProductInputError(`GodownList.${index} must be an object`);
    const godown = await resolveScopedReference(Godown, row.godown, "godown", scope);
    const batch = optionalText(row.batch, `GodownList.${index}.batch`) ?? "";
    if (batchEnabled && !batch) throw new ManualProductInputError(`GodownList.${index}.batch is required when batches are enabled`);
    const pair = `${godown._id}::${batch}`;
    if (godownPairs.has(pair)) throw new ManualProductInputError("Godown and batch combinations must be unique");
    godownPairs.add(pair);
    const matchingExistingRow = existingProduct?.GodownList?.find((existingRow) =>
      String(existingRow._id) === String(row._id) ||
      (String(existingRow.godown) === String(godown._id) && String(existingRow.batch || "") === batch),
    );
    GodownList.push({
      ...(matchingExistingRow ? { _id: matchingExistingRow._id } : {}),
      godown: godown._id,
      batch,
      balance_stock: finiteNumber(row.balance_stock, `GodownList.${index}.balance_stock`, true),
      is_placeholder: false,
    });
  }

  if (GodownList.length === 0) {
    const defaultGodown = await Godown.findOne({ ...scope, defaultGodown: true }).select("_id").lean();
    if (!defaultGodown) throw new ManualProductInputError("A default godown is required to create a selectable zero-stock product", 400);
    GodownList.push({ godown: defaultGodown._id, batch: batchEnabled ? "Primary Batch" : "", balance_stock: 0, is_placeholder: true });
  }

  return {
    ...scope,
    product_name,
    product_code: product_code ?? undefined,
    base_unit,
    alt_unit,
    base_denominator: alt_unit ? base_denominator : null,
    alt_conversion: alt_unit ? alt_conversion : null,
    hsn_code,
    // Tax is an HSN snapshot. Client tax and cess fields are deliberately ignored.
    igst: isSameHsn ? existingProduct.igst : taxClassification.on_value.igst_rate,
    cgst: isSameHsn ? existingProduct.cgst : taxClassification.on_value.cgst_rate,
    sgst: isSameHsn ? existingProduct.sgst : taxClassification.on_value.sgst_utgst_rate,
    brand: brand?._id,
    category: category?._id,
    sub_category: subCategory?._id,
    purchase_price: finiteNumber(payload.purchase_price, "purchase_price"),
    purchase_cost: finiteNumber(payload.purchase_cost, "purchase_cost"),
    item_mrp: finiteNumber(payload.item_mrp, "item_mrp"),
    saleable_stock: finiteNumber(payload.saleable_stock, "saleable_stock") ?? 0,
    GodownList,
    batchEnabled,
    gdnEnabled,
    priceLevels,
    ...(existingProduct ? {} : { product_source: "manual" }),
  };
}
