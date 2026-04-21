import { Search, X } from "lucide-react";

export default function ListSearchBar({
  value,
  onChange,
  placeholder = "Search",
  className = "",
}) {
  const hasValue = String(value || "").length > 0;

  return (
    <div className={`relative ${className}`}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-sm border border-slate-200 bg-white pl-9 pr-10 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-300"
      />
      {hasValue && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
