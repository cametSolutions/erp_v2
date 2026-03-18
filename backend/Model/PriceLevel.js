// models/PriceLevel.js
import mongoose from "mongoose";

const { Schema } = mongoose;

/**
 * PriceLevel Schema
 *
 * - Represents a Tally Price Level for a given company & primary user.
 * - `pricelevel_id` = external Tally ID (string).
 * - `_id` = Mongo ObjectId, used internally for relations (e.g. Party refs).
 * - Unique per (pricelevel_id, Primary_user_id, cmp_id).
 * - Includes basic audit fields for Tally sync tracking.
 */

const priceLevelSchema = new Schema(
  {
    // Human-readable price level name from Tally
    pricelevel: {
      type: String,
      required: true,
      trim: true,
    },

    // Tally's unique identifier for this price level
    pricelevel_id: {
      type: String,
      required: true,
      trim: true,
    },

    // Company (Organization)
    cmp_id: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    // Primary user who owns this Tally company
    Primary_user_id: {
      type: Schema.Types.ObjectId,
      ref: "PrimaryUser",
      required: true,
      index: true,
    },

    // ---- Audit meta ----

    // Where last change came from: "tally" | "web"
    source: {
      type: String,
      enum: ["tally", "web"],
      default: "tally",
    },

    // Free-text for last updater on that source
    lastUpdatedBySource: {
      type: String,
      default: "tally-sync",
      trim: true,
    },

    // Tally user name who pushed this data
    tallyUserName: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

/**
 * Indexes
 */

// For listing/searching by user + company
priceLevelSchema.index(
  { Primary_user_id: 1, cmp_id: 1 },
  { name: "pricelevel_user_company_idx", background: true }
);

// Main lookup & uniqueness per (pricelevel_id, user, company)
priceLevelSchema.index(
  { pricelevel_id: 1, Primary_user_id: 1, cmp_id: 1 },
  {
    name: "pricelevel_lookup_idx",
    unique: true,
    background: true,
  }
);

export default mongoose.model("PriceLevel", priceLevelSchema);
