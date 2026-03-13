// routes/user/userRoute.js
import express from "express";
import { createStaffUser } from "../../controllers/userController.js";
import { protect } from "../../middleware/authMiddleware.js";

const router = express.Router();

// POST /api/users/staff  -> only logged-in admin
router.post("/staff", protect, createStaffUser);

export default router;
