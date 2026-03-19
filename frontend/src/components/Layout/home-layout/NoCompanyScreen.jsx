import { useNavigate } from "react-router-dom";

import { ROUTES } from "@/routes/paths";

export default function NoCompanyScreen({ role, canCreate }) {
  const navigate = useNavigate();
  const isPrimary = role === "admin";

  return (
    <div className="flex min-h-[calc(100vh-104px)] items-center justify-center bg-white px-4">
      <div className="max-w-xs text-center">
        <p className="text-sm font-semibold text-slate-900">
          {isPrimary
            ? "You don't have any company yet"
            : "Your admin has not created any company yet"}
        </p>
        <p className="mt-2 text-xs text-slate-500">
          {isPrimary
            ? "Please create a company to start using the dashboard."
            : "Please contact your admin to create a company before you can use the dashboard."}
        </p>

        {canCreate && (
          <button
            type="button"
            onClick={() => navigate(ROUTES.mastersCompanyRegister)}
            className="mt-4 inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white"
          >
            Create company
          </button>
        )}
      </div>
    </div>
  );
}
