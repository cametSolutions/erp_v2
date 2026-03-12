// src/App.jsx
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

function App() {
  return (
    <Suspense fallback={<CustomMoonLoader />}>
      <Routes>
        {/* redirect root to login */}
        <Route path="/" element={<Navigate to="/sUsers/login" replace />} />

        {/* Auth layout: login + register */}
        <Route element={<AuthLayout />}>
          <Route path="/sUsers/login" element={<LoginPage />} />
          <Route path="/sUsers/register" element={<RegisterPage />} />
        </Route>

        {/* Main layout (protected area) */}
        <Route element={<MainLayout />}>
          {/* example home route */}
          {/* <Route
            path="/home-page"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          /> */}

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

          <Route
  path="/company/list"
  element={
    // <ProtectedRoute>
      <CompanyListPage />
    // </ProtectedRoute>
  }
/>
        </Route>

        {/* catch-all */}
        <Route path="*" element={<Navigate to="/sUsers/login" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
