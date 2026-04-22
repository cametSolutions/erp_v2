import mongoose from "mongoose";

import { CashTransactionSchema } from "./CashTransaction.js";

// Receipt is a named model wrapper around shared cash-transaction schema.
// Keeps query semantics explicit for receipt flow.
const Receipt = mongoose.models.Receipt || mongoose.model("Receipt", CashTransactionSchema);

export default Receipt;
