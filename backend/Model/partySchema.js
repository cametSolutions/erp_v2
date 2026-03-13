import mongoose, { set } from "mongoose";

//// this party schema is used for managing party-related information in the system
///// also for storing cash details and bank details since both are considered as parties

const partySchema = new mongoose.Schema({
  /// common fields
  Primary_user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PrimaryUser",
    required: true,
  },
  Secondary_user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SecondaryUser",
  },
  cmp_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    required: true,
  },
  // Account type and identification
  partyType: {
    type: String,
    required: true,
    default:"party",
    enum: ["party", "bank", "cash"],
    index: true,
  },
  accountGroup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AccountGroup",
    required: true,
  },
  subGroup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SubGroup",
    set: (v) => (v === "" || v === null ? null : v), // Allow subGroup to be optional
  },
  groupName: { type: String }, // bank_grpname/cash_grpname
  childGroupName: { type: String }, // bank_childgrpname/cash_childgrpname
  // Opening balance
  openingBalanceAmount: {
    type: Number,
    default: 0,
  }, // Unified opening balance field
  openingBalanceType: {
    type: String,
  },

  // All fields available for all party types (Party/Bank/Cash)
  partyName: { type: String, required: true }, // Unified name field (partyName/bank_ledname/cash_ledname)
  mobileNumber: { type: String },
  country: { type: String },
  state: { type: String },
  pin: { type: String },
  emailID: { type: String },
  gstNo: { type: String },
  pricelevel: { type: String },
  state_reference: { type: String },
  pincode: { type: String },
  party_master_id: { type: String, required: true }, // Unified ID field (party_master_id/bank_id/cash_id)
  panNo: { type: String },
  billingAddress: { type: String },
  shippingAddress: { type: String },
  creditPeriod: { type: String },
  creditLimit: { type: String },
  isHotelAgent: { type: Boolean, default: false },

  // Bank-specific fields (used when partyType = 'Bank')
  acholder_name: { type: String },
  ac_no: { type: String },
  ifsc: { type: String },
  swift_code: { type: String },
  bank_name: { type: String },
  branch: { type: String },
  upi_id: { type: String },
  bsr_code: { type: String },
  client_code: { type: String},
  isTaggedWithComplementary : { type: Boolean, default: false },
});

// / ============= CRITICAL PARTY INDEXES =============

// 1. **PRIMARY INDEX** - Most important for your PartyList query
// Covers: cmp_id + Primary_user_id + subGroup filtering + pagination
partySchema.index(
  {
    cmp_id: 1,
    Primary_user_id: 1,
    subGroup: 1,
  },
  {
    name: "party_main_query_idx",
    background: true,
  }
);

// 2. **SEARCH INDEX** - For partyName and mobileNumber search
partySchema.index(
  {
    cmp_id: 1,
    Primary_user_id: 1,
    partyName: 1,
  },
  {
    name: "party_name_search_idx",
    background: true,
  }
);

partySchema.index(
  {
    cmp_id: 1,
    Primary_user_id: 1,
    mobileNumber: 1,
  },
  {
    name: "party_mobile_search_idx",
    background: true,
    sparse: true, // Since mobileNumber can be null
  }
);

// 3. **TEXT SEARCH INDEX** - For efficient $text searches
partySchema.index(
  {
    partyName: "text",
    mobileNumber: "text",
  },
  {
    name: "party_text_search_idx",
    background: true,
    weights: { partyName: 2, mobileNumber: 1 }, // Give more weight to party name
  }
);

// 4. **LOOKUP OPTIMIZATION** - For accountGroup and subGroup lookups
partySchema.index(
  {
    cmp_id: 1,
    partyType: 1,
    accountGroup: 1,
  },
  {
    name: "party_account_group_idx",
    background: true,
  }
);

// 5. **PARTY MASTER ID INDEX** - For external system integration
partySchema.index(
  {
    cmp_id: 1,
    party_master_id: 1,
    partyType: 1,
  },
  {
    name: "party_master_id_idx",
    background: true,
    unique: true, // Assuming party_master_id should be unique per company
  }
);

// 6. **PARTY TYPE MAIN INDEX** - Most important for fetching by type
// Covers: Get all Banks, Cash, or Parties for a company/user
partySchema.index(
  {
    cmp_id: 1,
    Primary_user_id: 1,
    partyType: 1,
  },
  {
    name: "party_type_main_idx",
    background: true,
  }
);

// 7. **PARTY TYPE + SUBGROUP INDEX** - For filtered type queries
// Covers: Get Banks of specific account groups, etc.
partySchema.index(
  {
    cmp_id: 1,
    Primary_user_id: 1,
    partyType: 1,
    subGroup: 1,
  },
  {
    name: "party_type_subgroup_idx",
    background: true,
  }
);


// 8.**COMBINED PARTY FILTER INDEX** - For complex filtering
// Covers: Active parties by type with account group
partySchema.index(
  {
    cmp_id: 1,
    Primary_user_id: 1,
    partyType: 1,
    accountGroup: 1,
    subGroup: 1,
  },
  {
    name: "party_full_filter_idx",
    background: true,
  }
);


export default mongoose.model("Party", partySchema);
