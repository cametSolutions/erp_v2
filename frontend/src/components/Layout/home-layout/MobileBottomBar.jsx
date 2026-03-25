import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";

import { ROUTES } from "@/routes/paths";

import { mobileTabs } from "./constants";

export default function MobileBottomBar() {
  const user = useSelector((state) => state.auth.user);
  const isStaffUser = user?.role === "staff";

  return (
    <nav className="fixed bottom-3 left-0 right-0 z-30 px-4 md:hidden">
      <div className="mx-auto h-[76px] max-w-md rounded-3xl border border-slate-200/80 bg-white/90 px-2 shadow-[0_8px_30px_rgba(15,23,42,0.12)] backdrop-blur-md">
        <div className="grid h-full grid-cols-4 items-center text-xs">
          {mobileTabs.map((tab) => {
            const Icon = tab.icon;
            const isDisabled =
              isStaffUser &&
              (tab.to === ROUTES.mastersCompany || tab.to === ROUTES.mastersUsers);

            return (
              <div
                key={tab.id}
                className={`relative z-10 flex flex-col items-center justify-center ${
                  isDisabled ? "cursor-not-allowed opacity-45" : ""
                }`}
                aria-disabled={isDisabled}
              >
                {isDisabled ? (
                  <>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="mt-1 text-[11px] font-medium text-slate-400">
                      {tab.label}
                    </span>
                  </>
                ) : (
                  <NavLink
                    to={tab.to}
                    end
                    className="flex flex-col items-center justify-center"
                  >
                    {({ isActive }) => (
                      <>
                        <div
                          className={`flex items-center justify-center transition-all duration-300 ${
                            isActive
                              ? "h-10 w-16 rounded-2xl bg-slate-600 text-white shadow-md"
                              : "h-10 w-10 rounded-full text-slate-500"
                          }`}
                        >
                          <Icon
                            className={`h-5 w-5 transition-transform duration-300 ${
                              isActive ? "scale-105" : "scale-100"
                            }`}
                          />
                        </div>
                        <span
                          className={`mt-1 text-[11px] font-medium transition-colors duration-300 ${
                            isActive ? "text-slate-900" : "text-slate-500"
                          }`}
                        >
                          {tab.label}
                        </span>
                      </>
                    )}
                  </NavLink>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
