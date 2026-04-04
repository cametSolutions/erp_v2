// e.g. src/components/common/ErrorRetryState.jsx
import { MdErrorOutline } from "react-icons/md";

function ErrorRetryState({ message, onRetry }) {
  return (
    <div className="flex h-40 flex-col items-center justify-center gap-2 text-center">
      <MdErrorOutline className="text-rose-500" size={28} />
      <p className="text-sm font-semibold text-slate-800">
        {message || "Something went wrong"}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-1 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
      >
        Retry
      </button>
    </div>
  );
}

export default ErrorRetryState;