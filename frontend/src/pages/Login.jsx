import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Shield, Lock, Mail, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2, Zap, ShieldCheck, ShieldAlert } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, quickDemoLogin, isAuthenticated, currentUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectMessage = location.state?.message;
  const redirectPath = location.state?.from?.pathname || "/scanner";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please provide both email and password.");
      return;
    }

    try {
      setIsSubmitting(true);
      await login(email, password);
      navigate(redirectPath);
    } catch (err) {
      setError(err.message || "Authentication failed. Check credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = () => {
    quickDemoLogin("Lead SOC Analyst");
    navigate(redirectPath);
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card-wrapper">
        {/* Glow ambient background element */}
        <div className="auth-glow-effect"></div>

        <div className="auth-card">
          {/* Header */}
          <div className="auth-header">
            <div className="auth-logo-badge">
              <Shield className="auth-logo-icon" size={36} />
            </div>
            <h1 className="auth-title">SOC Access Control</h1>
            <p className="auth-subtitle">
              CYBER DEFENSE OPERATIONS // SECURE AUTHENTICATION
            </p>
          </div>

          {/* Redirect Notice if user was redirected from a protected route */}
          {redirectMessage && (
            <div className="auth-notice-banner" role="status">
              <ShieldAlert size={18} className="auth-notice-icon" />
              <span>{redirectMessage}</span>
            </div>
          )}

          {/* Quick Demo Access banner (Super helpful for Viva/Examiner testing) */}
          <div className="demo-login-box">
            <div className="demo-box-header">
              <Zap size={16} className="demo-zap-icon" />
              <span>Instant Presentation Access</span>
            </div>
            <p className="demo-box-text">
              Testing or evaluating? Tap below to bypass credential entry with pre-configured Lead SOC Analyst privileges.
            </p>
            <button
              type="button"
              onClick={handleDemoLogin}
              className="demo-login-btn"
            >
              <ShieldCheck size={18} />
              <span>1-Click Sign In as Lead Analyst</span>
            </button>
          </div>

          <div className="auth-divider">
            <span>OR MANUAL CREDENTIALS</span>
          </div>

          {/* Error Alert */}
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
                Analyst Work Email
              </label>
              <div className="auth-input-wrapper">
                <Mail className="auth-field-icon" size={18} />
                <input
                  id="email"
                  type="email"
                  className="auth-input"
                  placeholder="analyst@phishshield.com"
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
                  Access Password
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

            <button
              type="submit"
              disabled={isSubmitting}
              className="auth-submit-btn"
            >
              {isSubmitting ? (
                <span className="auth-loading-spinner">Verifying Credentials...</span>
              ) : (
                <>
                  <span>Authenticate & Open Terminal</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Switch to Register */}
          <div className="auth-footer-nav">
            <p>
              Don't have an analyst account?{" "}
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
