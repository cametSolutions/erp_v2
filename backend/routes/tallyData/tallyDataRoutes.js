// routes/tallyDataRoute.js
import express from "express";
import { addAccountGroups, addSubGroups } from "../../controllers/tallyDataController.js/accountGroupController.js";


const router = express.Router();

/**
 * Tally Data Routes
 *
 * Base path example (in app.js / server.js):
 *   app.use("/api/tally", tallyDataRoute);
 *
 * Then this endpoint will be:
 *   POST /api/tally/account-groups
 *
 * Body:
 *   { "data": [ ...account groups array... ] }
 */

// Import / sync account groups from Tally
router.post("/account-groups", addAccountGroups);
router.post("/sub-groups", addSubGroups);

export default router;
