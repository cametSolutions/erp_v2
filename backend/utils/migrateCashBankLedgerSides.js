import "dotenv/config";
import mongoose from "mongoose";

import CashBankLedger from "../Model/CashBankLedger.js";

// Sale and Receipt are the only verified CashBankLedger writers today and both
// represent money entering the account. This is dry-run by default and
// idempotent: rows that already have direction are not selected.
async function main() {
  const apply = process.argv.includes("--apply");
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!uri) throw new Error("MONGO_URI or MONGODB_URI is required");
  await mongoose.connect(uri);

  const filter = {
    voucher_type: { $in: ["sale", "receipt"] },
    direction: { $exists: false },
  };
  const report = await CashBankLedger.aggregate([
    { $match: filter },
    {
      $group: {
        _id: { voucher_type: "$voucher_type", status: "$status" },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.voucher_type": 1, "_id.status": 1 } },
  ]);
  const count = report.reduce((total, row) => total + row.count, 0);

  console.table(report.map((row) => ({
    voucherType: row._id.voucher_type,
    status: row._id.status,
    count: row.count,
  })));
  console.log(`${apply ? "Applying" : "Dry run:"} ${count} CashBankLedger row(s).`);

  if (apply && count > 0) {
    const result = await CashBankLedger.updateMany(filter, {
      $set: { direction: "in" },
      $unset: { ledger_side: "" },
    });
    console.log(`Changed ${result.modifiedCount} row(s).`);
  }

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exitCode = 1;
});
