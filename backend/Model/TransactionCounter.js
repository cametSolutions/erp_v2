import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const TransactionCounterSchema = new Schema(
  {
    cmp_id: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    transaction_type: {
      type: String,
      required: true,
      trim: true,
    },
    scope: {
      type: String,
      enum: ["company", "user"],
      required: true,
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    sequence_value: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  },
);

TransactionCounterSchema.index(
  { cmp_id: 1, transaction_type: 1, scope: 1, user_id: 1 },
  { unique: true },
);

const TransactionCounter =
  models.TransactionCounter ||
  model("TransactionCounter", TransactionCounterSchema);

export default TransactionCounter;
