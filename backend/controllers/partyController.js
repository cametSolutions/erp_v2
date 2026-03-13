// controllers/partyController.js
import mongoose from "mongoose";
import Party from "../Model/partySchema.js"
import AccountGroup from "../Model/AccountGroup.js";

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

    if (!accountGroup || accountGroup === "") {
      const ag = await AccountGroup.findOne({
        accountGroup: "Sundry Debtors",
        cmp_id,
      });
      if (!ag) {
        return res
          .status(400)
          .json({ success: false, message: "Default account group not found" });
      }
      accountGroup = ag._id;
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
    const owner = req.user.id;
    const { cmp_id } = req.query; // or take company from token/context
    const page = parseInt(req.query.page || "1", 10);
    const limit = parseInt(req.query.limit || "20", 10);
    const skip = (page - 1) * limit;

    const filter = {
      Primary_user_id: owner,
      cmp_id,
      partyType: "party",
    };

    const [items, total] = await Promise.all([
      Party.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Party.countDocuments(filter),
    ]);

    res.json({
      items,
      total,
      page,
      hasMore: skip + items.length < total,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch parties" });
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

    const party = await Party.findOneAndUpdate(
      { _id: id, Primary_user_id: owner },
      req.body,
      { new: true }
    );

    if (!party) {
      return res.status(404).json({ message: "Party not found" });
    }

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
