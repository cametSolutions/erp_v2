import mongoose from "mongoose";

import { CashTransactionSchema } from "../schemas/CashTransactionSchema.js";

// Structural model registration only. Payment routes/accounting are outside
// Phase 3 and remain intentionally unimplemented.
const Payment =
  mongoose.models.Payment || mongoose.model("Payment", CashTransactionSchema);

export default Payment;
