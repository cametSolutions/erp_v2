import mongoose from "mongoose";

import { CashTransactionSchema } from "./CashTransaction.js";

const Receipt = mongoose.models.Receipt || mongoose.model("Receipt", CashTransactionSchema);

export default Receipt;
