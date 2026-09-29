import { CALCULATION_MODES, TAXABILITY_TYPES } from "../Model/TaxClassificationSchema.js";

const TAX_FIELD_NAMES = [
  "taxability_type",
  "igst_rate",
  "cgst_rate",
  "sgst_utgst_rate",
  "cess_based_on_value",
  "cess_based_on_quantity",
];

const GST_RATE_NAMES = ["igst_rate", "cgst_rate", "sgst_utgst_rate"];
const CESS_RATE_NAMES = ["cess_based_on_value", "cess_based_on_quantity"];

export class TaxClassificationInputError extends Error {}

function hasField(value, fieldName) {
  return Object.prototype.hasOwnProperty.call(value, fieldName);
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function requireFiniteNumber(value, fieldName) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TaxClassificationInputError(`${fieldName} must be a finite number`);
  }

  return value;
}

function validateTaxFields(value, fieldPrefix) {
  if (!isPlainObject(value)) {
    throw new TaxClassificationInputError(`${fieldPrefix} is required`);
  }

  const taxFields = {};

  for (const fieldName of TAX_FIELD_NAMES) {
    if (!hasField(value, fieldName)) {
      throw new TaxClassificationInputError(`${fieldPrefix}.${fieldName} is required`);
    }

    taxFields[fieldName] = value[fieldName];
  }

  if (!TAXABILITY_TYPES.includes(taxFields.taxability_type)) {
    throw new TaxClassificationInputError(
      `${fieldPrefix}.taxability_type must be one of: ${TAXABILITY_TYPES.join(", ")}`
    );
  }

  for (const fieldName of GST_RATE_NAMES) {
    const rate = requireFiniteNumber(taxFields[fieldName], `${fieldPrefix}.${fieldName}`);
    if (rate < 0 || rate > 100) {
      throw new TaxClassificationInputError(`${fieldPrefix}.${fieldName} must be between 0 and 100`);
    }
  }

  for (const fieldName of CESS_RATE_NAMES) {
    const rate = requireFiniteNumber(taxFields[fieldName], `${fieldPrefix}.${fieldName}`);
    if (rate < 0) {
      throw new TaxClassificationInputError(`${fieldPrefix}.${fieldName} cannot be negative`);
    }
  }

  return taxFields;
}

function validateSlabs(rateSlabs) {
  if (!Array.isArray(rateSlabs) || rateSlabs.length === 0) {
    throw new TaxClassificationInputError("At least one rate slab is required for On Item Rate classifications");
  }

  const slabs = rateSlabs.map((slab, index) => {
    if (!isPlainObject(slab)) {
      throw new TaxClassificationInputError(`rate_slabs.${index} must be an object`);
    }

    const greaterThan = requireFiniteNumber(slab.greater_than, `rate_slabs.${index}.greater_than`);
    const upto = requireFiniteNumber(slab.upto, `rate_slabs.${index}.upto`);

    if (upto <= greaterThan) {
      throw new TaxClassificationInputError(`rate_slabs.${index}.upto must be greater than greater_than`);
    }

    return {
      greater_than: greaterThan,
      upto,
      ...validateTaxFields(slab, `rate_slabs.${index}`),
    };
  });

  for (let firstIndex = 0; firstIndex < slabs.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < slabs.length; secondIndex += 1) {
      const first = slabs[firstIndex];
      const second = slabs[secondIndex];

      // A range is (greater_than, upto], so matching endpoints are allowed.
      if (first.greater_than < second.upto && second.greater_than < first.upto) {
        throw new TaxClassificationInputError("Rate slab ranges cannot overlap");
      }
    }
  }

  return slabs;
}

function readRequiredText(payload, existing, fieldName) {
  const value = hasField(payload, fieldName) ? payload[fieldName] : existing?.[fieldName];
  if (typeof value !== "string" || value.trim() === "") {
    throw new TaxClassificationInputError(`${fieldName} is required`);
  }

  return value.trim();
}

/**
 * Builds a complete, safe document payload. It deliberately ignores company and
 * owner fields: those are assigned only from authenticated company access.
 */
export function buildTaxClassificationPayload(payload, existing = null) {
  if (!isPlainObject(payload)) {
    throw new TaxClassificationInputError("A classification payload is required");
  }

  const existingData = existing?.toObject ? existing.toObject() : existing;
  const calculationMode = hasField(payload, "calculation_mode")
    ? payload.calculation_mode
    : existingData?.calculation_mode;

  if (!CALCULATION_MODES.includes(calculationMode)) {
    throw new TaxClassificationInputError(
      `calculation_mode must be one of: ${CALCULATION_MODES.join(", ")}`
    );
  }

  const changingMode = Boolean(existingData) && calculationMode !== existingData.calculation_mode;
  let applicableForRevisedCharge = hasField(payload, "applicable_for_revised_charge")
    ? payload.applicable_for_revised_charge
    : existingData?.applicable_for_revised_charge ?? false;

  if (typeof applicableForRevisedCharge !== "boolean") {
    throw new TaxClassificationInputError("applicable_for_revised_charge must be a boolean");
  }

  const result = {
    hsn_code: readRequiredText(payload, existingData, "hsn_code").toUpperCase(),
    description: readRequiredText(payload, existingData, "description"),
    calculation_mode: calculationMode,
    applicable_for_revised_charge: applicableForRevisedCharge,
  };

  if (calculationMode === "on_value") {
    if (hasField(payload, "rate_slabs") && (!Array.isArray(payload.rate_slabs) || payload.rate_slabs.length > 0)) {
      throw new TaxClassificationInputError("rate_slabs must be empty for On Value classifications");
    }

    const onValue = hasField(payload, "on_value")
      ? payload.on_value
      : changingMode
        ? undefined
        : existingData?.on_value;

    result.on_value = validateTaxFields(onValue, "on_value");
    result.rate_slabs = [];
    return result;
  }

  if (hasField(payload, "on_value")) {
    throw new TaxClassificationInputError("on_value must be absent for On Item Rate classifications");
  }

  const slabs = hasField(payload, "rate_slabs")
    ? payload.rate_slabs
    : changingMode
      ? undefined
      : existingData?.rate_slabs;

  result.on_value = undefined;
  result.rate_slabs = validateSlabs(slabs);
  return result;
}
