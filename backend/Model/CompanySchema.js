// models/CompanySchema.js
import mongoose from "mongoose";
import { customAlphabet } from "nanoid";

const nanoId = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 4);

const companySchema = new mongoose.Schema(
  {
    cmp_id: {
      type: String,
      unique: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    flat: { type: String, trim: true },
    road: { type: String, trim: true },
    place: { type: String, required: true, trim: true },
    landmark: { type: String, trim: true },
    pin: { type: String, required: true, trim: true },

    country: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    mobile: {
      type: String,
      required: true,
      trim: true,
    },

    gstNum: { type: String, trim: true },
    pan: { type: String, trim: true },

    website: { type: String, trim: true },
    logo: { type: String, trim: true },

    type: {
      type: String,
      enum: ["integrated", "standalone"],
      default: "integrated",
    },

    financialYear: { type: String, required: true, trim: true },

    currency: { type: String, required: true, trim: true },       // e.g. "INR"
    currencyName: { type: String, required: true, trim: true },   // e.g. "Indian Rupee"

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },

    isApproved: {
      type: Boolean,
      default: false,
    },

    // numbers for sequences
    orderNumber: { type: Number, default: 0 },
    salesNumber: { type: Number, default: 0 },
    purchaseNumber: { type: Number, default: 0 },
    salesOrderNumber: { type: Number, default: 0 },
    vanSalesNumber: { type: Number, default: 0 },
    stockTransferNumber: { type: Number, default: 0 },
    receiptNumber: { type: Number, default: 0 },
    creditNoteNumber: { type: Number, default: 0 },
    debitNoteNumber: { type: Number, default: 0 },
    paymentNumber: { type: Number, default: 0 },

    batchEnabled: { type: Boolean, default: false },
    gdnEnabled: { type: Boolean, default: false },

    industry: { type: Number, default: 0 },

    // arrays you will fill later
    brands: [{ type: String }],
    categories: [{ type: String }],
    subcategories: [{ type: String }],
    levelNames: [{ type: String }],
    locations: [{ type: String }],
    configurations: [{ type: mongoose.Schema.Types.Mixed }],
    additionalCharges: [{ type: mongoose.Schema.Types.Mixed }],
  },
  { timestamps: true }
);

// index for frequent queries: owner + name
companySchema.index(
  { owner: 1, name: 1 },
  { name: "owner_name_idx" }
);

// auto-generate company_id like "COMPAB12"
companySchema.pre("save", function () {
  if (!this.company_id) {
    this.company_id = `COMP${nanoId()}`;
  }
});

const Company = mongoose.model("Company", companySchema);
export default Company;
