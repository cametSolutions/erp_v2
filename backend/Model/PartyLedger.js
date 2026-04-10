import mongoose from "mongoose";

const { Schema, model, models } = mongoose;

const PartyLedgerSchema = new Schema(
  {
    cmp_id: { type: Schema.Types.ObjectId, ref: "Company", required: true },
    voucher_type: {
      type: String,
      enum: ["receipt", "payment"],
      required: true,
    },
    voucher_id: {
      type: Schema.Types.ObjectId,
      ref: "CashTransaction",
      required: true,
    },
    voucher_number: { type: String, required: true },
    date: { type: Date, required: true },
    party_id: { type: Schema.Types.ObjectId, ref: "Party", required: true },
    party_name: { type: String, required: true },
    amount: { type: Number, required: true },
    ledger_side: {
      type: String,
      enum: ["debit", "credit"],
      required: true,
    },
    against_id: { type: Schema.Types.ObjectId, ref: "Party", required: true },
    narration: { type: String, default: null },
    status: {
      type: String,
      enum: ["active", "cancelled"],
      default: "active",
    },
    created_by: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    strict: true,
  }
);

PartyLedgerSchema.index({ cmp_id: 1, party_id: 1, date: -1 });
PartyLedgerSchema.index({ voucher_id: 1, voucher_type: 1 });

const PartyLedger = models.PartyLedger || model("PartyLedger", PartyLedgerSchema);

export default PartyLedger;
