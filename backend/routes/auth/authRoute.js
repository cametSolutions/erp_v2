import express from "express";
import {
  getCurrentUser,
  Login,
  logoutUser,
  registerUser,
} from "../../controllers/authController.js";
import { protect } from "../../middleware/authMiddleware.js";

const router = express.Router();

// POST /api/auth/register
router.post("/register", registerUser);
router.post('/Login', Login);
router.get("/me", protect, getCurrentUser);
router.post("/logout", logoutUser);
export default router;
