// models/SubGroup.js
import mongoose from "mongoose";

const { Schema } = mongoose;

/**
 * SubGroup Schema
 *
 * - Represents a Tally Sub Group under an Account Group.
 * - `subGroup_id` = external Tally ID.
 * - `accountGroup` = Mongo _id reference to AccountGroup.
 * - Unique per (subGroup_id, Primary_user_id, cmp_id).
 * - Includes basic audit fields for Tally.
 */

const subGroupSchema = new Schema(
  {
    // Reference to parent AccountGroup (_id)
    accountGroup: {
      type: Schema.Types.ObjectId,
      ref: "AccountGroup",
      required: true,
    },

    // Human-readable subgroup name from Tally
    subGroup: {
      type: String,
      required: true,
      trim: true,
    },

    // Tally's unique identifier for this subgroup
    subGroup_id: {
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
      ref: "User",
      required: true,
      index: true,
    },

    // ---- Audit meta for Tally/web ----

    source: {
      type: String,
      enum: ["tally", "web"],
      default: "tally",
    },

    lastUpdatedBySource: {
      type: String,
      default: "tally-sync",
      trim: true,
    },

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
subGroupSchema.index(
  { Primary_user_id: 1, cmp_id: 1 },
  { name: "subgroup_user_company_idx", background: true }
);

// Main lookup & uniqueness per (subGroup_id, user, company)
subGroupSchema.index(
  { subGroup_id: 1, Primary_user_id: 1, cmp_id: 1 },
  {
    name: "subgroup_lookup_idx",
    unique: true,
    background: true,
  }
);

// Relationship index: find all subgroups under an account group in a company
subGroupSchema.index(
  { accountGroup: 1, cmp_id: 1 },
  { name: "subgroup_accountgroup_idx", background: true }
);

export default mongoose.model("SubGroup", subGroupSchema);
