import mongoose from "mongoose";

import PrintConfiguration from "../Model/PrintConfiguration.js";
import {
  getDefaultConfig,
  isValidPrintVoucherType,
} from "../utils/printConfigDefaults.js";

const getPatchUpdateFields = (partialConfig = {}) =>
  Object.entries(partialConfig).reduce((accumulator, [key, value]) => {
    accumulator[`config.${key}`] = value;
    return accumulator;
  }, {});

export const getPrintConfiguration = async (req, res) => {


  try {
    const { cmp_id, voucher_type } = req.params;

    if (!mongoose.Types.ObjectId.isValid(cmp_id)) {
      return res.status(400).json({ message: "Invalid cmp_id" });
    }

    if (!isValidPrintVoucherType(voucher_type)) {
      return res.status(400).json({ message: "Invalid voucher_type" });
    }

    const doc = await PrintConfiguration.findOne({ cmp_id, voucher_type }).lean();
    const config = doc?.config || getDefaultConfig(voucher_type);

    return res.status(200).json({
      cmp_id,
      voucher_type,
      config,
    });
  } catch (error) {
    console.error("Error fetching print configuration:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updatePrintConfiguration = async (req, res) => {
  try {
    const { cmp_id, voucher_type } = req.params;
    const partialConfig = req.body;

    if (!mongoose.Types.ObjectId.isValid(cmp_id)) {
      return res.status(400).json({ message: "Invalid cmp_id" });
    }

    if (!isValidPrintVoucherType(voucher_type)) {
      return res.status(400).json({ message: "Invalid voucher_type" });
    }

    if (
      !partialConfig ||
      typeof partialConfig !== "object" ||
      Array.isArray(partialConfig)
    ) {
      return res.status(400).json({ message: "Invalid config payload" });
    }

    const updateFields = getPatchUpdateFields(partialConfig);
    const defaultConfig = getDefaultConfig(voucher_type);
    const existingDoc = await PrintConfiguration.findOne({
      cmp_id,
      voucher_type,
    })
      .select("_id")
      .lean();

    const doc = await PrintConfiguration.findOneAndUpdate(
      { cmp_id, voucher_type },
      existingDoc
        ? {
            $set: updateFields,
          }
        : {
            $set: {
              config: {
                ...defaultConfig,
                ...partialConfig,
              },
            },
            $setOnInsert: {
              cmp_id,
              voucher_type,
            },
          },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      cmp_id: doc.cmp_id,
      voucher_type: doc.voucher_type,
      config: doc.config,
    });
  } catch (error) {
    console.error("Error updating print configuration:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
