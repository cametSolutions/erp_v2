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
import { useDispatch, useSelector } from "react-redux";
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
  ChevronDown,
  Check,
} from "lucide-react";
import { capitalizeFirstLetter } from "../../../../shared/utils/string.js";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import userAvatar from "@/assets/icons/user.png";
import {
  clearSelectedCompany,
  setSelectedCompany,
  setSelectedCompanyId,
} from "@/store/slices/companySlice";
import ListSearchBar from "@/components/common/ListSearchBar";
import {
  useCompanyByIdQuery,
  useCompanyOptionsQuery,
} from "@/hooks/queries/companyQueries";
import { useLogoutUser } from "@/hooks/mutations/useLogoutUser";
import { ROUTES } from "@/routes/paths";

const mobileTabs = [
  { id: "home", label: "Home", icon: Home, to: ROUTES.home },
  {
    id: "company",
    label: "Company",
    icon: Building2,
    to: ROUTES.mastersCompany,
  },
  { id: "users",
    label: "Users",
    icon: CircleUserRound,
    to: ROUTES.mastersUsers, },

  { id: "settings", label: "Settings", icon: Settings, to: ROUTES.settings },
];

const routeTitleMap = {
  [ROUTES.home]: "Home",
  [ROUTES.mastersCompany]: "Company",
  [ROUTES.mastersCompanyRegister]: "Company",
  [ROUTES.mastersUsers]: "Users",          // list page
  [ROUTES.mastersUserRegister]: "User",    // create/edit page
  [ROUTES.settings]: "Settings",
  [ROUTES.mastersCustomers]: "Customers",
  [ROUTES.mastersProducts]: "Products",
  [ROUTES.mastersPartyList]: "Parties",
  [ROUTES.mastersPartyRegister]: "Party",
 [ROUTES.outstanding]: "Outstandings",

  [ROUTES.statements]: "Statements",
  [ROUTES.stockRegister]: "Stock Register",
  [ROUTES.cashBank]: "Cash / Bank",
  [ROUTES.createOrder]: "Create Order",
  [ROUTES.createReceipt]: "Create Receipt",
};

const DEFAULT_MOBILE_HEADER_OPTIONS = {
  showMenuDots: true,
  onMenuClick: undefined,
  menuItems: [],
  search: null,
};

const MobileHeaderContext = createContext(null);

function getUserDisplayName(user) {
  return user?.userName || user?.name || user?.email || "User";
}

function getInitials(name) {
  const text = String(name || "").trim();
  if (!text) return "U";
  const parts = text.split(/\s+/).slice(0, 2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join("");
}

function CompanySelector({ selectedCompany, onClick, tone = "light" }) {
  const isDarkTone = tone === "dark";
  const companyLabel = selectedCompany?.name || "Select Company";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`mt-1 inline-flex max-w-[240px] items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] transition-colors ${
        isDarkTone
          ? "bg-white/10 text-blue-100 hover:bg-white/20"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      }`}
    >
      <Building2 className="h-3.5 w-3.5" />
      <span className="truncate">{companyLabel}</span>
      <ChevronDown className="h-3.5 w-3.5" />
    </button>
  );
}

function UserIdentityBlock({
  displayName,
  selectedCompany,
  onCompanyClick,
  tone = "light",
}) {
  const isDarkTone = tone === "dark";

  return (
    <div className="min-w-0">
      <p
        className={`truncate text-sm font-semibold leading-tight  ${
          isDarkTone ? "text-white" : "text-slate-900"
        }`}
      >
        {capitalizeFirstLetter(displayName)}
      </p>
      <CompanySelector
        selectedCompany={selectedCompany}
        onClick={onCompanyClick}
        tone={tone}
      />
    </div>
  );
}

