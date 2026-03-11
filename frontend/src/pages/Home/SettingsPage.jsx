import { useEffect } from "react";
import { useMobileHeader } from "@/components/Layout/HomeLayout";

export default function SettingsPage() {
  const { setHeaderOptions, resetHeaderOptions } = useMobileHeader();

  useEffect(() => {
    setHeaderOptions({
      showMenuDots: true,
      menuItems: [{ label: "Reset Settings" }, { label: "Help" }],
    });

    return () => {
      resetHeaderOptions();
    };
  }, [resetHeaderOptions, setHeaderOptions]);

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-slate-900">Settings</h2>
      <p className="text-sm text-slate-600">
        Settings screen content goes here.
      </p>
    </section>
  );
}
