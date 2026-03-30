import express from "express";

import { getVouchers } from "../../controllers/voucherController.js";
import { protect } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getVouchers);

export default router;
