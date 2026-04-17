import dotenv from "dotenv";

import connectDB from "../config.js/db.js";
import Receipt from "../Model/Receipt.js";
import SaleOrder from "../Model/SaleOrder.js";
import VoucherTimeline from "../Model/VoucherTimeline.js";

dotenv.config();

async function backfillSaleOrders() {
  const saleOrders = await SaleOrder.find(
    {},
    {
      cmp_id: 1,
      voucher_type: 1,
      date: 1,
      party_id: 1,
      party_snapshot: 1,
      voucher_number: 1,
      totals: 1,
      status: 1,
      created_at: 1,
      updated_at: 1,
    }
  ).lean();

  const operations = saleOrders.map((doc) => ({
    updateOne: {
      filter: {
        voucher_id: doc._id,
        voucher_type: doc.voucher_type,
      },
      update: {
        $set: {
          cmp_id: doc.cmp_id,
          voucher_type: doc.voucher_type,
          voucher_id: doc._id,
          date: doc.date,
          party_id: doc.party_id,
          party_name: doc.party_snapshot?.name || "",
          voucher_number: doc.voucher_number,
          amount: Number(doc.totals?.final_amount) || 0,
          status: doc.status || null,
          created_at: doc.created_at || new Date(),
          updated_at: doc.updated_at || new Date(),
        },
      },
      upsert: true,
    },
  }));

  if (operations.length) {
    await VoucherTimeline.bulkWrite(operations, { ordered: false });
  }

  return operations.length;
}

async function backfillReceipts() {
  const receipts = await Receipt.find(
    {},
    {
      cmp_id: 1,
      voucher_type: 1,
      date: 1,
      party_id: 1,
      party_name: 1,
      voucher_number: 1,
      amount: 1,
      status: 1,
      created_at: 1,
      updated_at: 1,
    }
  ).lean();

  const operations = receipts.map((doc) => ({
    updateOne: {
      filter: {
        voucher_id: doc._id,
        voucher_type: doc.voucher_type,
      },
      update: {
        $set: {
          cmp_id: doc.cmp_id,
          voucher_type: doc.voucher_type,
          voucher_id: doc._id,
          date: doc.date,
          party_id: doc.party_id,
          party_name: doc.party_name || "",
          voucher_number: doc.voucher_number,
          amount: Number(doc.amount) || 0,
          status: doc.status || null,
          created_at: doc.created_at || new Date(),
          updated_at: doc.updated_at || new Date(),
        },
      },
      upsert: true,
    },
  }));

  if (operations.length) {
    await VoucherTimeline.bulkWrite(operations, { ordered: false });
  }

  return operations.length;
}

async function run() {
  await connectDB();

  const [saleOrderCount, receiptCount] = await Promise.all([
    backfillSaleOrders(),
    backfillReceipts(),
  ]);

  console.log(
    `Voucher timeline backfill complete. saleOrders=${saleOrderCount}, receipts=${receiptCount}`
  );
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Voucher timeline backfill failed", error);
    process.exit(1);
  });
