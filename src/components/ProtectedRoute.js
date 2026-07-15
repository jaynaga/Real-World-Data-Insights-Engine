import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const hasGuestAccess = localStorage.getItem('rwde_guest_access') === 'true';

  if (loading) {
    return <div>Loading...</div>;
  }

  return user || hasGuestAccess ? (
    children
  ) : (
    <Navigate to="/login" state={{ from: location }} replace />
  );
}
