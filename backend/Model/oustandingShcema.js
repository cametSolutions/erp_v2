import mongoose from "mongoose";

const { Schema, model } = mongoose;

const outstandingSchema = new Schema(
  {
    Primary_user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    cmp_id: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    accountGroup: {
      type: Schema.Types.ObjectId,
      ref: "AccountGroup",
      required: true,
    },
    subGroup: {
      type: Schema.Types.ObjectId,
      ref: "SubGroup",
      required: true,
    },
    party_name: {
      type: String,
      required: true,
      trim: true,
    },
    alias: {
      type: String,
      trim: true,
    },
    party_id: {
      type: Schema.Types.ObjectId,
      ref: "Party",
      required: true,
    },
    mobile_no: {
      type: Number,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    bill_date: {
      type: Date,
      required: true,
    },
    bill_no: {
      type: String,
      required: true,
      trim: true,
    },
    billId: {
      type: String,
      trim: true,
    },
    bill_amount: {
      type: Number,
      required: true,
      default: 0,
    },
    bill_due_date: {
      type: Date,
    },
    bill_pending_amt: {
      type: Number,
      default: 0,
    },
    classification: {
      type: String,
      enum: ["dr", "cr"],
      default: "dr",
    },
    createdBy: {
      type: String,
      default: "",
    },
    isCancelled: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // handles createdAt & updatedAt automatically
  }
);

const Outstanding = model("Outstanding", outstandingSchema);

export default Outstanding;