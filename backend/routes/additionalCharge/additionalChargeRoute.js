import express from "express";

import { listAdditionalCharges } from "../../controllers/additionalChargeController.js";
import { protect } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, listAdditionalCharges);

export default router;
