import express from "express";

import {
  getCompanySettings,
  updateCompanySettings,
} from "../../controllers/companySettingsController.js";
import { protect } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getCompanySettings);
router.put("/", protect, updateCompanySettings);

export default router;
