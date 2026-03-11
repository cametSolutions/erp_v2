import { useEffect } from "react";
import { useMobileHeader } from "@/components/Layout/HomeLayout";

export default function UserPage() {
  const { setHeaderOptions, resetHeaderOptions } = useMobileHeader();

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
      <p className="text-sm text-slate-600">User screen content goes here.</p>
    </section>
  );
}
