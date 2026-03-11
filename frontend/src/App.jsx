import { Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";

import AuthLayout from "./components/Layout/AuthLayout";
import CustomMoonLoader from "./components/Loaders/CustomMoonLoader";

const LoginPage = lazy(() => import("./pages/Auth/LoginPage"));
const RegisterPage = lazy(() => import("./pages/Auth/RegisterPage"));
const HomeLayout = lazy(() => import("./components/Layout/HomeLayout"));
const HomePage = lazy(() => import("./pages/Home/HomePage"));
const CompanyPage = lazy(() => import("./pages/Home/CompanyPage"));
const UserPage = lazy(() => import("./pages/Home/UserPage"));
const SettingsPage = lazy(() => import("./pages/Home/SettingsPage"));
const CustomersPage = lazy(() => import("./pages/Home/CustomersPage"));
const ProductsPage = lazy(() => import("./pages/Home/ProductsPage"));
const OutstandingsPage = lazy(() => import("./pages/Home/OutstandingsPage"));
const StatementsPage = lazy(() => import("./pages/Home/StatementsPage"));
const StockRegisterPage = lazy(() => import("./pages/Home/StockRegisterPage"));
const CashBankPage = lazy(() => import("./pages/Home/CashBankPage"));
const CreateOrderPage = lazy(() => import("./pages/Home/CreateOrderPage"));
const CreateReceiptPage = lazy(() => import("./pages/Home/CreateReceiptPage"));

function App() {
  return (
    <Suspense fallback={<CustomMoonLoader />}>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/sUsers/login" element={<LoginPage />} />
          <Route path="/sUsers/register" element={<RegisterPage />} />
        </Route>

        <Route element={<HomeLayout />}>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/company" element={<CompanyPage />} />
          <Route path="/user" element={<UserPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/outstandings" element={<OutstandingsPage />} />
          <Route path="/statements" element={<StatementsPage />} />
          <Route path="/stock-register" element={<StockRegisterPage />} />
          <Route path="/cash-bank" element={<CashBankPage />} />
          <Route path="/create-order" element={<CreateOrderPage />} />
          <Route path="/create-receipt" element={<CreateReceiptPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/sUsers/login" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
