import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, currentUser, quickAdminLogin } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{
          from: location,
          message: "Administrative Console Access Restricted: Please sign in with SOC Administrator credentials."
        }}
        replace
      />
    );
  }

  // Strict lockdown: if not admin, immediately bounce to /scanner without displaying any admin UI
  if (!isAdmin) {
    return <Navigate to="/scanner" replace />;
  }

  return children;
};

export default AdminRoute;
