import { Bell, Home, Settings, Wallet } from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ROUTES } from "@/routes/paths";
import userAvatar from "@/assets/icons/user.png";

import MobileWalletCard from "./MobileWalletCard";
import NoCompanyScreen from "./NoCompanyScreen";
import UserIdentityBlock from "./UserIdentityBlock";
import { getInitials, getUserDisplayName } from "./utils";

// DesktopShell mirrors the mobile flows with a desktop navigation frame.
export default function DesktopShell({
  selectedCompany,
  onCompanyClick,
  hasCompany,
  isCheckingCompanies,
  role,
  canCreateCompany,
}) {
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
