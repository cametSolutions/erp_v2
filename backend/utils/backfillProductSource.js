import "dotenv/config";
import mongoose from "mongoose";

import Product from "../Model/ProductSchema.js";

// Safe first migration: classify only records with a positive Tally contract.
// Unclassified records remain protected from manual edit/delete until reviewed.
async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const result = await Product.updateMany(
    {
      product_source: { $exists: false },
      product_master_id: { $type: "string", $ne: "" },
    },
    { $set: { product_source: "tally" } },
  );
  console.log(`Classified ${result.modifiedCount} Tally products. Legacy products were left unchanged.`);
  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exitCode = 1;
});
