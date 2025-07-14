import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSession } from "../context/SessionContext";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useSession();
  const location = useLocation();

  return isAuthenticated ? (
    children
  ) : (
    <Navigate to="/login" state={{ from: location }} replace />
  );
}
