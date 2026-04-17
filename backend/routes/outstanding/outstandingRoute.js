// routes/party/partyRoute.js
import express from "express";

import { protect } from "../../middleware/authMiddleware.js";
import { requireCompanyAccess } from "../../middleware/companyAccessMiddleware.js";
import { getOutstandingByParty } from "../../controllers/outstandingController.js";

const router = express.Router();

router.get("/party/:partyId", protect, requireCompanyAccess, getOutstandingByParty);
  // delete

export default router;
