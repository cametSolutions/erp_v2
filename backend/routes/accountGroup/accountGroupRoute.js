// backend/routes/accountGroup/accountGroupRoute.js
import express from "express";
import { listAccountGroups } from "../../controllers/accountGroupController.js";
import { protect } from "../../middleware/authMiddleware.js";

const router = express.Router();

// GET /api/account-group?cmp_id=...
router.get("/", protect, listAccountGroups);

export default router;
