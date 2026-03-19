import { createElement, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  AlertCircle,
  Banknote,
  Bell,
  Boxes,
  FileText,
  Package,
  Users,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import userAvatar from "@/assets/icons/user.png";
import { useLogoutUser } from "@/hooks/mutations/useLogoutUser";
import { ROUTES } from "@/routes/paths";

import MobileHeaderActions from "./MobileHeaderActions";
import UserIdentityBlock from "./UserIdentityBlock";
import { getInitials, getUserDisplayName } from "./utils";

function QuickActionCard({
  title,
  description,
  icon,
  onClick,
  iconClassName,
  className,
  wide = false,
}) {
  const containerClassName = wide
    ? "group relative col-span-2 flex items-center justify-between rounded-2xl border px-3 py-3 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
    : "group relative rounded-3xl border p-3 text-left shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md";
  const contentClassName = wide ? "flex items-center gap-3" : "";
  const bodyClassName = wide ? "text-left" : "mt-4";
  const titleClassName = wide ? "text-[12px]" : "text-[13px]";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${containerClassName} ${className}`}
    >
      <div className={contentClassName}>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-2xl ${iconClassName}`}
        >
          {icon ? createElement(icon, { className: "h-4 w-4" }) : null}
        </div>
        <div className={bodyClassName}>
          <p className={`${titleClassName} font-semibold text-slate-800`}>
            {title}
          </p>
          {description ? (
            <p className="text-[11px] text-slate-500">{description}</p>
          ) : null}
        </div>
      </div>
      <span className="text-slate-300 transition-colors group-hover:text-slate-500">
        {"->"}
      </span>
    </button>
  );
}

export default function MobileWalletCard({
  headerOptions,
  selectedCompany,
  onCompanyClick,
}) {
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

        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-500/30 blur-3xl" />
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
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-sky-400 ring-1 ring-blue-900" />
              </button>
              <MobileHeaderActions options={walletHeaderOptions} tone="dark" />
            </div>
          </div>

          <div className="relative mb-5 overflow-hidden rounded-2xl border border-white/10 bg-white/10 py-6 text-center backdrop-blur-sm">
            <div className="absolute left-1/4 right-1/4 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
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

      <Card className="w-full rounded-b-none rounded-t-[30px] border-none bg-white pt-6 text-slate-900 shadow-none ring-0">
        <CardHeader className="pb-2" />
        <CardContent className="space-y-4 pb-7">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              Quick Actions
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <QuickActionCard
              title="Customers"
              description="Manage parties"
              icon={Users}
              onClick={() => navigate(ROUTES.mastersCustomers)}
              iconClassName="bg-amber-100 text-amber-600"
              className="border-amber-100 bg-gradient-to-br from-amber-50 to-white"
            />
            <QuickActionCard
              title="Products"
              description="Catalog items"
              icon={Package}
              onClick={() => navigate(ROUTES.mastersProducts)}
              iconClassName="bg-pink-100 text-pink-600"
              className="border-pink-100 bg-gradient-to-br from-pink-50 to-white"
            />
            <QuickActionCard
              title="Outstandings"
              description="Pending dues"
              icon={AlertCircle}
              onClick={() => navigate(ROUTES.outstanding)}
              iconClassName="rounded-xl bg-red-100 text-red-500"
              className="border-slate-100 bg-white"
              wide
            />
            <QuickActionCard
              title="Statements"
              icon={FileText}
              onClick={() => navigate(ROUTES.statements)}
              iconClassName="rounded-xl bg-indigo-100 text-indigo-500"
              className="flex items-center gap-3 rounded-2xl border-slate-100 bg-white px-3 py-3"
            />
            <QuickActionCard
              title="Stock register"
              icon={Boxes}
              onClick={() => navigate(ROUTES.stockRegister)}
              iconClassName="rounded-xl bg-green-100 text-green-500"
              className="flex items-center gap-3 rounded-2xl border-slate-100 bg-white px-3 py-3"
            />
            <QuickActionCard
              title="Cash / Bank"
              description="Ledger & balance"
              icon={Banknote}
              onClick={() => navigate(ROUTES.cashBank)}
              iconClassName="rounded-xl bg-teal-100 text-teal-500"
              className="border-slate-100 bg-gradient-to-r from-teal-50/80 to-white"
              wide
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
