import express from "express";

import { listProducts } from "../../controllers/productController.js";
import { protect } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, listProducts);

export default router;
