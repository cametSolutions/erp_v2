import { useEffect } from "react";
import { Check } from "lucide-react";

export default function CompanyDrawer({
  open,
  selectedCompany,
  companies,
  loading,
  onClose,
  onSelectCompany,
}) {
  useEffect(() => {
    if (!open) return undefined;

    const onEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 transition-all duration-200" aria-hidden={!open}>
      <button
        type="button"
        aria-label="Close company drawer"
        onClick={onClose}
        className="absolute inset-0 bg-black/45 transition-opacity duration-200"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Select Company"
        className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white px-4 pb-7 pt-4 shadow-2xl transition-transform duration-200"
      >
        <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-slate-300" />
        <p className="text-base font-semibold text-slate-900">Select Company</p>
        <p className="mt-1 text-xs text-slate-500">
          Choose one company to continue
        </p>

        <div className="mt-4 space-y-2">
          {loading && (
            <p className="text-sm text-slate-500">Loading companies...</p>
          )}

          {!loading && companies.length === 0 && (
            <p className="text-sm text-slate-500">No companies found</p>
          )}

          {!loading &&
            companies.map((company) => {
              const isSelected =
                (selectedCompany?._id || selectedCompany?.id) === company.id;

              return (
                <button
                  key={company.id}
                  type="button"
                  onClick={() => onSelectCompany(company)}
                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left transition-colors ${
                    isSelected
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-sm font-medium">{company.name}</span>
                  {isSelected && <Check className="h-4 w-4" />}
                </button>
              );
            })}
        </div>
      </div>
    </div>
  );
}
