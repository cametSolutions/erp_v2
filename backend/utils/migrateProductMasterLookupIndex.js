import mongoose from "mongoose";

import Product from "../Model/ProductSchema.js";
import connectDB from "../config.js/db.js";

/**
 * Replaces the legacy unique index so multiple manual products without a Tally
 * product_master_id can coexist, while Tally IDs remain unique per company.
 * Run once during deployment before serving manual Product creation traffic.
 */
async function migrateProductMasterLookupIndex() {
  await connectDB();
  const collection = Product.collection;
  const indexName = "product_master_lookup_idx";
  const temporaryIndexName = "product_master_lookup_idx_partial_guard";
  const partialFilterExpression = { product_master_id: { $type: "string" } };
  const indexes = await collection.indexes();
  const existing = indexes.find((index) => index.name === indexName);

  if (JSON.stringify(existing?.partialFilterExpression) === JSON.stringify(partialFilterExpression)) {
    await mongoose.disconnect();
    return;
  }

  // Keep Tally-ID uniqueness protected while replacing the legacy index.
  await collection.createIndex(
    { cmp_id: 1, Primary_user_id: 1, product_master_id: 1 },
    {
      unique: true,
      background: true,
      name: temporaryIndexName,
      partialFilterExpression,
    },
  );

  if (existing) await collection.dropIndex(indexName);

  await collection.createIndex(
    { cmp_id: 1, Primary_user_id: 1, product_master_id: 1 },
    {
      unique: true,
      background: true,
      name: indexName,
      partialFilterExpression,
    },
  );

  await collection.dropIndex(temporaryIndexName);

  await mongoose.disconnect();
}

migrateProductMasterLookupIndex().catch((error) => {
  console.error("Product master index migration failed:", error);
  process.exitCode = 1;
});
