import express from "express";

import {
  getCompanySettings,
  updateCompanySettings,
} from "../../controllers/companySettingsController.js";
import { protect } from "../../middleware/authMiddleware.js";
import { requireCompanyAccess } from "../../middleware/companyAccessMiddleware.js";

const router = express.Router();

router.get("/", protect, requireCompanyAccess, getCompanySettings);
router.put("/", protect, requireCompanyAccess, updateCompanySettings);

export default router;
