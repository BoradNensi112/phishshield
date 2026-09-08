import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Shield, ShieldAlert, Sun, Moon, Activity, Radar, History, BarChart3, Info, Menu, X } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import apiService from "../services/api";

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
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

  const navLinks = [
    { path: "/", label: "Home", icon: <Shield size={18} /> },
    { path: "/scanner", label: "URL Scanner", icon: <Radar size={18} /> },
    { path: "/dashboard", label: "Dashboard", icon: <BarChart3 size={18} /> },
    { path: "/history", label: "Scan History", icon: <History size={18} /> },
    { path: "/model", label: "Model Metrics", icon: <Activity size={18} /> },
    { path: "/about", label: "About", icon: <Info size={18} /> },
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
                </Link>
              );
            })}
          </div>

          <div className="nav-actions">
            {/* API Health indicator */}
            <div className={`api-status-pill ${apiOnline ? "online" : "offline"}`} title={apiOnline ? "FastAPI Backend Connected" : "Connecting to Backend..."}>
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
                    <span className="mobile-item-label">{item.label}</span>
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
