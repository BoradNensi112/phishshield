import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Shield, ShieldAlert, Sun, Moon, Activity, Radar, History, BarChart3, Info, Menu, X, LogIn, UserPlus, LogOut, User, CheckCircle2, Lock } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import apiService from "../services/api";

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const { currentUser, isAuthenticated, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [apiOnline, setApiOnline] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const headerRef = useRef(null);

  // Measure and set exact header height dynamically
  useEffect(() => {
    const updateHeight = () => {
      if (headerRef.current) {
        document.documentElement.style.setProperty(
          "--tactile-header-height",
          `${headerRef.current.offsetHeight}px`
        );
      }
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, [isAuthenticated, location.pathname, isAdmin]);

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
    { path: "/scanner", label: "URL Scanner", icon: <Radar size={17} />, isProtected: true },
    { path: "/dashboard", label: "Dashboard", icon: <BarChart3 size={17} />, isProtected: true },
    { path: "/history", label: "Scan History", icon: <History size={17} />, isProtected: true },
    { path: "/model", label: "Model Metrics", icon: <Activity size={17} />, isProtected: true },
    ...(isAdmin ? [{ path: "/admin", label: "Admin Console", icon: <ShieldAlert size={17} />, isProtected: true }] : []),
    { path: "/profile", label: "My Profile", icon: <User size={17} />, isProtected: true },
    { path: "/about", label: "About Guide", icon: <Info size={17} />, isProtected: false },
  ];

  return (
    <>
      <header className="tactile-header-wrapper" ref={headerRef}>
        {/* Tier 1: Brand & User Profile / Status Controls */}
        <div className="header-top-tier">
          <div className="top-tier-container">
            {/* Left: Brand Identity */}
            <Link to={isAuthenticated ? "/scanner" : "/login"} className="tactile-brand-block" onClick={() => setMobileMenuOpen(false)}>
              <div className="tactile-logo-badge">
                <Shield className="tactile-shield-icon" size={24} />
              </div>
              <div className="brand-text-block">
                <span className="brand-title">Phish<span className="brand-accent">Shield</span></span>
                <span className="brand-subtitle">CYBER DEFENSE PLATFORM</span>
              </div>
            </Link>

            {/* Right: Status & User Controls */}
            <div className="top-tier-actions">
              {/* API Health indicator */}
              <div className={`api-status-pill desktop-only ${apiOnline ? "online" : "offline"}`} title={apiOnline ? "FastAPI Backend Online" : "Connecting..."}>
                <span className="pulse-dot"></span>
                <span className="status-label">{apiOnline ? "API Online" : "Connecting"}</span>
              </div>

              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="tactile-theme-btn"
                title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
                aria-label="Toggle Theme"
              >
                {theme === "dark" ? <Sun size={18} className="sun-icon" /> : <Moon size={18} className="moon-icon" />}
              </button>

              {/* Desktop Auth Controls */}
              <div className="desktop-only">
                {isAuthenticated ? (
                  <div className="tactile-user-pill">
                    <Link to="/profile" className="tactile-profile-link" title="Open Analyst Profile">
                      <div className="user-avatar-circle">
                        <User size={15} />
                      </div>
                      <div className="user-info-text">
                        <span className="user-display-name">{currentUser?.name || "Analyst"}</span>
                        <span className="user-role-tag">{currentUser?.role || (isAdmin ? "SOC Administrator" : "SOC Analyst")}</span>
                      </div>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="tactile-logout-btn"
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
                      className={`tactile-auth-btn login-btn ${location.pathname === "/login" ? "active" : ""}`}
                    >
                      <LogIn size={15} />
                      <span>Sign In</span>
                    </Link>
                    <Link
                      to="/register"
                      className={`tactile-auth-btn register-btn ${location.pathname === "/register" ? "active" : ""}`}
                    >
                      <UserPlus size={15} />
                      <span>Register</span>
                    </Link>
                  </div>
                )}
              </div>

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
        </div>

        {/* Tier 2: Dedicated Spacious Navigation Command Bar */}
        {isAuthenticated && (
          <nav className="header-nav-tier desktop-only">
            <div className="nav-tier-container">
              <div className="tactile-nav-strip">
                {navLinks.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`tactile-nav-item ${isActive ? "active" : ""}`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </nav>
        )}
      </header>
      {/* Structural spacer matching fixed header height */}
      <div 
        className={`tactile-header-spacer ${isAuthenticated ? "has-subtier" : "no-subtier"}`} 
        aria-hidden="true" 
      />

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
                  <Link 
                    to="/profile" 
                    className="mobile-user-header" 
                    onClick={() => setMobileMenuOpen(false)}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <div className="user-avatar-circle">
                      <User size={18} />
                    </div>
                    <div className="mobile-user-details">
                      <span className="mobile-user-name">{currentUser?.name}</span>
                      <span className="mobile-user-email">{currentUser?.email}</span>
                    </div>
                  </Link>
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
