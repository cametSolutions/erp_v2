import mongoose from "mongoose";

import TaxClassification from "../Model/TaxClassificationSchema.js";
import Product from "../Model/ProductSchema.js";
import {
  buildTaxClassificationPayload,
  TaxClassificationInputError,
} from "../services/taxClassification.service.js";
import { resolveAdminOwnerId } from "../utils/companyScope.js";

function getScope(req) {
  return {
    cmp_id: req.companyId,
    Primary_user_id: resolveAdminOwnerId(req),
  };
}

function sendError(res, error, fallbackMessage) {
  if (error instanceof TaxClassificationInputError || error.name === "ValidationError") {
    return res.status(400).json({ message: error.message });
  }

  if (error?.code === 11000) {
    return res.status(409).json({ message: "An HSN/SAC code with this company already exists" });
  }

  console.error(fallbackMessage, error);
  return res.status(500).json({ message: fallbackMessage });
}

function validateId(id, res) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ message: "Invalid tax classification id" });
    return false;
  }

  return true;
}

export const listTaxClassifications = async (req, res) => {
  try {
    const records = await TaxClassification.find(getScope(req))
      .sort({ hsn_code: 1 })
      .lean();

    return res.status(200).json({ data: records });
  } catch (error) {
    return sendError(res, error, "Failed to fetch tax classifications");
  }
};

export const getTaxClassificationById = async (req, res) => {
  if (!validateId(req.params.id, res)) return;

  try {
    const record = await TaxClassification.findOne({
      _id: req.params.id,
      ...getScope(req),
    }).lean();

    if (!record) {
      return res.status(404).json({ message: "Tax classification not found" });
    }

    return res.status(200).json({ data: record });
  } catch (error) {
    return sendError(res, error, "Failed to fetch tax classification");
  }
};

export const createTaxClassification = async (req, res) => {
  try {
    const record = await TaxClassification.create({
      ...getScope(req),
      ...buildTaxClassificationPayload(req.body),
    });

    return res.status(201).json({
      message: "Tax classification created successfully",
      data: record,
    });
  } catch (error) {
    return sendError(res, error, "Failed to create tax classification");
  }
};

export const updateTaxClassification = async (req, res) => {
  if (!validateId(req.params.id, res)) return;

  try {
    const scope = getScope(req);
    const record = await TaxClassification.findOne({ _id: req.params.id, ...scope });

    if (!record) {
      return res.status(404).json({ message: "Tax classification not found" });
    }

    const payload = buildTaxClassificationPayload(req.body, record);
    Object.assign(record, payload);

    // Undefined removes stale On Value data when the mode changes to slabs.
    if (payload.on_value === undefined) {
      record.set("on_value", undefined);
    }

    await record.save();

    return res.status(200).json({
      message: "Tax classification updated successfully",
      data: record,
    });
  } catch (error) {
    return sendError(res, error, "Failed to update tax classification");
  }
};

export const deleteTaxClassification = async (req, res) => {
  if (!validateId(req.params.id, res)) return;

  try {
    const scope = getScope(req);
    const record = await TaxClassification.findOne({ _id: req.params.id, ...scope });

    if (!record) {
      return res.status(404).json({ message: "Tax classification not found" });
    }

    // Products currently store only hsn_code, so protect the classification by
    // matching that code within the same company and owner scope.
    const escapedHsnCode = record.hsn_code.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const productUsingClassification = await Product.exists({
      ...scope,
      hsn_code: new RegExp(`^${escapedHsnCode}$`, "i"),
    });

    if (productUsingClassification) {
      return res.status(409).json({
        message: "This HSN/SAC code is used by a product and cannot be deleted",
      });
    }

    await record.deleteOne();
    return res.status(200).json({ message: "Tax classification deleted successfully" });
  } catch (error) {
    return sendError(res, error, "Failed to delete tax classification");
  }
};
