import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Wallet,
  Bell,
  Settings,
  Building2,
  CircleUserRound,
  Users,
  Package,
  AlertCircle,
  FileText,
  Boxes,
  Banknote,
  MoreVertical,
  ChevronLeft,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const mobileTabs = [
  { id: "home", label: "Home", icon: Home, to: "/home" },
  { id: "company", label: "Company", icon: Building2, to: "/company" },
  { id: "user", label: "User", icon: CircleUserRound, to: "/user" },
  { id: "settings", label: "Settings", icon: Settings, to: "/settings" },
];

const routeTitleMap = {
  "/home": "Home",
  "/company": "Company",
  "/user": "User",
  "/settings": "Settings",
  "/customers": "Customers",
  "/products": "Products",
  "/outstandings": "Outstandings",
  "/statements": "Statements",
  "/stock-register": "Stock Register",
  "/cash-bank": "Cash / Bank",
  "/create-order": "Create Order",
  "/create-receipt": "Create Receipt",
};

const DEFAULT_MOBILE_HEADER_OPTIONS = {
  showMenuDots: true,
  onMenuClick: undefined,
  menuItems: [],
};

const MobileHeaderContext = createContext(null);

function useMobileHeaderContext() {
  const context = useContext(MobileHeaderContext);

  if (!context) {
    throw new Error("useMobileHeader must be used within HomeLayout.");
  }

  return context;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useMobileHeader() {
  const { pathname } = useLocation();
  const { setHeaderOptionsForPath, resetHeaderOptionsForPath } =
    useMobileHeaderContext();

  const setHeaderOptions = useCallback(
    (options) => {
      setHeaderOptionsForPath(pathname, options);
    },
    [pathname, setHeaderOptionsForPath],
  );

  const resetHeaderOptions = useCallback(() => {
    resetHeaderOptionsForPath(pathname);
  }, [pathname, resetHeaderOptionsForPath]);

  return { setHeaderOptions, resetHeaderOptions };
}

function getPageTitle(pathname) {
  if (routeTitleMap[pathname]) return routeTitleMap[pathname];
  const segment = pathname.split("/").filter(Boolean).at(-1);
  if (!segment) return "Home";
  return segment.charAt(0).toUpperCase() + segment.slice(1);
}

function isHomePath(pathname) {
  return pathname === "/home";
}

function MobileHeaderActions({ options, tone = "light" }) {
  const showMenuDots = options?.showMenuDots ?? true;
  const isDarkTone = tone === "dark";
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const actionButtonClass = isDarkTone
    ? "flex h-9 w-9 items-center justify-center text-white transition-colors hover:text-white/75"
    : "flex h-9 w-9 items-center justify-center text-slate-700 transition-colors hover:text-slate-900";
  const menuPanelClass = isDarkTone
    ? "absolute right-0 top-11 z-40 min-w-[160px] overflow-hidden rounded-xl bg-slate-900/95 py-1 text-white shadow-xl backdrop-blur"
    : "absolute right-0 top-11 z-40 min-w-[160px] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-slate-800 shadow-lg";
  const menuItems = options?.menuItems ?? [];

  useEffect(() => {
    if (!menuOpen) return undefined;

    const onOutsideClick = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, [menuOpen]);

  return (
    <div className="relative flex items-center gap-2" ref={menuRef}>
      {showMenuDots && (
        <button
          type="button"
          onClick={() => {
            if (options?.onMenuClick) {
              options.onMenuClick();
              return;
            }
            if (menuItems.length > 0) {
              setMenuOpen((prev) => !prev);
            }
          }}
          className={actionButtonClass}
          aria-label="More options"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      )}
      {showMenuDots && menuOpen && menuItems.length > 0 && (
        <div className={menuPanelClass}>
          {menuItems.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                item.onSelect?.();
                setMenuOpen(false);
              }}
              className={`block w-full px-3 py-2 text-left text-sm transition-colors ${
                isDarkTone ? "hover:bg-white/10" : "hover:bg-slate-100"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MobileWalletCard({ headerOptions }) {
  const navigate = useNavigate();

  return (
    <div className="bg-linear-to-b from-blue-800 to-indigo-600 text-white">
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-700 text-white">
        <svg
          className="absolute inset-0 h-full w-full opacity-[0.07]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="dots"
              x="0"
              y="0"
              width="24"
              height="24"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="2" cy="2" r="1.5" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>

        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-blue-500/30 blur-3xl" />
        <div className="absolute -bottom-6 -left-6 h-28 w-28 rounded-full bg-indigo-400/20 blur-2xl" />

        <div className="relative p-5">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-300 to-indigo-400 ring-2 ring-white/20 shadow-lg">
                <span className="text-sm font-bold text-white">A</span>
              </div>
              <div>
                <p className="text-[11px] leading-tight text-blue-200">
                  Welcome back
                </p>
                <p className="text-sm font-semibold leading-tight">
                  Hello, Alexandre!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-colors hover:bg-white/20"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-sky-400 ring-1 ring-blue-900" />
              </button>
              <MobileHeaderActions options={headerOptions} tone="dark" />
            </div>
          </div>

          <div className="relative mb-5 overflow-hidden rounded-2xl border border-white/10 bg-white/10 py-6 text-center backdrop-blur-sm">
            <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            <p className="mb-1 text-[11px] uppercase tracking-wide text-blue-200">
              Total Balance
            </p>
            <p className="text-3xl font-bold tracking-tight">$3,756.00</p>
            <p className="mt-1 text-[11px] text-blue-300">↑ 4.2% this month</p>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              onClick={() => navigate("/create-order")}
              className="flex-1 rounded-xl border border-sky-400/30 bg-sky-500/90 py-5 text-[13px] font-semibold text-white shadow-md shadow-sky-900/30 transition-all hover:-translate-y-0.5 hover:bg-sky-500"
            >
              Create Order
            </Button>
            <Button
              type="button"
              onClick={() => navigate("/create-receipt")}
              className="flex-1 rounded-xl border border-rose-400/30 bg-rose-500/90 py-5 text-[13px] font-semibold text-white shadow-md shadow-rose-900/30 transition-all hover:-translate-y-0.5 hover:bg-rose-500"
            >
              Create Receipt
            </Button>
          </div>
        </div>
      </div>

      <Card className="w-full rounded-t-[30px] rounded-b-none border-none bg-white pt-6 text-slate-900 shadow-none ring-0">
        <CardHeader className="pb-2" />
        <CardContent className="space-y-4 pb-7">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Quick Actions
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <button
              type="button"
              onClick={() => navigate("/customers")}
              className="group relative rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-3 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                <Users className="h-4 w-4" />
              </div>
              <p className="text-[13px] font-semibold text-slate-800">
                Customers
              </p>
              <p className="text-[11px] text-slate-500">Manage parties</p>
              <span className="absolute right-3 top-3 text-slate-300 transition-colors group-hover:text-slate-500">
                →
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigate("/products")}
              className="group relative rounded-3xl border border-pink-100 bg-gradient-to-br from-pink-50 to-white p-3 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-pink-100 text-pink-600">
                <Package className="h-4 w-4" />
              </div>
              <p className="text-[13px] font-semibold text-slate-800">
                Products
              </p>
              <p className="text-[11px] text-slate-500">Catalog items</p>
              <span className="absolute right-3 top-3 text-slate-300 transition-colors group-hover:text-slate-500">
                →
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigate("/outstandings")}
              className="group col-span-2 flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-3 py-3 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-500">
                  <AlertCircle className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <p className="text-[12px] font-semibold text-slate-800">
                    Outstandings
                  </p>
                  <p className="text-[11px] text-slate-500">Pending dues</p>
                </div>
              </div>
              <span className="text-slate-300 transition-colors group-hover:text-slate-500">
                →
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigate("/statements")}
              className="group flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-3 py-3 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-500">
                <FileText className="h-4 w-4" />
              </div>
              <div className="text-left">
                <p className="text-[12px] font-semibold text-slate-800">
                  Statements
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => navigate("/stock-register")}
              className="group flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-3 py-3 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-100 text-green-500">
                <Boxes className="h-4 w-4" />
              </div>
              <div className="text-left">
                <p className="text-[12px] font-semibold text-slate-800">
                  Stock register
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => navigate("/cash-bank")}
              className="group col-span-2 flex items-center justify-between rounded-2xl border border-slate-100 bg-gradient-to-r from-teal-50/80 to-white px-3 py-3 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 text-teal-500">
                  <Banknote className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <p className="text-[12px] font-semibold text-slate-800">
                    Cash / Bank
                  </p>
                  <p className="text-[11px] text-slate-500">Ledger & balance</p>
                </div>
              </div>
              <span className="text-slate-300 transition-colors group-hover:text-slate-500">
                →
              </span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MobileTopHeader({ isHome, title, headerOptions }) {
  const navigate = useNavigate();

  if (isHome) return null;

  const onBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/home", { replace: true });
  };

  return (
    <header className="sticky top-0 z-20 bg-white  px-4 py-2 text-slate-900 shadow-sm backdrop-blur mb-2">
      <div className="relative mx-auto flex w-full max-w-md items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back"
        >
          <ChevronLeft className="h-4 w-4 text-blue-600 font-extrabold" />
        </button>
        <h1 className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-sm font-bold text-slate-900">
          {title}
        </h1>
        <div>
          <MobileHeaderActions options={headerOptions} tone="light" />
        </div>
      </div>
    </header>
  );
}

function MobileBottomBar() {
  return (
    <nav className="fixed bottom-3 left-0 right-0 z-30 px-4 md:hidden">
      <div className="mx-auto h-[76px] max-w-md rounded-3xl border border-slate-200/80 bg-white/90 px-2 shadow-[0_8px_30px_rgba(15,23,42,0.12)] backdrop-blur-md">
        <div className="grid h-full grid-cols-4 items-center text-xs">
          {mobileTabs.map((tab) => {
            const Icon = tab.icon;

            return (
              <NavLink
                key={tab.id}
                to={tab.to}
                end
                className={() => "relative z-10 flex flex-col items-center justify-center"}
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
            );
          })}
        </div>
      </div>
    </nav>
  );
}

function MobileShell() {
  const { pathname } = useLocation();
  const { headerOptionsByPath } = useMobileHeaderContext();
  const isHome = isHomePath(pathname);
  const title = getPageTitle(pathname);
  const headerOptions =
    headerOptionsByPath[pathname] ?? DEFAULT_MOBILE_HEADER_OPTIONS;

  return (
    <div className="min-h-screen bg-slate-50 md:hidden">
      <div className="mx-auto min-h-screen w-full max-w-md bg-white shadow-sm">
        <MobileTopHeader
          isHome={isHome}
          title={title}
          headerOptions={headerOptions}
        />

        <main className="pb-[104px]">
          {isHome ? (
            <>
              <MobileWalletCard headerOptions={headerOptions} />
              <div className="mt-4 px-4">
                <Outlet />
              </div>
            </>
          ) : (
            <div className="px-4 py-4">
              <Outlet />
            </div>
          )}
        </main>

        <MobileBottomBar />
      </div>
    </div>
  );
}

function DesktopShell() {
  const { pathname } = useLocation();

  return (
    <div className="hidden h-screen bg-white md:flex">
      <aside className="flex w-64 flex-col border-r bg-white">
        <div className="flex h-16 items-center border-b px-4 font-semibold">
          MyWallet
        </div>
        <nav className="flex-1 space-y-2 px-4 py-4 text-sm">
          <NavLink
            to="/home"
            className={({ isActive }) =>
              `flex w-full items-center gap-2 text-left ${
                isActive ? "font-medium text-primary" : "text-muted-foreground"
              }`
            }
          >
            <Home className="h-4 w-4" />
            Dashboard
          </NavLink>
          <button className="flex w-full items-center gap-2 text-left text-muted-foreground">
            <Wallet className="h-4 w-4" />
            Transactions
          </button>
          <button className="flex w-full items-center gap-2 text-left text-muted-foreground">
            <Bell className="h-4 w-4" />
            Notifications
          </button>
          <button className="flex w-full items-center gap-2 text-left text-muted-foreground">
            <Settings className="h-4 w-4" />
            Settings
          </button>
        </nav>
        <div className="border-t p-4 text-xs text-muted-foreground">
          © 2026 MyWallet
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b bg-white px-6">
          <div>
            <p className="text-xs text-muted-foreground">Welcome back</p>
            <p className="text-sm font-semibold">Hello, Alexandre!</p>
          </div>
          <Avatar className="h-9 w-9">
            <AvatarImage src="" alt="Alexandre" />
            <AvatarFallback>AX</AvatarFallback>
          </Avatar>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {pathname === "/home" ? (
            <>
              <div className="max-w-md">
                <MobileWalletCard />
              </div>
              <div className="mt-6">
                <Outlet />
              </div>
            </>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
}

export default function HomeLayout() {
  const [headerOptionsByPath, setHeaderOptionsByPath] = useState({});

  const setHeaderOptionsForPath = useCallback((pathname, options) => {
    setHeaderOptionsByPath((prev) => ({
      ...prev,
      [pathname]: {
        ...DEFAULT_MOBILE_HEADER_OPTIONS,
        ...prev[pathname],
        ...options,
      },
    }));
  }, []);

  const resetHeaderOptionsForPath = useCallback((pathname) => {
    setHeaderOptionsByPath((prev) => {
      if (!prev[pathname]) return prev;

      const next = { ...prev };
      delete next[pathname];
      return next;
    });
  }, []);

  const mobileHeaderContextValue = useMemo(
    () => ({
      headerOptionsByPath,
      setHeaderOptionsForPath,
      resetHeaderOptionsForPath,
    }),
    [headerOptionsByPath, resetHeaderOptionsForPath, setHeaderOptionsForPath],
  );

  return (
    <MobileHeaderContext.Provider value={mobileHeaderContextValue}>
      <DesktopShell />
      <MobileShell />
    </MobileHeaderContext.Provider>
  );
}
