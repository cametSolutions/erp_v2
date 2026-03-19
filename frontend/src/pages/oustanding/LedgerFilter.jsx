// src/components/outstanding/LedgerFilter.jsx
export function LedgerFilter({ value, onChange, className = "" }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <select
        className="rounded-md bg-sky-600 px-2 py-1 text-xs text-white outline-none"
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
