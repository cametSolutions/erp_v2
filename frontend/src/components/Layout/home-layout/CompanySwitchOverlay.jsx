export default function CompanySwitchOverlay({ open, companyName }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex flex-col items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
      <div className="flex justify-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/10 bg-slate-900/80 shadow-inner">
          <div className="relative h-8 w-8 overflow-hidden rounded-lg bg-slate-800">
            <div className="absolute left-1 top-1 h-5 w-5 rounded-full bg-slate-500/70" />
            <div className="absolute -left-4 top-1 h-5 w-5 animate-[moon-slide_1.2s_linear_infinite] rounded-full bg-slate-900/90" />
          </div>
        </div>
      </div>

      <div className="mt-4 text-center text-sm text-slate-100">
        <p className="font-medium">Switching company...</p>
        <p className="mt-1 text-xs text-slate-300">
          Preparing workspace for{" "}
          <span className="font-semibold text-white">
            {companyName || "the selected company"}
          </span>
          .
        </p>
      </div>

      <style>
        {`
          @keyframes moon-slide {
            0% { transform: translateX(0); }
            50% { transform: translateX(12px); }
            100% { transform: translateX(0); }
          }
        `}
      </style>
    </div>
  );
}
