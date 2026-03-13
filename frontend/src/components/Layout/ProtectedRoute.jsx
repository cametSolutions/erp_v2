// src/components/Layout/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  // Example: check token in localStorage or any auth state
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/sUsers/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
