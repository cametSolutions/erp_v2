// Model/AdditionalCharges.js
import mongoose from "mongoose";

const AdditionalChargesSchema = new mongoose.Schema(
  {
    cmp_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    Primary_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PrimaryUser",
      required: true,
    },
    additional_charge_id: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    hsn: {
      type: String,
      default: null,
    },
    taxPercentage: {
      type: Number,
      default: 0,
    },
    exp_grpname: {
      type: String,
      default: null,
    },
    exp_childgrpname: {
      type: String,
      default: null,
    },
    // Audit / source tracking (consistent with other tally-synced models)
    source: {
      type: String,
      enum: ["tally", "manual"],
      default: "tally",
    },
    tallyUserName: {
      type: String,
      default: null,
    },
    lastUpdatedBySource: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

// Compound unique index — same pattern as SubGroup, PriceLevel
AdditionalChargesSchema.index(
  { additional_charge_id: 1, cmp_id: 1, Primary_user_id: 1 },
  { unique: true }
);

// Query optimization indexes
AdditionalChargesSchema.index({ cmp_id: 1, Primary_user_id: 1 });

export default mongoose.model("AdditionalCharges", AdditionalChargesSchema);