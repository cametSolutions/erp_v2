import { Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";

import AuthLayout from "./components/Layout/AuthLayout";
import MainLayout from "./components/Layout/MainLayout";
// import ProtectedRoute from "./components/Layout/ProtectedRoute";
import CustomMoonLoader from "./components/Loaders/CustomMoonLoader";
import CompanyRegisterPage from "./pages/Company/CompanyRegisterPage";
const CompanyListPage = lazy(() => import("./pages/Company/CompanyListPage"));
const LoginPage = lazy(() => import("./pages/Auth/LoginPage"));
const RegisterPage = lazy(() => import("./pages/Auth/RegisterPage"));
const UserCreatePage = lazy(() => import("./pages/users/UserCreatePage"));
const PartyListPage = lazy(() => import("./pages/party/PartyListPage"));
const PartyRegisterPage = lazy(() => import("./pages/party/PartyRegisterPage"));

// cnst HomePage = lazy(() => import("./pages/home/Home"));
const HomeLayout = lazy(() => import("./components/Layout/HomeLayout"));
const HomePage = lazy(() => import("./pages/Home/HomePage"));
const UserPage = lazy(() => import("./pages/Home/UserPage"));
const SettingsPage = lazy(() => import("./pages/Home/SettingsPage"));
const CustomersPage = lazy(() => import("./pages/Home/CustomersPage"));
const ProductsPage = lazy(() => import("./pages/Home/ProductsPage"));
const OutstandingPage = lazy(() => import("./pages/Home/OutstandingsPage"));
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
          <Route path="/company" element={<CompanyListPage />} />
          <Route path="/user" element={<UserPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/outstandings" element={<OutstandingPage />} />
          <Route path="/statements" element={<StatementsPage />} />
          <Route path="/stock-register" element={<StockRegisterPage />} />
          <Route path="/cash-bank" element={<CashBankPage />} />
          <Route path="/create-order" element={<CreateOrderPage />} />
          <Route path="/create-receipt" element={<CreateReceiptPage />} />
          {/* user creation route */}
          <Route
            path="/users/create"
            element={
              // <ProtectedRoute>
              <UserCreatePage />
              // </ProtectedRoute>
            }
          />

          {/* company registration route */}
          <Route
            path="/company/register"
            element={
              // <ProtectedRoute>
              <CompanyRegisterPage />
              // </ProtectedRoute>
            }
          />

          <Route
            path="/party/list"
            element={
              // <ProtectedRoute>
              <PartyListPage />
              // </ProtectedRoute>
            }
          />
          <Route
            path="/party/register"
            element={
              // <ProtectedRoute>
              <PartyRegisterPage />
              // </ProtectedRoute>
            }
          />

          
        </Route>

        <Route path="*" element={<Navigate to="/sUsers/login" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
