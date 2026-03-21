// CashBankBalancePage.jsx
import { ROUTES } from "@/routes/paths";
import { useNavigate } from "react-router-dom";

export default function CashBankBalancePage() {
  const navigate = useNavigate();

  const totalCash = 15000;  // hardcoded
  const totalBank = 45000;  // hardcoded
  const total = totalCash + totalBank;

  return (
    <div className="p-4 text-white  min-h-screen">
      <h1 className="text-xl font-semibold mb-4">Cash / Bank Balance</h1>

      {/* Top card */}
      <div className="bg-teal-600 rounded-md p-8 text-center mb-6">
        <div className="text-3xl font-bold">₹ {total.toLocaleString("en-IN")}</div>
        <div className="text-sm mt-2">
          Sat Mar 21 2026 - Sat Mar 21 2026
        </div>
      </div>

      {/* Lines */}
      <div className="bg-white text-slate-900 rounded-md divide-y">
        <button
          className="w-full flex justify-between items-center px-4 py-3 text-left hover:bg-slate-100"
        onClick={() => navigate(ROUTES.CashInHandListPage)}
        >
          <span>Cash In Hand</span>
          <span>₹ {totalCash.toLocaleString("en-IN")}</span>
        </button>

        <button
          className="w-full flex justify-between items-center px-4 py-3 text-left hover:bg-slate-100"
          onClick={() => navigate(ROUTES.BankBalanceListPage)}
        >
          <span>Bank Balance</span>
          <span>₹ {totalBank.toLocaleString("en-IN")}</span>
        </button>
      </div>
    </div>
  );
}
