// backend/routes/subgroup/subGroupRoute.js
import express from "express";
import { listSubGroups } from "../../controllers/subGroupController.js";
import { protect } from "../../middleware/authMiddleware.js";

const router = express.Router();

// GET /api/subgroup?cmp_id=...&accountGroup=...
router.get("/", protect, listSubGroups);

export default router;
