import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useMobileHeader } from "@/components/Layout/HomeLayout";
import { useCompanyOptionsQuery } from "@/hooks/queries/companyQueries";
import { setSelectedCompanyId } from "@/store/slices/companySlice";

export default function UserPage() {
  const dispatch = useDispatch();
  const { setHeaderOptions, resetHeaderOptions } = useMobileHeader();
  const user = useSelector((state) => state.auth.user);
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const selectedCompanyId = useSelector((state) => state.company.selectedCompanyId);
  const { data: companies = [], isLoading } = useCompanyOptionsQuery(
    Boolean(isLoggedIn && user),
  );

  useEffect(() => {
    setHeaderOptions({
      showMenuDots: true,
      menuItems: [{ label: "Edit User" }, { label: "Share Profile" }],
    });

    return () => {
      resetHeaderOptions();
    };
  }, [resetHeaderOptions, setHeaderOptions]);

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-slate-900">User</h2>
      <p className="text-sm text-slate-600">
        Companies owned by you
      </p>

      {isLoading && (
        <p className="text-sm text-slate-500">Loading companies...</p>
      )}

      {!isLoading && companies.length === 0 && (
        <p className="text-sm text-slate-500">Select Company</p>
      )}

      {!isLoading && companies.length > 0 && (
        <ul className="space-y-2">
          {companies.map((company) => {
            const isSelected = company.id === selectedCompanyId;
            return (
              <li key={company.id}>
                <button
                  type="button"
                  onClick={() => dispatch(setSelectedCompanyId(company.id))}
                  className={`w-full rounded-md border px-3 py-2 text-left text-sm ${
                    isSelected
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  {company.name}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
