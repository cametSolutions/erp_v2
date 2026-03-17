// models/AccountGroup.js
import mongoose from "mongoose";

const { Schema } = mongoose;

/**
 * AccountGroup Schema
 *
 * - Represents a Tally Account Group for a given company & primary user.
 * - `accountGroup_id` = external Tally ID (string).
 * - `_id` = Mongo ObjectId, used internally for relations (e.g. Party refs).
 * - `source` / `lastUpdatedBySource` / `tallyUserName` let you see
 *   that the latest change came from Tally, and under which Tally user.
 * - Compound unique index on (accountGroup_id, Primary_user_id, cmp_id)
 *   ensures there is only ONE row per (Tally group, user, company).
 */

const accountGroupSchema = new Schema(
  {
    // Human-readable group name (from Tally)
    accountGroup: {
      type: String,
      required: true,
      trim: true,
    },

    // Tally's unique identifier for this group
    accountGroup_id: {
      type: String,
      required: true,
      trim: true,
    },

    // Company (Organization) this group belongs to
    cmp_id: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    // Primary user who owns/uses this Tally company
    Primary_user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ---- Audit meta for Tally/web ----

    // Where last change came from: "tally" | "web"
    source: {
      type: String,
      enum: ["tally", "web"],
      default: "tally",
    },

    // Free-text or code for last updater on that source.
    // For Tally we’ll store the Tally user name, or "tally-sync".
    lastUpdatedBySource: {
      type: String,
      default: "tally-sync",
      trim: true,
    },

    // The Tally user name (from the JSON payload).
    // Same for all docs in one push (we read it from first item).
    tallyUserName: {
      type: String,
      trim: true,
    },

    // (Optional later)
    // createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    // updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

/**
 * Indexes
 */

// For listing/searching groups by user + company
accountGroupSchema.index(
  { Primary_user_id: 1, cmp_id: 1 },
  { name: "accountgroup_user_company_idx", background: true }
);

// Main lookup index for sync & uniqueness per (Tally group, user, company)
accountGroupSchema.index(
  { accountGroup_id: 1, Primary_user_id: 1, cmp_id: 1 },
  {
    name: "accountgroup_lookup_idx",
    unique: true, // prevents duplicate Tally groups for same user+company
    background: true,
  }
);

export default mongoose.model("AccountGroup", accountGroupSchema);
