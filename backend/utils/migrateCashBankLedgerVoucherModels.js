import "dotenv/config";
import mongoose from "mongoose";
import { pathToFileURL } from "node:url";

import connectDB from "../config.js/db.js";
import CashBankLedger from "../Model/CashBankLedger.js";
import { CASH_BANK_VOUCHER_MODEL_BY_TYPE } from "./cashBankVoucherModel.js";

const MISSING_VOUCHER_MODEL_FILTER = {
  $or: [
    { voucher_model: { $exists: false } },
    { voucher_model: null },
    { voucher_model: "" },
  ],
};

export async function inspectLegacyCashTransactionCollection() {
  const database = mongoose.connection.db;
  const collections = await database
    .listCollections({ name: "cashtransactions" }, { nameOnly: true })
    .toArray();

  if (collections.length === 0) {
    return { exists: false, documentCount: 0 };
  }

  return {
    exists: true,
    documentCount: await database.collection("cashtransactions").countDocuments(),
  };
}

// Dry-run is the default. Apply mode updates only missing model fields with a
// known voucher_type and never inserts, deletes, or changes accounting values.
export async function migrateCashBankLedgerVoucherModels({
  dryRun = true,
} = {}) {
  const collection = CashBankLedger.collection;
  const groupedRows = await collection
    .aggregate([
      { $match: MISSING_VOUCHER_MODEL_FILTER },
      { $group: { _id: "$voucher_type", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ])
    .toArray();

  const knownCounts = {};
  const unknownVoucherTypes = [];

  for (const row of groupedRows) {
    const voucherType = row._id == null ? null : String(row._id);
    if (voucherType && CASH_BANK_VOUCHER_MODEL_BY_TYPE[voucherType]) {
      knownCounts[voucherType] = Number(row.count) || 0;
    } else {
      unknownVoucherTypes.push({
        voucher_type: voucherType,
        count: Number(row.count) || 0,
      });
    }
  }

  const mappedRowsRequiringMigration = Object.values(knownCounts).reduce(
    (total, count) => total + count,
    0,
  );
  const unknownRows = unknownVoucherTypes.reduce(
    (total, row) => total + row.count,
    0,
  );
  let modifiedRows = 0;

  if (!dryRun) {
    for (const [voucherType, voucherModel] of Object.entries(
      CASH_BANK_VOUCHER_MODEL_BY_TYPE,
    )) {
      const result = await collection.updateMany(
        {
          ...MISSING_VOUCHER_MODEL_FILTER,
          voucher_type: voucherType,
        },
        { $set: { voucher_model: voucherModel } },
      );
      modifiedRows += result.modifiedCount;
    }
  }

  return {
    mode: dryRun ? "dry-run" : "apply",
    totalRowsWithoutVoucherModel:
      mappedRowsRequiringMigration + unknownRows,
    mappedRowsRequiringMigration,
    knownVoucherTypes: knownCounts,
    unknownRows,
    unknownVoucherTypes,
    modifiedRows,
    legacyCashTransactions: await inspectLegacyCashTransactionCollection(),
  };
}

async function main() {
  const dryRun = !process.argv.includes("--apply");
  await connectDB();
  const summary = await migrateCashBankLedgerVoucherModels({ dryRun });
  console.log(JSON.stringify(summary, null, 2));
  await mongoose.disconnect();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(async (error) => {
    console.error("CashBankLedger voucher-model migration failed", error);
    await mongoose.disconnect();
    process.exitCode = 1;
  });
}
