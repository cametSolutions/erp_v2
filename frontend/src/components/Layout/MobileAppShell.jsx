import { NavLink, Outlet } from "react-router-dom";

function MobileAppShell({ title, tabs }) {
  return (
    <div className="min-h-screen bg-slate-50 md:bg-white">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-white shadow-sm md:max-w-2xl md:shadow-none">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur">
          <h1 className="text-base font-semibold text-slate-900">{title}</h1>
        </header>

        <main
          className="flex-1 overflow-y-auto px-4 py-4 pb-28"
          data-route-scroll-reset="true"
        >
          <Outlet />
        </main>

        <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur md:left-1/2 md:max-w-2xl md:-translate-x-1/2">
          <div className="mx-auto grid w-full max-w-md grid-cols-2 px-3 py-2 md:max-w-2xl">
            {tabs.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                className={({ isActive }) =>
                  `rounded-xl px-3 py-2 text-center text-sm font-medium transition ${
                    isActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}

export default MobileAppShell;
