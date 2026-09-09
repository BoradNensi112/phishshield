import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Shield, Lock, Mail, User, Briefcase, Eye, EyeOff, 
  ArrowRight, AlertCircle, CheckCircle2, ChevronDown, Check 
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const ROLES = [
  { title: "SOC Security Analyst", desc: "Tier 1/2 Incident Detection & Monitoring" },
  { title: "Threat Intelligence Researcher", desc: "Threat Actor & Campaign Attribution" },
  { title: "Cybersecurity Auditor", desc: "Compliance, Forensics & Risk Inspection" },
  { title: "Incident Response Engineer", desc: "Active Exploitation Containment & Mitigation" },
];

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState(ROLES[0].title);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setRoleDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
                  autoComplete="off"
                  data-lpignore="true"
                  style={{ backgroundColor: "#0e1526", color: "#f8fafc" }}
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
                  autoComplete="off"
                  data-lpignore="true"
                  style={{ backgroundColor: "#0e1526", color: "#f8fafc" }}
                  required
                />
              </div>
            </div>

            {/* Custom Cyber React Dropdown (Completely eliminates native Windows white OS popup) */}
            <div className="auth-input-group" ref={dropdownRef}>
              <label className="auth-label">
                SOC Role & Privilege Level
              </label>
              <div className="custom-dropdown-container">
                <button
                  type="button"
                  id="reg-role-trigger"
                  className={`custom-dropdown-trigger ${roleDropdownOpen ? "open" : ""}`}
                  onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                  aria-haspopup="listbox"
                  aria-expanded={roleDropdownOpen}
                >
                  <div className="custom-dropdown-trigger-content">
                    <Briefcase className="custom-dropdown-icon" size={18} />
                    <span className="custom-dropdown-text">{role}</span>
                  </div>
                  <ChevronDown
                    size={18}
                    className={`custom-dropdown-arrow ${roleDropdownOpen ? "arrow-rotated" : ""}`}
                  />
                </button>

                {roleDropdownOpen && (
                  <div className="custom-dropdown-menu" role="listbox">
                    {ROLES.map((r) => {
                      const isSelected = role === r.title;
                      return (
                        <div
                          key={r.title}
                          className={`custom-dropdown-item ${isSelected ? "item-selected" : ""}`}
                          onClick={() => {
                            setRole(r.title);
                            setRoleDropdownOpen(false);
                          }}
                          role="option"
                          aria-selected={isSelected}
                        >
                          <div className="custom-dropdown-item-details">
                            <span className="custom-dropdown-item-title">{r.title}</span>
                            <span className="custom-dropdown-item-desc">{r.desc}</span>
                          </div>
                          {isSelected && (
                            <Check size={16} className="custom-dropdown-check-icon" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
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
                  data-lpignore="true"
                  style={{ backgroundColor: "#0e1526", color: "#f8fafc" }}
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
                  data-lpignore="true"
                  style={{ backgroundColor: "#0e1526", color: "#f8fafc" }}
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
