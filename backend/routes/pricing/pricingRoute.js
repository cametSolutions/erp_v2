import express from "express";

import { getGlobalLsp, getPartyLsp } from "../../controllers/pricingController.js";
import { protect } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get("/lsp", protect, getPartyLsp);
router.get("/lsp/global", protect, getGlobalLsp);

export default router;
