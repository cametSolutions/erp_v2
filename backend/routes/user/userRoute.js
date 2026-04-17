// routes/user/userRoute.js
import express from "express";
import { createStaffUser, listStaffUsers,
  getStaffUserById,
  updateStaffUser,
  deleteStaffUser, } from "../../controllers/userController.js";
import { protect } from "../../middleware/authMiddleware.js";
import { requireAdmin } from "../../middleware/adminMiddleware.js";

const router = express.Router();


router.post("/staff", protect, requireAdmin, createStaffUser);
router.get("/staff", protect, requireAdmin, listStaffUsers);         // list
router.get("/staff/:id", protect, requireAdmin, getStaffUserById);   // get one
router.put("/staff/:id", protect, requireAdmin, updateStaffUser);    // update
router.delete("/staff/:id", protect, requireAdmin, deleteStaffUser); // delete
export default router;

