// controllers/companyController.js
import { randomBytes } from "crypto";
import mongoose from "mongoose";
import Company from "../Model/CompanySchema.js";
import { createDefaultVoucherSeries } from "../helpers/createDefaultVoucherSeries.js";
import { seedDefaultPrintConfigs } from "../utils/seedPrintConfigs.js";

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const findCompanyWithSameName = async ({ owner, name, excludeId }) => {
  if (!owner || !name) return null;

  const query = {
    owner,
    name: new RegExp(`^${escapeRegex(name.trim())}$`, "i"),
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  return Company.findOne(query);
};

const generateTallyApiKey = () => `tly_${randomBytes(24).toString("hex")}`;

const generateUniqueTallyApiKey = async (session) => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = generateTallyApiKey();
    const exists = await Company.exists({ tally_api_key: candidate }).session(session);
    if (!exists) {
      return candidate;
    }
  }

  throw new Error("Failed to generate unique tally API key");
};

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
    currencySymbol,
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
    !financialYear?.format ||
    !financialYear?.startingYear ||
    !financialYear?.startMonth ||
    !financialYear?.endMonth ||
    !currency ||
    !currencyName ||
    !currencySymbol
  ) {
    return res.status(400).json({ message: "Required fields are missing" });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const existingCompany = await findCompanyWithSameName({ owner, name });
    if (existingCompany) {
      await session.abortTransaction();
      session.endSession();
      return res.status(409).json({
        message: "You already have a company with this name",
      });
    }

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
          currencySymbol,
          industry,
          tally_api_key: await generateUniqueTallyApiKey(session),
          owner,
        },
      ],
      { session },
    );

    const company = companies[0];

    if (!company) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Company creation failed" });
    }

    const voucherOk = await createDefaultVoucherSeries({
      companyId: company._id, // or company.cmp_id if you prefer
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

    try {
      await seedDefaultPrintConfigs(company._id);
    } catch (seedError) {
      console.error(
        `Failed to seed print configs for cmp_id: ${company._id}`,
        seedError
      );
    }

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

export const getCompanies = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const adminId = user.role === "admin" ? user.id : user.owner;

    if (!adminId) {
      return res.json([]);
    }

    const companies = await Company.find({ owner: adminId }).sort({
      createdAt: -1,
    });

    return res.json(companies);
  } catch (err) {
    console.error("getCompanies error:", err);
    return res.status(500).json({ message: "Failed to fetch companies" });
  }
};


export const updateCompany = async (req, res) => {
  try {
    const owner = req.user?.id;
    const { id } = req.params;
    const body = req.body;

    if (body?.name) {
      const existingCompany = await findCompanyWithSameName({
        owner,
        name: body.name,
        excludeId: id,
      });

      if (existingCompany) {
        return res.status(409).json({
          message: "You already have a company with this name",
        });
      }
    }

    const company = await Company.findOneAndUpdate({ _id: id, owner }, body, {
      returnDocument: "after",
      runValidators: true,
    });

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
    // const owner = req.user?.id;
    const user = req.user;
    const adminId = user.role === "admin" ? user.id : user.owner;

    const { id } = req.params;

    const company = await Company.findOne({ _id: id, owner: adminId });

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.json(company);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch company" });
  }
};
