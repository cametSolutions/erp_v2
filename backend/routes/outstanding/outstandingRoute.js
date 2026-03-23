// routes/party/partyRoute.js
import express from "express";

import { protect } from "../../middleware/authMiddleware.js";
import { getOutstandingByParty } from "../../controllers/outstandingController.js";

const router = express.Router();

router.get("/party/:partyId", protect, getOutstandingByParty);
  // delete

export default router;
