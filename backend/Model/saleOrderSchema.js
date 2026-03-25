import mongoose from "mongoose";
const { Schema } = mongoose;

const saleOrderSchema = new Schema(
  {
    transactionDate: { type: String },
    voucherType: { type: String, default: "saleOrder" },
    voucherNumber: { type: Number },

    serialNumber: { type: Number },
    userLevelSerialNumber: { type: Number },

    series_id: {
      type: Schema.Types.ObjectId,
      ref: "VoucherSeries",
      required: true,
    },

    usedSeriesNumber: { type: Number, required: true },

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

    Secondary_user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    // Party Details
    party: {
      _id: { type: Schema.Types.ObjectId, ref: "Party" },
      partyName: String,
      accountGroupName: String,

      accountGroup_id: {
        type: Schema.Types.ObjectId,
        ref: "AccountGroup",
        required: true,
      },

      subGroupName: String,
      subGroup_id: { type: Schema.Types.ObjectId, ref: "SubGroup" },

      mobileNumber: String,
      country: String,
      state: String,
      pin: String,
      emailID: String,
      gstNo: String,
      party_master_id: String,
      billingAddress: String,
      shippingAddress: String,
      accountGroup: String,
      totalOutstanding: Number,
      latestBillDate: { type: Date, default: null },
      newAddress: { type: Object },
    },

    // Price Level
    selectedPriceLevel: {
      _id: { type: Schema.Types.ObjectId, ref: "PriceLevel" },
      name: String,
    },

    // Items
    items: [
      {
        _id: { type: Schema.Types.ObjectId, ref: "Product" },
        product_name: String,
        cmp_id: { type: Schema.Types.ObjectId, ref: "Company" },
        product_code: String,
        balance_stock: Number,

        Primary_user_id: { type: Schema.Types.ObjectId, ref: "User" },
        brand: { type: Schema.Types.ObjectId, ref: "Brand" },
        category: { type: Schema.Types.ObjectId, ref: "Category" },
        sub_category: { type: Schema.Types.ObjectId, ref: "SubCategory" },

        unit: String,
        purchase_price: Number,
        purchase_cost: Number,
        item_mrp: Number,

        GodownList: [
          {
            godownMongoDbId: { type: Schema.Types.ObjectId, ref: "Godown" },
            godown: String,
            balance_stock: Number,
            godown_id: String,
            defaultGodown: Boolean,
            batch: String,

            mfgdt: {
              type: Date,
              default: null,
              set: () => null,
            },

            expdt: {
              type: Date,
              default: null,
              set: () => null,
            },

            description: String,
            selectedPriceRate: Number,
            added: Boolean,
            count: Number,
            actualCount: Number,
            basePrice: Number,

            discountAmount: Number,
            discountPercentage: Number,
            discountType: String,

            taxableAmount: Number,

            cgstValue: Number,
            sgstValue: Number,
            igstValue: Number,
            cessValue: Number,
            addlCessValue: Number,

            cgstAmt: Number,
            sgstAmt: Number,
            igstAmt: Number,
            cessAmt: Number,
            addlCessAmt: Number,

            individualTotal: Number,

            isTaxInclusive: Boolean,

            igstAmount: Number,
            cgstAmount: Number,
            sgstAmount: Number,
            cessAmount: Number,
            additionalCessAmount: Number,
            totalCessAmount: Number,
          },
        ],

        hsn_code: String,
        cgst: Number,
        sgst: Number,
        igst: Number,
        product_master_id: String,

        batchEnabled: Boolean,
        gdnEnabled: Boolean,

        Priceleveles: [
          {
            _id: { type: Schema.Types.ObjectId, ref: "PriceLevel" },
            pricelevel: String,
            pricerate: Number,
            priceDisc: Number,
            applicabledt: String,
          },
        ],

        addl_cess: Number,
        cess: Number,

        hasGodownOrBatch: Boolean,
        isTaxInclusive: Boolean,
        isExpanded: Boolean,

        totalCount: Number,
        totalActualCount: Number,
        total: Number,

        totalCgstAmt: Number,
        totalSgstAmt: Number,
        totalIgstAmt: Number,
        totalCessAmt: Number,
        totalAddlCessAmt: Number,

        added: Boolean,
        taxInclusive: Boolean,
      },
    ],

    // Despatch Details
    despatchDetails: {
      type: Object,
      set: function (value) {
        return { title: "Despatch Details", ...value };
      },
      default: {
        title: "Despatch Details",
        challanNo: "",
        containerNo: "",
        despatchThrough: "",
        destination: "",
        vehicleNo: "",
        orderNo: "",
        termsOfPay: "",
        termsOfDelivery: "",
      },
    },

    // Additional Charges
    additionalCharges: [
      {
        _id: { type: Schema.Types.ObjectId, ref: "AdditionalCharge" },
        option: String,
        value: String,
        action: String,
        taxPercentage: Number,
        taxAmt: Number,
        hsn: String,
        finalValue: Number,
      },
    ],

    subTotal: { type: Number, required: true },
    totalAdditionalCharge: { type: Number, required: true },
    finalAmount: { type: Number, required: true },
  },
  {
    timestamps: true,
  }
);


// ✅ INDEXES

// Unique voucher number per company + series
saleOrderSchema.index(
  { cmp_id: 1, series_id: 1, voucherNumber: 1 },
  { unique: true, name: "unique_voucher_per_series" }
);

// Sorting by transaction date
saleOrderSchema.index({ cmp_id: 1, transactionDate: -1 });

// Party queries
saleOrderSchema.index({ cmp_id: 1, "party._id": 1 });

// User workflows
saleOrderSchema.index({ cmp_id: 1, Secondary_user_id: 1 });

// Serial access
saleOrderSchema.index({ cmp_id: 1, serialNumber: -1 });

// User-level sequence
saleOrderSchema.index({
  cmp_id: 1,
  Secondary_user_id: 1,
  userLevelSerialNumber: -1,
});

// Series validation
saleOrderSchema.index(
  {
    cmp_id: 1,
    series_id: 1,
    usedSeriesNumber: 1,
  },
  {
    name: "series_number_validation_idx",
    background: true,
  }
);

export default mongoose.model("SaleOrder", saleOrderSchema);