import express from "express";

import { listPriceLevels } from "../../controllers/priceLevelController.js";
import { protect } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, listPriceLevels);

export default router;
