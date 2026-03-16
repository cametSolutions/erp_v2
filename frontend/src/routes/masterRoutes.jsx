import { lazy } from "react";
import { Route } from "react-router-dom";

import ProtectedRoute from "@/components/Layout/ProtectedRoute";
import { MASTER_ROUTE_REDIRECTS, ROUTES } from "@/routes/paths";
import LegacyRedirect from "@/routes/LegacyRedirect";
import UserListPage from "@/pages/users/UserListPage";
import UserCreatePage from "@/pages/users/UserCreatePage";

const HomeLayout = lazy(() => import("@/components/Layout/HomeLayout"));
const CompanyListPage = lazy(() => import("@/pages/Company/CompanyListPage"));
const CompanyRegisterPage = lazy(() =>
  import("@/pages/Company/CompanyRegisterPage"),
);
const CustomersPage = lazy(() => import("@/pages/Home/CustomersPage"));
const ProductsPage = lazy(() => import("@/pages/Home/ProductsPage"));
const PartyListPage = lazy(() => import("@/pages/party/PartyListPage"));
const PartyRegisterPage = lazy(() => import("@/pages/party/PartyRegisterPage"));

export const masterRoutes = (
  <Route
    element={
      <ProtectedRoute>
        <HomeLayout />
      </ProtectedRoute>
    }
  >
    <Route
      path={ROUTES.mastersUsers}
      element={
        <ProtectedRoute allowedRoles={["admin"]}>
          <UserListPage />
        </ProtectedRoute>
      }
    />
      <Route
      path={ROUTES.mastersUserRegister}
      element={
        <ProtectedRoute allowedRoles={["admin"]}>
          <UserCreatePage />
        </ProtectedRoute>
      }
    />
   <Route
      path={ROUTES.mastersCompanyRegister}
      element={
        <ProtectedRoute allowedRoles={["admin"]}>
          <CompanyRegisterPage />
        </ProtectedRoute>
      }
    />
    <Route
      path={ROUTES.mastersCompany}
      element={
        <ProtectedRoute allowedRoles={["admin"]}>
          <CompanyListPage />
        </ProtectedRoute>
      }
    />
    <Route path={ROUTES.mastersCustomers} element={<CustomersPage />} />
    <Route path={ROUTES.mastersProducts} element={<ProductsPage />} />
    <Route path={ROUTES.mastersPartyList} element={<PartyListPage />} />
    <Route
      path={ROUTES.mastersPartyRegister}
      element={<PartyRegisterPage />}
    />

    <Route
      path="/company"
      element={<LegacyRedirect to={MASTER_ROUTE_REDIRECTS.company} />}
    />
    <Route
      path="/company/register"
      element={<LegacyRedirect to={MASTER_ROUTE_REDIRECTS.companyRegister} />}
    />
    <Route
      path="/customers"
      element={<LegacyRedirect to={MASTER_ROUTE_REDIRECTS.customers} />}
    />
    <Route
      path="/products"
      element={<LegacyRedirect to={MASTER_ROUTE_REDIRECTS.products} />}
    />
    <Route
      path="/party/list"
      element={<LegacyRedirect to={MASTER_ROUTE_REDIRECTS.partyList} />}
    />
    <Route
      path="/party/register"
      element={<LegacyRedirect to={MASTER_ROUTE_REDIRECTS.partyRegister} />}
    />
  </Route>
);
