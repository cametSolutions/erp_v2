import { FileText } from "lucide-react";

export default function TransactionTypePlaceholder({
  title,
  description,
}) {
  return (
    <div className="mx-auto w-full max-w-3xl p-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto inline-flex rounded-full bg-slate-100 p-3 text-slate-500">
          <FileText className="h-5 w-5" />
        </div>
        <h1 className="mt-4 text-lg font-semibold text-slate-900">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">{description}</p>
      </div>
    </div>
  );
}
