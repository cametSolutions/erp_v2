// routes/party/partyRoute.js
import express from "express";
import {
  addParty,
  listParties,
  getPartyById,
  updateParty,
  deleteParty,
} from "../../controllers/partyController.js";
import { protect } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, addParty);            // create
router.get("/", protect, listParties);          // list (infinite scroll)
router.get("/:id", protect, getPartyById);      // single
router.put("/:id", protect, updateParty);       // edit
router.delete("/:id", protect, deleteParty);    // delete

export default router;
