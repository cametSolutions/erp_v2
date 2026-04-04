import mongoose, { Schema } from "mongoose";

const CompanySettingsSchema = new mongoose.Schema(
  {
    Primary_user_id: {
      type: Schema.Types.ObjectId,
      ref: "PrimaryUser",
      required: true,
    },
    cmp_id: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    dataEntry: {
      voucher: {
        defaultBankAccountId: {
          type: Schema.Types.ObjectId,
          ref: "Party",
          default: null,
        },
      },
      order: {
        termsAndConditions: {
          type: [String],
          default: [],
        },
      },
    },
  },
  {
    timestamps: true,
  }
);

CompanySettingsSchema.index(
  { Primary_user_id: 1, cmp_id: 1 },
  { unique: true, name: "company_settings_user_company_unique_idx" }
);

export default mongoose.models.CompanySettings ||
  mongoose.model("CompanySettings", CompanySettingsSchema);
