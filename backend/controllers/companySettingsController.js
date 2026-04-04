import mongoose from "mongoose";

import CompanySettings from "../Model/CompanySettings.js";
import Party from "../Model/partySchema.js";

const resolveScope = (req) => ({
  Primary_user_id: req.user?.owner || req.user?.id || null,
  cmp_id: req.user?.cmp_id || null,
});

const buildUpdateFields = (payload = {}) => {
  const updateFields = {};

  if (
    Object.prototype.hasOwnProperty.call(
      payload?.dataEntry?.voucher || {},
      "defaultBankAccountId"
    )
  ) {
    updateFields["dataEntry.voucher.defaultBankAccountId"] =
      payload.dataEntry.voucher.defaultBankAccountId || null;
  }

  if (
    Object.prototype.hasOwnProperty.call(
      payload?.dataEntry?.order || {},
      "termsAndConditions"
    )
  ) {
    updateFields["dataEntry.order.termsAndConditions"] = Array.isArray(
      payload.dataEntry.order.termsAndConditions
    )
      ? payload.dataEntry.order.termsAndConditions
          .map((line) => String(line || "").trim())
          .filter((line) => line !== "")
      : [];
  }

  return updateFields;
};

export const getCompanySettings = async (req, res) => {
  try {
    const { Primary_user_id, cmp_id } = resolveScope(req);

    if (!Primary_user_id || !cmp_id) {
      return res.status(400).json({ message: "cmp_id is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(cmp_id)) {
      return res.status(400).json({ message: "Invalid cmp_id" });
    }

    const settings = await CompanySettings.findOne({
      Primary_user_id,
      cmp_id,
    })
      .populate({
        path: "dataEntry.voucher.defaultBankAccountId",
        select: "partyName bank_name ac_no ifsc",
        match: {
          partyType: "bank",
          Primary_user_id,
          cmp_id,
        },
      })
      .lean();

    if (!settings) {
      return res.status(200).json({});
    }

    return res.status(200).json(settings);
  } catch (error) {
    console.error("getCompanySettings error:", error);
    return res.status(500).json({ message: "Failed to fetch company settings" });
  }
};

export const updateCompanySettings = async (req, res) => {
  try {
    const { Primary_user_id, cmp_id } = resolveScope(req);

    if (!Primary_user_id || !cmp_id) {
      return res.status(400).json({ message: "cmp_id is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(cmp_id)) {
      return res.status(400).json({ message: "Invalid cmp_id" });
    }

    const updateFields = buildUpdateFields(req.body);

    if (Object.keys(updateFields).length === 0) {
      const existing = await CompanySettings.findOne({
        Primary_user_id,
        cmp_id,
      })
        .populate({
          path: "dataEntry.voucher.defaultBankAccountId",
          select: "partyName bank_name ac_no ifsc",
          match: {
            partyType: "bank",
            Primary_user_id,
            cmp_id,
          },
        })
        .lean();

      return res.status(200).json(existing || {});
    }

    const nextDefaultBankId = updateFields["dataEntry.voucher.defaultBankAccountId"];
    if (nextDefaultBankId) {
      if (!mongoose.Types.ObjectId.isValid(nextDefaultBankId)) {
        return res
          .status(400)
          .json({ message: "Invalid default bank account id" });
      }

      const bankExists = await Party.exists({
        _id: nextDefaultBankId,
        partyType: "bank",
        Primary_user_id,
        cmp_id,
      });

      if (!bankExists) {
        return res.status(400).json({ message: "Selected bank account not found" });
      }
    }

    const settings = await CompanySettings.findOneAndUpdate(
      {
        Primary_user_id,
        cmp_id,
      },
      {
        $set: updateFields,
        $setOnInsert: {
          Primary_user_id,
          cmp_id,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    ).populate({
      path: "dataEntry.voucher.defaultBankAccountId",
      select: "partyName bank_name ac_no ifsc",
      match: {
        partyType: "bank",
        Primary_user_id,
        cmp_id,
      },
    });

    return res.status(200).json(settings);
  } catch (error) {
    console.error("updateCompanySettings error:", error);
    return res.status(500).json({ message: "Failed to update company settings" });
  }
};
