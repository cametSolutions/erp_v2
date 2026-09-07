import express from "express";

import { createSale } from "../../controllers/saleController.js";
import { protect } from "../../middleware/authMiddleware.js";
import { requireCompanyAccess } from "../../middleware/companyAccessMiddleware.js";

const router = express.Router();

router.post("/", protect, requireCompanyAccess, createSale);

export default router;
