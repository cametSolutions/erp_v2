// backend/controllers/subGroupController.js
import SubGroup from "../Model/SubGroup.js";
import { resolveAdminOwnerId } from "../utils/authScope.js";

export const listSubGroups = async (req, res) => {
  try {
    const owner = resolveAdminOwnerId(req);
    const { cmp_id, accountGroup } = req.query;

    if (!cmp_id) {
      return res
        .status(400)
        .json({ message: "cmp_id (company) is required" });
    }

    const filter = {
      Primary_user_id: owner,
      cmp_id,
    };

    if (accountGroup) {
      filter.accountGroup = accountGroup;
    }

    const subgroups = await SubGroup.find(filter)
      .sort({ subGroup: 1 })
      .select("_id subGroup subGroup_id accountGroup");

    return res.json(subgroups);
  } catch (err) {
    console.error("listSubGroups error:", err);
    return res.status(500).json({ message: "Failed to fetch subgroups" });
  }
};
