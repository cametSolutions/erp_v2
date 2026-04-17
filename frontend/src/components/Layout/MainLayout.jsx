// src/components/Layout/MainLayout.jsx
import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { FaHome, FaUser, FaBuilding, FaUsers  } from "react-icons/fa";
import { useLogoutUser } from "@/hooks/mutations/useLogoutUser";
import { ROUTES } from "@/routes/paths";

const MainLayout = () => {
  const navigate = useNavigate();
  const { logoutUser } = useLogoutUser();

  const handleLogout = () => {
    logoutUser()
      .then(() => {
        navigate(ROUTES.login, { replace: true });
      })
      .catch(() => {});
  };

  const navLinkClass =
    "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium cursor-pointer";
  const baseColor = "text-gray-600 hover:bg-blue-50 hover:text-blue-600";
  const activeColor = "bg-blue-100 text-blue-700";

  return (
    <div className="flex min-h-screen bg-[#f5f7fb]">
      {/* Sidebar */}
      <aside className="hidden md:flex md:w-64 flex-col bg-white border-r border-gray-200">
        <div className="h-16 flex items-center px-4 border-b border-gray-200">
          <span className="text-lg font-bold text-blue-600">ERP v2</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavLink
            to="/home-page"
            className={({ isActive }) =>
              `${navLinkClass} ${isActive ? activeColor : baseColor}`
            }
          >
            <FaHome size={16} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/users/create"
            className={({ isActive }) =>
              `${navLinkClass} ${isActive ? activeColor : baseColor}`
            }
          >
            <FaUser size={16} />
            <span>User</span>
          </NavLink>

          <NavLink
  to="/users/list"
  className={({ isActive }) =>
    `${navLinkClass} ${isActive ? activeColor : baseColor}`
  }
>
  <FaUser size={16} />
  <span>Users</span>
</NavLink>


          <NavLink
            to="/company/register"
            className={({ isActive }) =>
              `${navLinkClass} ${isActive ? activeColor : baseColor}`
            }
          >
            <FaBuilding size={16} />
            <span>Company</span>
          </NavLink>
          <NavLink
            to="/company/list"
            className={({ isActive }) =>
              `${navLinkClass} ${isActive ? activeColor : baseColor}`
            }
          >
            <FaBuilding size={16} />
            <span>Companies</span>
          </NavLink>

          


 <NavLink
            to="/party/register"
            className={({ isActive }) =>
              `${navLinkClass} ${isActive ? activeColor : baseColor}`
            }
          >
            <FaUsers size={16} />
            <span>Party</span>
          </NavLink>


<NavLink
            to="/party/list"
            className={({ isActive }) =>
              `${navLinkClass} ${isActive ? activeColor : baseColor}`
            }
          >
            <FaUsers size={16} />
            <span>Parties</span>
          </NavLink>



          {/* add more menu items here later */}
        </nav>

        <div className="border-t border-gray-200 px-3 py-3">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6">
          <span className="md:hidden text-lg font-bold text-blue-600">
            ERP v2
          </span>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 hidden sm:inline">
              Logged in
            </span>
          </div>
        </header>

        {/* Routed page content */}
        <main
          className="flex-1 overflow-auto p-4 md:p-6"
          data-route-scroll-reset="true"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
