// src/components/outstanding/LedgerFilter.jsx
export function LedgerFilter({ value, onChange, className = "" }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <select
        className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 outline-none transition focus:border-violet-300"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="ledger">Ledger</option>
        <option value="payable">Payables</option>
        <option value="receivable">Receivables</option>
      </select>
    </div>
  );
}