function CompanyDrawer({
  open,
  selectedCompany,
  companies,
  loading,
  onClose,
  onSelectCompany,
}) {
  useEffect(() => {
    if (!open) return undefined;

    const onEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [onClose, open]);

  return (
    <div
      className={`fixed inset-0 z-50 transition-all duration-200 ${
        open ? "pointer-events-auto" : "pointer-events-none"
      }`}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label="Close company drawer"
        onClick={onClose}
        className={`absolute inset-0 bg-black/45 transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Select Company"
        className={`absolute inset-x-0 bottom-0 rounded-t-3xl bg-white px-4 pb-7 pt-4 shadow-2xl transition-transform duration-200 ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-slate-300" />
        <p className="text-base font-semibold text-slate-900">Select Company</p>
        <p className="mt-1 text-xs text-slate-500">
          Choose one company to continue
        </p>

        <div className="mt-4 space-y-2">
          {loading && (
            <p className="text-sm text-slate-500">Loading companies...</p>
          )}

          {!loading && companies.length === 0 && (
            <p className="text-sm text-slate-500">No companies found</p>
          )}

          {!loading &&
            companies.map((company) => {
              const isSelected =
                (selectedCompany?._id || selectedCompany?.id) === company.id;

              return (
                <button
                  key={company.id}
                  type="button"
                  onClick={() => onSelectCompany(company)}
                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left transition-colors ${
                    isSelected
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-sm font-medium">{company.name}</span>
                  {isSelected && <Check className="h-4 w-4" />}
                </button>
              );
            })}
        </div>
      </div>
    </div>
  );
}

function CompanySwitchOverlay({ open, companyName }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex flex-col items-center justify-center bg-slate-950/60 backdrop-blur-sm px-4">
      <div className="flex justify-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-900/80 border border-white/10 shadow-inner">
          <div className="relative h-8 w-8 rounded-lg bg-slate-800 overflow-hidden">
            {/* moon */}
            <div className="absolute left-1 top-1 h-5 w-5 rounded-full bg-slate-500/70" />
            {/* moving shadow to create moon-phase effect */}
            <div className="absolute -left-4 top-1 h-5 w-5 rounded-full bg-slate-900/90 animate-[moon-slide_1.2s_linear_infinite]" />
          </div>
        </div>
      </div>

      {/* text under loader */}
      <div className="mt-4 text-center text-sm text-slate-100">
        <p className="font-medium">Switching company…</p>
        <p className="mt-1 text-xs text-slate-300">
          Preparing workspace for{" "}
          <span className="font-semibold text-white">
            {companyName || "the selected company"}
          </span>
          .
        </p>
      </div>

      {/* custom keyframes for moon loader */}
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
  return pathname === ROUTES.home;
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

function MobileWalletCard({ headerOptions, selectedCompany, onCompanyClick }) {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const displayName = getUserDisplayName(user);
  const initials = getInitials(displayName);
  const { logoutUser } = useLogoutUser();

  const onLogout = useCallback(() => {
    logoutUser()
      .then(() => {
        navigate(ROUTES.login, { replace: true });
      })
      .catch(() => {});
  }, [logoutUser, navigate]);

  const walletHeaderOptions = useMemo(
    () => ({
      ...headerOptions,
      menuItems: [
        ...(headerOptions?.menuItems || []),
        { label: "Logout", onSelect: onLogout },
      ],
    }),
    [headerOptions, onLogout],
  );

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
              <Avatar className="h-10 w-10 border border-white/30 bg-white/10">
                <AvatarImage src={userAvatar} alt={displayName} />
                <AvatarFallback className="bg-white/15 text-sm font-semibold text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <UserIdentityBlock
                displayName={displayName}
                selectedCompany={selectedCompany}
                onCompanyClick={onCompanyClick}
                tone="dark"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-colors hover:bg-white/20"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-sky-400 ring-1 ring-blue-900" />
              </button>
              <MobileHeaderActions options={walletHeaderOptions} tone="dark" />
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
              onClick={() => navigate(ROUTES.createOrder)}
              className="flex-1 rounded-xl border border-sky-400/30 bg-sky-500/90 py-5 text-[13px] font-semibold text-white shadow-md shadow-sky-900/30 transition-all hover:-translate-y-0.5 hover:bg-sky-500"
            >
              Create Order
            </Button>
            <Button
              type="button"
              onClick={() => navigate(ROUTES.createReceipt)}
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
              onClick={() => navigate(ROUTES.mastersCustomers)}
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
              onClick={() => navigate(ROUTES.mastersProducts)}
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
           onClick={() => navigate(ROUTES.outstanding)}
s
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
              onClick={() => navigate(ROUTES.statements)}
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
              onClick={() => navigate(ROUTES.stockRegister)}
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
              onClick={() => navigate(ROUTES.cashBank)}
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
  const searchOptions = headerOptions?.search;
  const showSearch = Boolean(searchOptions?.show ?? searchOptions);

  if (isHome) return null;

  const onBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(ROUTES.home, { replace: true });
  };

  return (
    <header className="sticky top-0 z-20 bg-white px-4 pt-4 text-slate-900">
      <div className="relative flex w-full  items-center justify-between">
        <button type="button" onClick={onBack} aria-label="Go back">
          <ChevronLeft className="h-4 w-4 text-blue-600 font-extrabold" />
        </button>
        <h1 className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-sm font-bold text-slate-900">
          {title}
        </h1>
        <div className="flex justify-end">
          <MobileHeaderActions options={headerOptions} tone="light" />
        </div>
      </div>
      {showSearch && (
        <div className="mx-auto w-full max-w-md pt-3 pb-3">
          <ListSearchBar
            value={searchOptions?.value ?? ""}
            onChange={searchOptions?.onChange ?? (() => {})}
            placeholder={searchOptions?.placeholder || "Search"}
          />
        </div>
      )}
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
                className={() =>
                  "relative z-10 flex flex-col items-center justify-center"
                }
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

function MobileShell({ selectedCompany, onCompanyClick, hasCompany,
  isCheckingCompanies, role,
  canCreateCompany, }) {
  const { pathname } = useLocation();
  const { headerOptionsByPath } = useMobileHeaderContext();
  const isHome = isHomePath(pathname);
  const title = getPageTitle(pathname);
  const headerOptions =
    headerOptionsByPath[pathname] ?? DEFAULT_MOBILE_HEADER_OPTIONS;
 const isCompanyRegister = pathname === ROUTES.mastersCompanyRegister;
  return (
    <div className="min-h-screen bg-slate-50 md:hidden">
      <div className="mx-auto min-h-screen w-full max-w-md bg-white shadow-sm">
        <MobileTopHeader
          isHome={isHome}
          title={title}
          headerOptions={headerOptions}
        />
 <main className="pb-[104px]">
          {isCheckingCompanies ? (
            <div className="flex min-h-[calc(100vh-104px)] items-center justify-center">
              <p className="text-sm text-slate-500">Checking your companies...</p>
            </div>
          ) : !hasCompany && !isCompanyRegister ? (
            <NoCompanyScreen role={role} canCreate={canCreateCompany} />
          ) : isHome ? (
            <>
              <MobileWalletCard
                headerOptions={headerOptions}
                selectedCompany={selectedCompany}
                onCompanyClick={onCompanyClick}
              />
              <div className="mt-4 px-4">
                <Outlet />
              </div>
            </>
          ) : (
            <div className="px-3 py-2">
              <Outlet />
            </div>
          )}
        </main>



        <MobileBottomBar />
      </div>
    </div>
  );
}

function DesktopShell({  selectedCompany,
  onCompanyClick,
  hasCompany,
  isCheckingCompanies,  role,
  canCreateCompany, }) {
  const { pathname } = useLocation();
  const user = useSelector((state) => state.auth.user);
  const displayName = getUserDisplayName(user);
  const initials = getInitials(displayName);
  const isCompanyRegister = pathname === ROUTES.mastersCompanyRegister;
  return (
    <div className="hidden h-screen bg-white md:flex">
      <aside className="flex w-64 flex-col border-r bg-white">
        <div className="flex h-16 items-center border-b px-4 font-semibold">
          MyWallet
        </div>
        <nav className="flex-1 space-y-2 px-4 py-4 text-sm">
          <NavLink
            to={ROUTES.home}
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
        <header className="flex h-20 items-center justify-between border-b bg-white px-6">
          <div>
            <UserIdentityBlock
              displayName={displayName}
              selectedCompany={selectedCompany}
              onCompanyClick={onCompanyClick}
              tone="light"
            />
          </div>
          <Avatar className="h-9 w-9">
            <AvatarImage src={userAvatar} alt={displayName} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </header>

     <main className="flex-1 overflow-y-auto p-6">
          {isCheckingCompanies ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-slate-500">Checking your companies...</p>
            </div>
          ) : !hasCompany && !isCompanyRegister ? (
              <NoCompanyScreen role={role} canCreate={canCreateCompany} />
          ) : pathname === ROUTES.home ? (
            <>
              <div className="max-w-md">
                <MobileWalletCard
                  selectedCompany={selectedCompany}
                  onCompanyClick={onCompanyClick}
                />
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
function NoCompanyScreen({ role, canCreate }) {
  const navigate = useNavigate();
  const isPrimary = role === "admin";

  return (
    <div className="flex min-h-[calc(100vh-104px)] items-center justify-center bg-white px-4">
      <div className="max-w-xs text-center">
        <p className="text-sm font-semibold text-slate-900">
          {isPrimary
            ? "You don\u2019t have any company yet"
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






export default function HomeLayout() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
   const role = user?.role || "staff"; // default staff
  const canCreateCompany = role === "admin";
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const selectedCompanyId = useSelector(
    (state) => state.company.selectedCompanyId,
  );
  const selectedCompany = useSelector((state) => state.company.selectedCompany);
  const [headerOptionsByPath, setHeaderOptionsByPath] = useState({});
  const [isCompanyDrawerOpen, setIsCompanyDrawerOpen] = useState(false);
  const [switchingCompanyId, setSwitchingCompanyId] = useState(null);
  const [switchingCompanyName, setSwitchingCompanyName] = useState("");
  const companiesEnabled = Boolean(isLoggedIn && user);

  const { data: companies = [], isLoading: isCompaniesLoading } =
    useCompanyOptionsQuery(companiesEnabled);
    const hasCompany = companies.length > 0;


  const effectiveSelectedCompanyId = useMemo(() => {
    if (!companies.length) return null;
    if (
      selectedCompanyId &&
      companies.some((company) => company.id === selectedCompanyId)
    ) {
      return selectedCompanyId;
    }
    return companies[0].id;
  }, [companies, selectedCompanyId]);

  const { data: selectedCompanyDetails } = useCompanyByIdQuery(
    effectiveSelectedCompanyId,
    companiesEnabled,
  );

  useEffect(() => {
    if (!companiesEnabled) return;
    if (isCompaniesLoading) return;

    if (!effectiveSelectedCompanyId) {
      if (selectedCompanyId || selectedCompany) {
        dispatch(clearSelectedCompany());
      }
      return;
    }

    if (selectedCompanyId !== effectiveSelectedCompanyId) {
      dispatch(setSelectedCompanyId(effectiveSelectedCompanyId));
    }
  }, [
    companiesEnabled,
    dispatch,
    effectiveSelectedCompanyId,
    isCompaniesLoading,
    selectedCompany,
    selectedCompanyId,
  ]);

  useEffect(() => {
    if (!selectedCompanyDetails) return;
    dispatch(setSelectedCompany(selectedCompanyDetails));
  }, [dispatch, selectedCompanyDetails]);

  useEffect(() => {
    if (!switchingCompanyId) return;
    if (!selectedCompanyDetails) return;

    const resolvedCompanyId =
      selectedCompanyDetails?._id || selectedCompanyDetails?.id || null;

    if (resolvedCompanyId !== switchingCompanyId) return;

    const timeoutId = window.setTimeout(() => {
      setSwitchingCompanyId(null);
      setSwitchingCompanyName("");
    }, 1000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [selectedCompanyDetails, switchingCompanyId]);

  const selectedCompanyForUi = useMemo(() => {
    const selectedId = effectiveSelectedCompanyId;
    if (!selectedId) return null;

    if ((selectedCompany?._id || selectedCompany?.id) === selectedId) {
      return selectedCompany;
    }

    return companies.find((company) => company.id === selectedId) || null;
  }, [companies, effectiveSelectedCompanyId, selectedCompany]);

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

  const openCompanyDrawer = useCallback(() => {
    setIsCompanyDrawerOpen(true);
  }, []);

  const closeCompanyDrawer = useCallback(() => {
    setIsCompanyDrawerOpen(false);
  }, []);

  const handleSelectCompany = useCallback(
    (company) => {
      const nextCompanyId = company?.id || null;
      if (!nextCompanyId || nextCompanyId === effectiveSelectedCompanyId) {
        setIsCompanyDrawerOpen(false);
        return;
      }

      setSwitchingCompanyId(nextCompanyId);
      setSwitchingCompanyName(company?.name || "");
      dispatch(setSelectedCompanyId(nextCompanyId));
      setIsCompanyDrawerOpen(false);
    },
    [dispatch, effectiveSelectedCompanyId],
  );

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
    <DesktopShell
      selectedCompany={selectedCompanyForUi}
      onCompanyClick={openCompanyDrawer}
      hasCompany={hasCompany}
      isCheckingCompanies={isCompaniesLoading && companiesEnabled}
       role={role}
  canCreateCompany={canCreateCompany}
    />
    <MobileShell
      selectedCompany={selectedCompanyForUi}
      onCompanyClick={openCompanyDrawer}
      hasCompany={hasCompany}
      isCheckingCompanies={isCompaniesLoading && companiesEnabled}
       role={role}
  canCreateCompany={canCreateCompany}
    />
    <CompanyDrawer
      open={isCompanyDrawerOpen}
      selectedCompany={selectedCompanyForUi}
      companies={companies}
      loading={isCompaniesLoading}
      onClose={closeCompanyDrawer}
      onSelectCompany={handleSelectCompany}
    />
    <CompanySwitchOverlay
      open={Boolean(switchingCompanyId)}
      companyName={switchingCompanyName}
    />
  </MobileHeaderContext.Provider>
);


}