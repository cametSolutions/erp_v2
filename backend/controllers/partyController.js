// controllers/partyController.js
import mongoose from "mongoose";
import Party from "../Model/partySchema.js"
import AccountGroup from "../Model/AccountGroup.js";

const resolveAccountGroupId = async ({ cmp_id, accountGroup }) => {
  if (accountGroup && accountGroup !== "") {
    return accountGroup;
  }

  const fallbackGroup = await AccountGroup.findOne({
    accountGroup: "Sundry Debtors",
    cmp_id,
  });

  if (!fallbackGroup) {
    return null;
  }

  return fallbackGroup._id;
};

export const addParty = async (req, res) => {
  try {
    let {
      cmp_id,
      accountGroup,
      subGroup,
      partyName,
      mobileNumber,
      emailID,
      gstNo,
      panNo,
      billingAddress,
      shippingAddress,
      creditPeriod,
      creditLimit,
      openingBalanceType,
      openingBalanceAmount,
      country,
      state,
      pin,
      party_master_id,
      partyType, // optional, default 'party'
    } = req.body;

    // use currently selected company (if you store it) or from body:
    // cmp_id = cmp_id || req.companyIdFromHeader;

    accountGroup = await resolveAccountGroupId({ cmp_id, accountGroup });
    if (!accountGroup) {
      return res
        .status(400)
        .json({ success: false, message: "Default account group not found" });
    }

    const generatedId = new mongoose.Types.ObjectId();
    const cleanSubGroup = subGroup === "" ? undefined : subGroup;

    const party = new Party({
      _id: generatedId,
      cmp_id,
      Primary_user_id: req.user.id,
      partyType: partyType || "party",
      accountGroup,
      subGroup: cleanSubGroup,
      partyName,
      mobileNumber,
      emailID,
      gstNo,
      panNo,
      billingAddress,
      shippingAddress,
      creditPeriod,
      creditLimit,
      openingBalanceType,
      openingBalanceAmount,
      country,
      state,
      pin,
      party_master_id: party_master_id || generatedId.toString(),
    });

    const result = await party.save();

    return res.status(201).json({
      success: true,
      message: "Party added successfully",
      party: result,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error, try again!" });
  }
};

export const listParties = async (req, res) => {
  try {
    const owner = req.user.id; // logged-in primary user
    const { cmp_id, page = 1, limit = 20, search = "" } = req.query;

    if (!cmp_id) {
      return res
        .status(400)
        .json({ message: "cmp_id (company) is required" });
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    const filter = {
      Primary_user_id: owner,
      cmp_id,
    };

    const trimmedSearch = String(search || "").trim();
    if (trimmedSearch) {
      const safeSearch = trimmedSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const searchRegex = new RegExp(safeSearch, "i");

      filter.$or = [
        { partyName: searchRegex },
        { mobileNumber: searchRegex },
        { emailID: searchRegex },
        { gstNo: searchRegex },
      ];
    }

    const [items, total] = await Promise.all([
      Party.find(filter)
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limitNum),
      Party.countDocuments(filter),
    ]);

    const hasMore = skip + items.length < total;

    return res.json({
      items,
      total,
      page: pageNum,
      hasMore,
    });
  } catch (err) {
    console.error("listParties error:", err);
    return res.status(500).json({ message: "Failed to fetch parties" });
  }
};
export const getPartyById = async (req, res) => {
  try {
    const owner = req.user.id;
    const { id } = req.params;
    const party = await Party.findOne({ _id: id, Primary_user_id: owner });
    if (!party) {
      return res.status(404).json({ message: "Party not found" });
    }
    res.json(party);
  } catch {
    res.status(500).json({ message: "Failed to fetch party" });
  }
};

export const updateParty = async (req, res) => {
  try {
    const owner = req.user.id;
    const { id } = req.params;
    const existingParty = await Party.findOne({ _id: id, Primary_user_id: owner });

    if (!existingParty) {
      return res.status(404).json({ message: "Party not found" });
    }

    const accountGroup = await resolveAccountGroupId({
      cmp_id: req.body?.cmp_id || existingParty.cmp_id,
      accountGroup: req.body?.accountGroup,
    });

    if (!accountGroup) {
      return res.status(400).json({ message: "Default account group not found" });
    }

    const updatePayload = {
      ...req.body,
      accountGroup,
      subGroup:
        req.body?.subGroup === "" || req.body?.subGroup == null
          ? null
          : req.body.subGroup,
    };

    const party = await Party.findOneAndUpdate(
      { _id: id, Primary_user_id: owner },
      updatePayload,
      { new: true, runValidators: true }
    );

    res.json({ message: "Party updated", party });
  } catch {
    res.status(500).json({ message: "Failed to update party" });
  }
};

export const deleteParty = async (req, res) => {
  try {
    const owner = req.user.id;
    const { id } = req.params;

    const party = await Party.findOneAndDelete({
      _id: id,
      Primary_user_id: owner,
    });

    if (!party) {
      return res.status(404).json({ message: "Party not found" });
    }

    res.json({ message: "Party deleted" });
  } catch {
    res.status(500).json({ message: "Failed to delete party" });
  }
};
