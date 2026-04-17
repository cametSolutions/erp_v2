// routes/party/partyRoute.js
import express from "express";
import {
  addParty,
  listParties,
  getPartyById,
  updateParty,
  deleteParty,getParties
} from "../../controllers/partyController.js";
import { protect } from "../../middleware/authMiddleware.js";
import { requireCompanyAccess } from "../../middleware/companyAccessMiddleware.js";

const router = express.Router();

router.post("/", protect, requireCompanyAccess, addParty);            // create
router.get("/", protect, requireCompanyAccess, listParties);          // list (infinite scroll)
router.get("/:id", protect, getPartyById);      // single
router.put("/:id", protect, requireCompanyAccess, updateParty);       // edit
router.delete("/:id", protect, deleteParty);    // delete
router.get("/party", getParties);

export default router;
