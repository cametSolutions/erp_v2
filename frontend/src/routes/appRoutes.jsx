import { lazy } from "react";
import { Navigate, Route } from "react-router-dom";

import ProtectedRoute from "@/components/Layout/ProtectedRoute";
import { ROUTES } from "@/routes/paths";

const HomeLayout = lazy(() => import("@/components/Layout/HomeLayout"));
const HomePage = lazy(() => import("@/pages/Home/HomePage"));
const UserPage = lazy(() => import("@/pages/Home/UserPage"));
const SettingsPage = lazy(() => import("@/pages/Home/SettingsPage"));
const OutstandingsPage = lazy(() => import("@/pages/Home/OutstandingsPage"));
const StatementsPage = lazy(() => import("@/pages/Home/StatementsPage"));
const StockRegisterPage = lazy(() => import("@/pages/Home/StockRegisterPage"));
const CashBankPage = lazy(() => import("@/pages/Home/CashBankPage"));
const CreateOrderPage = lazy(() => import("@/pages/Home/CreateOrderPage"));
const CreateReceiptPage = lazy(() => import("@/pages/Home/CreateReceiptPage"));
const UserCreatePage = lazy(() => import("@/pages/users/UserCreatePage"));
const UserListPage = lazy(() => import("@/pages/users/UserListPage"));

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
    <Route path={ROUTES.outstandings} element={<OutstandingsPage />} />
    <Route path={ROUTES.statements} element={<StatementsPage />} />
    <Route path={ROUTES.stockRegister} element={<StockRegisterPage />} />
    <Route path={ROUTES.cashBank} element={<CashBankPage />} />
    <Route path={ROUTES.createOrder} element={<CreateOrderPage />} />
    <Route path={ROUTES.createReceipt} element={<CreateReceiptPage />} />
    <Route path={ROUTES.usersCreate} element={<UserCreatePage />} />
    <Route path={ROUTES.usersList} element={<UserListPage />} />
  </Route>
);
