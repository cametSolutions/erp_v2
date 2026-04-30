import AdditionalCharges from "../Model/AdditionalCharges.js";
import { resolveAdminOwnerId } from "../utils/authScope.js";

export const listAdditionalCharges = async (req, res) => {
  try {
    const owner = resolveAdminOwnerId(req);
    const { cmp_id } = req.query;

    if (!cmp_id) {
      return res.status(400).json({ message: "cmp_id (company) is required" });
    }

    const items = await AdditionalCharges.find({
      cmp_id,
      Primary_user_id: owner,
    })
      .select(
        "_id name hsn cgst sgst igst cess addl_cess state_cess additional_charge_id"
      )
      .sort({ name: 1 })
      .lean();

    return res.json(items);
  } catch (error) {
    console.error("listAdditionalCharges error:", error);
    return res
      .status(500)
      .json({ message: "Failed to fetch additional charges" });
  }
};
