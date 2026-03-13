import mongoose from "mongoose";

const { Schema } = mongoose;

const accountGroupSchema = new Schema(
  {
    accountGroup: { type: String, required: true },
    accountGroup_id: { type: String, required: true },
    cmp_id: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    Primary_user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// **OPTIMIZED ACCOUNTGROUP INDEXES**
accountGroupSchema.index(
  { Primary_user_id: 1, cmp_id: 1 },
  { name: "accountgroup_user_company_idx", background: true }
);

accountGroupSchema.index(
  { accountGroup_id: 1, Primary_user_id: 1, cmp_id: 1 },
  { name: "accountgroup_lookup_idx", background: true }
);

// **ADDITIONAL INDEX** - For Party lookups (most common)
accountGroupSchema.index(
  { _id: 1, cmp_id: 1 },
  { name: "accountgroup_id_company_idx", background: true }
);

export default mongoose.model("AccountGroup", accountGroupSchema);