// controllers/companyController.js
import mongoose from "mongoose";
import Company from "../Model/CompanySchema.js";
import { createDefaultVoucherSeries } from "../Helper/createDefaultVoucherSeries.js";


export const registerCompany = async (req, res) => {
  const {
    name,
    pin,
    state,
    country,
    email,
    mobile,
    gstNum,
    logo,
    flat,
    road,
    place,
    landmark,
    website,
    pan,
    financialYear,
    type,
    industry,
    currency,
    currencyName,
  } = req.body;

  const owner = req.user?.id; // from protect middleware

  if (
    !owner ||
    !name ||
    !pin ||
    !state ||
    !country ||
    !email ||
    !mobile ||
    !place ||
    !financialYear ||
    !currency ||
    !currencyName
  ) {
    return res
      .status(400)
      .json({ message: "Required fields are missing" });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const companies = await Company.create(
      [
        {
          name,
          pin,
          state,
          country,
          email,
          mobile,
          gstNum,
          logo,
          flat,
          road,
          place,
          landmark,
          website,
          pan,
          financialYear,
          type,
          currency,
          currencyName,
          industry,
          owner,
        },
      ],
      { session }
    );

    const company = companies[0];

    if (!company) {
      await session.abortTransaction();
      session.endSession();
      return res
        .status(400)
        .json({ message: "Company creation failed" });
    }

    const voucherOk = await createDefaultVoucherSeries({
      companyId: company._id,  // or company.cmp_id if you prefer
      ownerId: owner,
      session,
    });

    if (!voucherOk) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message: "Failed to create default voucher series",
      });
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      message: "Company registered successfully",
      company,
    });
  } catch (error) {
    console.error("registerCompany error:", error);
    await session.abortTransaction();
    session.endSession();
    return res
      .status(500)
      .json({ message: "Internal server error, try again!" });
  }
};

// @desc get Primary user organization list
// route GET/api/pUsers/getOrganizations

export const getCompanies = async (req, res) => {
  try {
    const owner = req.user?.id;
    const companies = await Company.find({ owner }).sort({ createdAt: -1 });
    res.json(companies);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch companies" });
  }
};

export const updateCompany = async (req, res) => {
  try {
    const owner = req.user?.id;
    const { id } = req.params;
    const body = req.body;

    const company = await Company.findOneAndUpdate(
      { _id: id, owner },
      body,
      { new: true }
    );

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.json({ message: "Company updated", company });
  } catch (err) {
    res.status(500).json({ message: "Failed to update company" });
  }
};

export const deleteCompany = async (req, res) => {
  try {
    const owner = req.user?.id;
    const { id } = req.params;

    const company = await Company.findOneAndDelete({ _id: id, owner });

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.json({ message: "Company deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete company" });
  }
};

export const getCompanyById = async (req, res) => {
  try {
    const owner = req.user?.id;
    const { id } = req.params;

    const company = await Company.findOne({ _id: id, owner });

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.json(company);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch company" });
  }
};