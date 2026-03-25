import { lazy } from "react";
import { Navigate, Route } from "react-router-dom";

import ProtectedRoute from "@/components/Layout/ProtectedRoute";
import { ROUTES } from "@/routes/paths";
const CashInHandListPage = lazy(
  () => import("@/pages/party/CashInHandListPage"),
);
const BankBalanceListPage = lazy(
  () => import("@/pages/party/BankBalanceListPage"),
);

const HomeLayout = lazy(() => import("@/components/Layout/HomeLayout"));
const HomePage = lazy(() => import("@/pages/Home/HomePage"));
const UserPage = lazy(() => import("@/pages/Home/UserPage"));
const SettingsPage = lazy(() => import("@/pages/settings/settings"));
const OutstandingsPage = lazy(
  () => import("@/pages/oustanding/OutstandingPartyListPage"),
);
const StatementsPage = lazy(() => import("@/pages/Home/StatementsPage"));
const StockRegisterPage = lazy(() => import("@/pages/Home/StockRegisterPage"));
const CashBankBalancePage = lazy(
  () => import("@/pages/party/CashBankBalancePage"),
);
const CreateOrderPage = lazy(() => import("@/pages/sales/SalesCreatePage"));
const ProductSelectPage = lazy(() => import("@/pages/sales/ProductSelectPage"));
const CreateReceiptPage = lazy(() => import("@/pages/Home/CreateReceiptPage"));
const UserCreatePage = lazy(() => import("@/pages/users/UserCreatePage"));
const UserListPage = lazy(() => import("@/pages/users/UserListPage"));
const OutstandingPartyDetailPage = lazy(
  () => import("@/pages/oustanding/OutstandingPartyDetailPage"),
);

const DataEntrySettingsPage = lazy(
  () => import("@/pages/settings/DataEntrySettings "),
);
const VoucherSettingsPage = lazy(
  () => import("@/pages/settings/VoucherSettings "),
);
const VoucherSeriesSettingsPage = lazy(
  () => import("@/pages/settings/VoucherSeriesSettings"),
);
const VoucherSeriesListPage = lazy(
  () => import("@/pages/settings/VoucherSeriesList"),
);

const CreateVoucherSeriesPage = lazy(
  () => import("@/pages/settings/CreateVoucherSeriesPage"),
);
export const appRoutes = (
  <Route
    element={
      <ProtectedRoute>
        <HomeLayout />
      </ProtectedRoute>
    }
  >
    <Route path={ROUTES.root} element={<Navigate to={ROUTES.home} replace />} />
    <Route path={ROUTES.home} element={<HomePage />} />
    <Route path={ROUTES.user} element={<UserPage />} />
    <Route path={ROUTES.settings} element={<SettingsPage />} />
    <Route path={ROUTES.outstanding} element={<OutstandingsPage />} />
    <Route
      path={ROUTES.outstandingPartyDetail}
      element={<OutstandingPartyDetailPage />}
    />
    <Route path={ROUTES.statements} element={<StatementsPage />} />
    <Route path={ROUTES.stockRegister} element={<StockRegisterPage />} />
    <Route
      path={ROUTES.CashBankBalancePage}
      element={<CashBankBalancePage />}
    />
    <Route path={ROUTES.createOrder} element={<CreateOrderPage />} />
    <Route path={ROUTES.salesSelectItems} element={<ProductSelectPage />} />
    <Route path={ROUTES.createReceipt} element={<CreateReceiptPage />} />
    <Route path={ROUTES.usersCreate} element={<UserCreatePage />} />
    <Route path={ROUTES.usersList} element={<UserListPage />} />
    <Route path={ROUTES.CashInHandListPage} element={<CashInHandListPage />} />
    <Route
      path={ROUTES.BankBalanceListPage}
      element={<BankBalanceListPage />}
    />
    <Route
      path={ROUTES.settingsDataEntry}
      element={<DataEntrySettingsPage />}
    />
    <Route path={ROUTES.settingsVoucher} element={<VoucherSettingsPage />} />
    <Route
      path={ROUTES.settingsVoucherSeries}
      element={<VoucherSeriesSettingsPage />}
    />
    <Route
      path={ROUTES.settingsVoucherSeriesList}
      element={<VoucherSeriesListPage />}
    />
    <Route
      path={ROUTES.settingsVoucherSeriesCreate}
      element={<CreateVoucherSeriesPage />}
    />
  </Route>
);
