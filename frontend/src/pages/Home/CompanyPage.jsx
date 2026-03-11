import { useEffect } from "react";
import { useMobileHeader } from "@/components/Layout/HomeLayout";

export default function CompanyPage() {
  const { setHeaderOptions, resetHeaderOptions } = useMobileHeader();

  useEffect(() => {
    setHeaderOptions({
      showMenuDots: true,
      menuItems: [{ label: "Add Company" }, { label: "Import Company" }],
    });

    return () => {
      resetHeaderOptions();
    };
  }, [resetHeaderOptions, setHeaderOptions]);

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-slate-900">Company</h2>
      <p className="text-sm text-slate-600">
        Company screen content goes here.
      </p>
    </section>
  );
}
