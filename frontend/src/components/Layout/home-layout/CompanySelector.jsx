import { Building2, ChevronDown } from "lucide-react";

export default function CompanySelector({
  selectedCompany,
  onClick,
  tone = "light",
}) {
  const isDarkTone = tone === "dark";
  const companyLabel = selectedCompany?.name || "Select Company";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`mt-1 inline-flex max-w-[240px] items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] transition-colors ${
        isDarkTone
          ? "bg-white/10 text-blue-100 hover:bg-white/20"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      }`}
    >
      <Building2 className="h-3.5 w-3.5" />
      <span className="truncate">{companyLabel}</span>
      <ChevronDown className="h-3.5 w-3.5" />
    </button>
  );
}
