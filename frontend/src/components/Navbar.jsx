import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Shield, ShieldAlert, Sun, Moon, Activity, Radar, History, BarChart3, Info, Menu, X, LogIn, UserPlus, LogOut, User, CheckCircle2, Lock } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import apiService from "../services/api";

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const { currentUser, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [apiOnline, setApiOnline] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkApi = async () => {
      try {
        const res = await apiService.getHealth();
        setApiOnline(res.status === "online");
      } catch (err) {
        setApiOnline(false);
      }
    };
    checkApi();
    const interval = setInterval(checkApi, 15000);
    return () => clearInterval(interval);
  }, []);

  // Close mobile drawer on route navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navLinks = [
    { path: "/", label: "Home", icon: <Shield size={18} />, isProtected: false },
    { path: "/scanner", label: "URL Scanner", icon: <Radar size={18} />, isProtected: true },
    { path: "/dashboard", label: "Dashboard", icon: <BarChart3 size={18} />, isProtected: true },
    { path: "/history", label: "Scan History", icon: <History size={18} />, isProtected: true },
    { path: "/model", label: "Model Metrics", icon: <Activity size={18} />, isProtected: true },
    { path: "/about", label: "About", icon: <Info size={18} />, isProtected: false },
  ];

  return (
    <>
      <nav className="cyber-navbar">
        <div className="nav-container">
          <Link to="/" className="nav-brand" onClick={() => setMobileMenuOpen(false)}>
            <div className="logo-shield-wrapper">
              <Shield className="logo-shield-icon" size={28} />
            </div>
            <div className="brand-text-block">
              <span className="brand-title">Phish<span className="brand-accent">Shield</span></span>
              <span className="brand-subtitle">CYBER DEFENSE PLATFORM</span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="nav-links desktop-only">
            {navLinks.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-link-item ${isActive ? "active" : ""}`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.isProtected && !isAuthenticated && (
                    <Lock size={12} className="nav-lock-badge-icon" title="Login Required" />
                  )}
                </Link>
              );
            })}
          </div>

          <div className="nav-actions">
            {/* Desktop Auth Controls */}
            <div className="nav-auth-controls desktop-only">
              {isAuthenticated ? (
                <div className="nav-user-profile-badge">
                  <div className="user-avatar-circle">
                    <User size={15} />
                  </div>
                  <div className="user-info-text">
                    <span className="user-display-name">{currentUser?.name || "Analyst"}</span>
                    <span className="user-role-tag">{currentUser?.role || "SOC Analyst"}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="nav-logout-btn"
                    title="Log Out Terminal"
                    aria-label="Log Out"
                  >
                    <LogOut size={15} />
                  </button>
                </div>
              ) : (
                <div className="nav-guest-actions">
                  <Link
                    to="/login"
                    className={`nav-auth-btn login-btn ${location.pathname === "/login" ? "active" : ""}`}
                  >
                    <LogIn size={15} />
                    <span>Sign In</span>
                  </Link>
                  <Link
                    to="/register"
                    className={`nav-auth-btn register-btn ${location.pathname === "/register" ? "active" : ""}`}
                  >
                    <UserPlus size={15} />
                    <span>Register</span>
                  </Link>
                </div>
              )}
            </div>

            {/* API Health indicator (desktop only) */}
            <div className={`api-status-pill desktop-status-pill ${apiOnline ? "online" : "offline"}`} title={apiOnline ? "FastAPI Backend Connected" : "Connecting to Backend..."}>
              <span className="pulse-dot"></span>
              <span className="status-label">{apiOnline ? "API Online" : "Connecting"}</span>
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="theme-toggle-btn"
              title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? <Sun size={20} className="sun-icon" /> : <Moon size={20} className="moon-icon" />}
            </button>

            {/* Mobile Hamburger Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="mobile-menu-btn"
              title={mobileMenuOpen ? "Close Menu" : "Open Menu"}
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Drawer & Backdrop */}
      {mobileMenuOpen && (
        <div className="mobile-nav-backdrop" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-nav-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-drawer-header">
              <div className="mobile-drawer-brand">
                <Shield className="cyan-text" size={24} />
                <span>PhishShield Navigation</span>
              </div>
              <button 
                className="mobile-drawer-close"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close Menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* Mobile User Profile or Auth Buttons */}
            <div className="mobile-drawer-auth-block">
              {isAuthenticated ? (
                <div className="mobile-user-card">
                  <div className="mobile-user-header">
                    <div className="user-avatar-circle">
                      <User size={18} />
                    </div>
                    <div className="mobile-user-details">
                      <span className="mobile-user-name">{currentUser?.name}</span>
                      <span className="mobile-user-email">{currentUser?.email}</span>
                    </div>
                  </div>
                  <div className="mobile-user-actions">
                    <span className="mobile-user-badge">{currentUser?.role || "SOC Analyst"}</span>
                    <button onClick={handleLogout} className="mobile-logout-btn">
                      <LogOut size={14} />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mobile-auth-buttons">
                  <Link
                    to="/login"
                    className="mobile-auth-btn mobile-login-btn"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LogIn size={16} />
                    <span>Sign In to Terminal</span>
                  </Link>
                  <Link
                    to="/register"
                    className="mobile-auth-btn mobile-register-btn"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <UserPlus size={16} />
                    <span>Register New Account</span>
                  </Link>
                </div>
              )}
            </div>

            <div className="mobile-drawer-links">
              {navLinks.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`mobile-drawer-item ${isActive ? "active" : ""}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="mobile-item-icon">{item.icon}</span>
                    <span className="mobile-item-label">
                      <span>{item.label}</span>
                      {item.isProtected && !isAuthenticated && (
                        <span className="mobile-lock-tag">
                          <Lock size={11} />
                          <span>Locked</span>
                        </span>
                      )}
                    </span>
                  </Link>
                );
              })}
            </div>

            <div className="mobile-drawer-footer">
              <div className={`api-status-pill ${apiOnline ? "online" : "offline"}`}>
                <span className="pulse-dot"></span>
                <span>{apiOnline ? "FastAPI Core Connected" : "Connecting..."}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
