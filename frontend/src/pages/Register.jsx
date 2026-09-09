import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, Lock, Mail, User, Briefcase, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const ROLES = [
  "SOC Security Analyst",
  "Threat Intelligence Researcher",
  "Cybersecurity Auditor",
  "Incident Response Engineer",
];

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState(ROLES[0]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter your analyst full name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid work email address.");
      return;
    }
    if (password.length < 6) {
      setError("Security password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    try {
      setIsSubmitting(true);
      await register(name, email, password, role);
      navigate("/scanner");
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card-wrapper">
        <div className="auth-glow-effect"></div>

        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo-badge">
              <Shield className="auth-logo-icon" size={36} />
            </div>
            <h1 className="auth-title">Analyst Onboarding</h1>
            <p className="auth-subtitle">
              PHISHSHIELD SOC // CREDENTIAL PROVISIONING
            </p>
          </div>

          {error && (
            <div className="auth-error-banner" role="alert">
              <AlertCircle size={18} className="auth-error-icon" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-input-group">
              <label htmlFor="reg-name" className="auth-label">
                Full Name
              </label>
              <div className="auth-input-wrapper">
                <User className="auth-field-icon" size={18} />
                <input
                  id="reg-name"
                  type="text"
                  className="auth-input"
                  placeholder="e.g. Nensi Borad"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  required
                />
              </div>
            </div>

            <div className="auth-input-group">
              <label htmlFor="reg-email" className="auth-label">
                Analyst Work Email
              </label>
              <div className="auth-input-wrapper">
                <Mail className="auth-field-icon" size={18} />
                <input
                  id="reg-email"
                  type="email"
                  className="auth-input"
                  placeholder="analyst@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="auth-input-group">
              <label htmlFor="reg-role" className="auth-label">
                SOC Role & Privilege Level
              </label>
              <div className="auth-input-wrapper">
                <Briefcase className="auth-field-icon" size={18} />
                <select
                  id="reg-role"
                  className="auth-input auth-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="auth-input-group">
              <label htmlFor="reg-password" className="auth-label">
                Security Password (Min 6 chars)
              </label>
              <div className="auth-input-wrapper">
                <Lock className="auth-field-icon" size={18} />
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  className="auth-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
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

            <div className="auth-input-group">
              <label htmlFor="reg-confirm-password" className="auth-label">
                Confirm Security Password
              </label>
              <div className="auth-input-wrapper">
                <Lock className="auth-field-icon" size={18} />
                <input
                  id="reg-confirm-password"
                  type={showPassword ? "text" : "password"}
                  className="auth-input"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="auth-submit-btn"
            >
              {isSubmitting ? (
                <span className="auth-loading-spinner">Provisioning Credentials...</span>
              ) : (
                <>
                  <span>Create Account & Enter SOC</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="auth-footer-nav">
            <p>
              Already registered?{" "}
              <Link to="/login" className="auth-link">
                Sign In to Terminal
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
