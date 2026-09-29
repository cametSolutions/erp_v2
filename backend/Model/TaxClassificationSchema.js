import mongoose from "mongoose";

// Exported so future clients use the same names as the backend.
export const TAXABILITY_TYPES = ["Taxable", "Exempt", "Nil Rated", "Non-GST"];
export const CALCULATION_MODES = ["on_value", "on_item_rate"];

const finiteNumber = (value) => typeof value === "number" && Number.isFinite(value);

// The same tax fields are used by an On Value classification and every slab.
const taxFieldsSchema = new mongoose.Schema(
  {
    taxability_type: {
      type: String,
      required: true,
      enum: TAXABILITY_TYPES,
    },
    igst_rate: { type: Number, required: true, min: 0, max: 100 },
    cgst_rate: { type: Number, required: true, min: 0, max: 100 },
    sgst_utgst_rate: { type: Number, required: true, min: 0, max: 100 },
    cess_based_on_value: { type: Number, required: true, min: 0 },
    cess_based_on_quantity: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const rateSlabSchema = taxFieldsSchema.clone();
rateSlabSchema.add({
  greater_than: { type: Number, required: true },
  upto: { type: Number, required: true },
});

const taxClassificationSchema = new mongoose.Schema(
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
    hsn_code: { type: String, required: true, trim: true, uppercase: true },
    description: { type: String, required: true, trim: true },
    calculation_mode: { type: String, required: true, enum: CALCULATION_MODES },
    on_value: { type: taxFieldsSchema, default: undefined },
    rate_slabs: { type: [rateSlabSchema], default: [] },
    applicable_for_revised_charge: { type: Boolean, default: false },
  },
  { timestamps: true }
);

function validateTaxFields(taxFields) {
  if (!taxFields) return false;

  return [
    taxFields.igst_rate,
    taxFields.cgst_rate,
    taxFields.sgst_utgst_rate,
    taxFields.cess_based_on_value,
    taxFields.cess_based_on_quantity,
  ].every(finiteNumber);
}

taxClassificationSchema.pre("validate", function validateConfiguration() {
  if (this.calculation_mode === "on_value") {
    if (!this.on_value) {
      this.invalidate("on_value", "on_value is required for On Value classifications");
    } else if (!validateTaxFields(this.on_value)) {
      this.invalidate("on_value", "Tax values must be finite numbers");
    }

    if (this.rate_slabs.length > 0) {
      this.invalidate("rate_slabs", "rate_slabs must be empty for On Value classifications");
    }
  }

  if (this.calculation_mode === "on_item_rate") {
    if (this.on_value) {
      this.invalidate("on_value", "on_value must be absent for On Item Rate classifications");
    }

    if (this.rate_slabs.length === 0) {
      this.invalidate("rate_slabs", "At least one rate slab is required");
    }

    this.rate_slabs.forEach((slab, index) => {
      if (!finiteNumber(slab.greater_than) || !finiteNumber(slab.upto)) {
        this.invalidate(`rate_slabs.${index}`, "Slab limits must be finite numbers");
      } else if (slab.upto <= slab.greater_than) {
        this.invalidate(`rate_slabs.${index}.upto`, "Up To must be greater than Greater Than");
      }

      if (!validateTaxFields(slab)) {
        this.invalidate(`rate_slabs.${index}`, "Tax values must be finite numbers");
      }
    });

    for (let firstIndex = 0; firstIndex < this.rate_slabs.length; firstIndex += 1) {
      for (let secondIndex = firstIndex + 1; secondIndex < this.rate_slabs.length; secondIndex += 1) {
        const first = this.rate_slabs[firstIndex];
        const second = this.rate_slabs[secondIndex];

        // Ranges are (greater_than, upto], so equal endpoints are adjacent, not overlapping.
        if (first.greater_than < second.upto && second.greater_than < first.upto) {
          this.invalidate("rate_slabs", "Rate slab ranges cannot overlap");
        }
      }
    }
  }

});

taxClassificationSchema.index(
  { hsn_code: 1, cmp_id: 1, Primary_user_id: 1 },
  { unique: true, name: "tax_classification_hsn_company_owner_unique" }
);
taxClassificationSchema.index({ cmp_id: 1, Primary_user_id: 1 });

export default mongoose.model("TaxClassification", taxClassificationSchema);
