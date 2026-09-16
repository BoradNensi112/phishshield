import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Shield, Lock, Mail, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2, ShieldCheck, ShieldAlert, Key } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [roleMode, setRoleMode] = useState("user"); // "user" or "admin"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminSecretKey, setAdminSecretKey] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectMessage = location.state?.message;
  const successMessage = location.state?.successMessage;
  const redirectPath = location.state?.from?.pathname || "/scanner";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Incorrect credentials");
      return;
    }

    if (roleMode === "admin" && !adminSecretKey.trim()) {
      setError("Incorrect credentials");
      return;
    }

    try {
      setIsSubmitting(true);
      await login(email, password, roleMode, roleMode === "admin" ? adminSecretKey.trim() : null);
      if (roleMode === "admin") {
        navigate("/admin");
      } else {
        navigate(redirectPath);
      }
    } catch (err) {
      setError("Incorrect credentials");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card-wrapper">
        <div className="auth-card glass-card">
          {/* Header */}
          <div className="auth-header">
            <div className="auth-logo-badge">
              <Shield className="auth-logo-icon" size={36} />
            </div>
            <h1 className="auth-title">PhishShield Terminal</h1>
            <p className="auth-subtitle">
              CYBER DEFENSE PLATFORM // SECURE ACCESS
            </p>
          </div>

          {/* Role Selector Tabs (User by default, Admin with Secret Key) */}
          <div className="auth-role-tabs">
            <button
              type="button"
              className={`auth-role-tab ${roleMode === "user" ? "active" : ""}`}
              onClick={() => {
                setRoleMode("user");
                setError("");
              }}
            >
              <ShieldCheck size={16} />
              <span>User / Analyst</span>
            </button>
            <button
              type="button"
              className={`auth-role-tab ${roleMode === "admin" ? "active" : ""}`}
              onClick={() => {
                setRoleMode("admin");
                setError("");
              }}
            >
              <ShieldAlert size={16} />
              <span>Administrator</span>
            </button>
          </div>

          {/* Success Banner after registration */}
          {successMessage && (
            <div className="auth-success-banner" role="status">
              <CheckCircle2 size={18} className="auth-success-icon" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Redirect Notice if user was redirected from a protected route */}
          {redirectMessage && (
            <div className="auth-notice-banner" role="status">
              <ShieldAlert size={18} className="auth-notice-icon" />
              <span>{redirectMessage}</span>
            </div>
          )}

          {/* Generic Error Alert */}
          {error && (
            <div className="auth-error-banner" role="alert">
              <AlertCircle size={18} className="auth-error-icon" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-input-group">
              <label htmlFor="email" className="auth-label">
                {roleMode === "admin" ? "Administrator Email" : "User / Analyst Email"}
              </label>
              <div className="auth-input-wrapper">
                <Mail className="auth-field-icon" size={18} />
                <input
                  id="email"
                  type="email"
                  className="auth-input"
                  placeholder={roleMode === "admin" ? "admin@phishshield.com" : "analyst@phishshield.com"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="auth-input-group">
              <div className="auth-label-row">
                <label htmlFor="password" className="auth-label">
                  Security Password
                </label>
              </div>
              <div className="auth-input-wrapper">
                <Lock className="auth-field-icon" size={18} />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="auth-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="auth-eye-btn"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Dynamic 3rd Field for Administrator Secret Key */}
            {roleMode === "admin" && (
              <div className="auth-input-group animated-fadeIn">
                <div className="auth-label-row">
                  <label htmlFor="adminSecretKey" className="auth-label">
                    Admin Secret Clearance Key
                  </label>
                  <span className="auth-role-tag-badge">Master Code Required</span>
                </div>
                <div className="auth-input-wrapper">
                  <Key className="auth-field-icon" size={18} />
                  <input
                    id="adminSecretKey"
                    type="password"
                    className="auth-input"
                    placeholder="Enter Admin Master Key"
                    value={adminSecretKey}
                    onChange={(e) => setAdminSecretKey(e.target.value)}
                    autoComplete="off"
                    required={roleMode === "admin"}
                  />
                </div>
                <p className="auth-code-hint">
                  Master Code: <code>PHISH_ADMIN_2026</code>
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="auth-submit-btn"
            >
              {isSubmitting ? (
                <span className="auth-loading-spinner">Verifying Credentials...</span>
              ) : (
                <>
                  <span>{roleMode === "admin" ? "Sign In as Administrator" : "Sign In to Terminal"}</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Clear Switch to Register */}
          <div className="auth-footer-nav">
            <p>
              Don't have an account?{" "}
              <Link to="/register" className="auth-link">
                Register New Credentials
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
