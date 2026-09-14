import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, currentUser } = useAuth();
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

  if (!isAdmin) {
    return (
      <div className="history-page-container" style={{ textAlign: "center", padding: "80px 20px" }}>
        <div className="glass-card" style={{ maxWidth: "560px", margin: "0 auto", padding: "40px" }}>
          <ShieldAlert size={56} color="#f43f5e" style={{ margin: "0 auto 16px" }} />
          <h2 style={{ color: "#fff", marginBottom: "8px" }}>403: Administrator Privilege Required</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "24px", fontSize: "0.95rem" }}>
            The account <strong>{currentUser?.email}</strong> is assigned role <em>"{currentUser?.role || "Analyst"}"</em> and does not hold Security Operations Center (SOC) Administrator privileges.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
            <Link to="/dashboard" className="cyber-btn-primary btn-sm" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <ArrowLeft size={16} /> Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default AdminRoute;
