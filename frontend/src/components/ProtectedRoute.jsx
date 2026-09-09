import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{
          from: location,
          message: "Terminal Access Restricted: Please sign in or register to access the Phishing Detection Engine."
        }}
        replace
      />
    );
  }

  return children;
};

export default ProtectedRoute;
