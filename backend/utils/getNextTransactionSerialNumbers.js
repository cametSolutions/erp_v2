import mongoose from "mongoose";

import TransactionCounter from "../Model/TransactionCounter.js";

function toObjectId(value) {
  if (!value) return null;
  return value instanceof mongoose.Types.ObjectId
    ? value
    : new mongoose.Types.ObjectId(value);
}

async function incrementCounter({
  cmpId,
  transactionType,
  scope,
  userId = null,
  session,
}) {
  const counter = await TransactionCounter.findOneAndUpdate(
    {
      cmp_id: toObjectId(cmpId),
      transaction_type: transactionType,
      scope,
      user_id: userId ? toObjectId(userId) : null,
    },
    {
      $inc: { sequence_value: 1 },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
      session,
    },
  );

  return counter?.sequence_value || 1;
}

export async function getNextTransactionSerialNumbers({
  cmpId,
  transactionType,
  userId,
  session,
}) {
  if (!cmpId) {
    throw new Error("Company id is required for transaction serial tracking");
  }

  if (!transactionType) {
    throw new Error("Transaction type is required for transaction serial tracking");
  }

  if (!userId) {
    throw new Error("User id is required for user-level transaction serial tracking");
  }

  const [companyLevelSerialNumber, userLevelSerialNumber] = await Promise.all([
    incrementCounter({
      cmpId,
      transactionType,
      scope: "company",
      session,
    }),
    incrementCounter({
      cmpId,
      transactionType,
      scope: "user",
      userId,
      session,
    }),
  ]);

  return {
    companyLevelSerialNumber,
    userLevelSerialNumber,
  };
}

export default getNextTransactionSerialNumbers;
