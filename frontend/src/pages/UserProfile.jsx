import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  User, Shield, ShieldCheck, ShieldAlert, Key, Lock, 
  Calendar, CheckCircle2, AlertTriangle, RefreshCw, Save, Activity,
  Database, Radar, History, ArrowRight, Check, Info, Mail
} from "lucide-react";
import apiService from "../services/api";
import { useAuth } from "../context/AuthContext";

const UserProfile = () => {
  const { currentUser } = useAuth();

  const [profileData, setProfileData] = useState(null);
  const [stats, setStats] = useState({
    total_scans: 0,
    phishing_count: 0,
    safe_count: 0,
    high_risk_count: 0
  });
  const [loading, setLoading] = useState(true);

  // Name Update Form
  const [nameInput, setNameInput] = useState("");
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [nameNotice, setNameNotice] = useState(null);

  // Password Change Form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passNotice, setPassNotice] = useState(null);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await apiService.getUserProfile();
      if (data && data.user) {
        setProfileData(data.user);
        setNameInput(data.user.name || "");
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.warn("Could not fetch remote profile, using session info:", err);
      if (currentUser) {
        setProfileData(currentUser);
        setNameInput(currentUser.name || "");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [currentUser]);

  const handleUpdateName = async (e) => {
    e.preventDefault();
    if (!nameInput.trim() || nameInput.trim().length < 2) {
      setNameNotice({ type: "error", msg: "Name must be at least 2 characters long." });
      return;
    }

    try {
      setIsUpdatingName(true);
      setNameNotice(null);
      await apiService.updateUserProfile({ name: nameInput.trim() });
      setNameNotice({ type: "success", msg: "Analyst name updated successfully in database!" });
      
      // Update local storage user profile
      try {
        const stored = JSON.parse(localStorage.getItem("phishshield_user") || "{}");
        stored.name = nameInput.trim();
        localStorage.setItem("phishshield_user", JSON.stringify(stored));
      } catch (e) {}

      setTimeout(() => setNameNotice(null), 4000);
    } catch (err) {
      setNameNotice({ 
        type: "error", 
        msg: err.response?.data?.detail || "Failed to update analyst name." 
      });
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassNotice(null);

    if (!currentPassword) {
      setPassNotice({ type: "error", msg: "Please enter your current password." });
      return;
    }
    if (newPassword.length < 6) {
      setPassNotice({ type: "error", msg: "New security password must be at least 6 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassNotice({ type: "error", msg: "New passwords do not match. Please re-enter." });
      return;
    }

    try {
      setIsChangingPass(true);
      await apiService.changePassword({
        current_password: currentPassword,
        new_password: newPassword
      });
      setPassNotice({ type: "success", msg: "Password updated successfully with PBKDF2 encryption!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPassNotice(null), 4500);
    } catch (err) {
      setPassNotice({
        type: "error",
        msg: err.response?.data?.detail || "Failed to change password. Ensure current password is correct."
      });
    } finally {
      setIsChangingPass(false);
    }
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return "Sept 2026";
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return isoStr;
    }
  };

  const displayName = profileData?.name || currentUser?.name || "Analyst";
  const displayEmail = profileData?.email || currentUser?.email || "analyst@phishshield.com";
  const displayRole = profileData?.role || currentUser?.role || "SOC Security Analyst";
  const userInitial = displayName.charAt(0).toUpperCase();

  return (
    <div className="profile-page-container">
      {/* Header */}
      <div className="page-header flex-header">
        <div>
          <div className="header-badge">SECURITY OPERATIONS CLEARANCE</div>
          <h2>Analyst Identity & Settings</h2>
          <p>Manage your SOC credentials, personal profile details, and review your threat forensics activity.</p>
        </div>

        <button onClick={loadProfile} className="cyber-btn-secondary btn-sm" title="Refresh Profile">
          <RefreshCw size={15} className={loading ? "spin-icon" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* User Identity Banner Card */}
      <div className="profile-identity-card glass-card">
        <div className="profile-identity-layout">
          <div className="profile-avatar-box">
            {userInitial}
          </div>

          <div className="profile-info-block">
            <div className="profile-name-row">
              <h3 className="profile-display-title">{displayName}</h3>
              <span className="profile-role-badge">
                <ShieldCheck size={13} /> {displayRole}
              </span>
              <span className="profile-status-badge">
                ● Active Clearance
              </span>
            </div>

            <div className="profile-meta-row">
              <span className="profile-meta-item">
                <Mail size={14} className="text-sage" />
                <span>Work Email: <strong>{displayEmail}</strong></span>
              </span>
              <span>•</span>
              <span className="profile-meta-item">
                <Calendar size={14} className="text-sage" />
                <span>Member Since: <strong>{formatDate(profileData?.created_at)}</strong></span>
              </span>
              <span>•</span>
              <span className="profile-meta-item">
                <Database size={14} className="text-sage" />
                <span>Persistence: <strong>SQLite ACID Engine</strong></span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Forensic KPI Cards */}
      <div className="profile-stats-grid">
        <div className="profile-stat-card glass-card">
          <div className="profile-stat-icon icon-sage">
            <Activity size={22} />
          </div>
          <div className="profile-stat-content">
            <span className="profile-stat-label">Personal Scans</span>
            <span className="profile-stat-value">{stats.total_scans}</span>
          </div>
        </div>

        <div className="profile-stat-card glass-card">
          <div className="profile-stat-icon icon-terracotta">
            <ShieldAlert size={22} />
          </div>
          <div className="profile-stat-content">
            <span className="profile-stat-label">Malicious Threats</span>
            <span className="profile-stat-value danger">{stats.phishing_count}</span>
          </div>
        </div>

        <div className="profile-stat-card glass-card">
          <div className="profile-stat-icon icon-safe">
            <ShieldCheck size={22} />
          </div>
          <div className="profile-stat-content">
            <span className="profile-stat-label">Safe URLs Verified</span>
            <span className="profile-stat-value success">{stats.safe_count}</span>
          </div>
        </div>

        <div className="profile-stat-card glass-card">
          <div className="profile-stat-icon icon-warn">
            <AlertTriangle size={22} />
          </div>
          <div className="profile-stat-content">
            <span className="profile-stat-label">High-Risk Alerts</span>
            <span className="profile-stat-value warn">{stats.high_risk_count}</span>
          </div>
        </div>
      </div>

      {/* Settings Forms Grid */}
      <div className="profile-forms-grid">
        {/* Card 1: Update Profile Name */}
        <div className="profile-form-card glass-card">
          <div className="profile-form-header">
            <User className="text-sage" size={20} />
            <h4>Personal Information</h4>
          </div>
          <p className="profile-form-desc">
            Update your operational analyst display name as shown on forensic reports and telemetry.
          </p>

          {nameNotice && (
            <div className={`admin-notice-banner ${nameNotice.type === "success" ? "admin-notice-success" : "admin-notice-error"}`} style={{ marginBottom: "16px" }}>
              {nameNotice.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              <span>{nameNotice.msg}</span>
            </div>
          )}

          <form onSubmit={handleUpdateName}>
            <div className="profile-input-group">
              <label>Analyst Display Name:</label>
              <div className="profile-input-wrapper">
                <User className="profile-input-icon" size={17} />
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Enter full name..."
                  required
                />
              </div>
            </div>

            <div className="profile-input-group">
              <label>Assigned SOC Email:</label>
              <div className="profile-input-wrapper">
                <Mail className="profile-input-icon" size={17} />
                <input
                  type="email"
                  value={displayEmail}
                  disabled
                />
              </div>
              <span className="profile-input-hint">
                Work email address is cryptographically bound to your clearance profile.
              </span>
            </div>

            <button
              type="submit"
              disabled={isUpdatingName}
              className="cyber-btn-primary"
              style={{ width: "100%", marginTop: "10px", justifyContent: "center" }}
            >
              <Save size={16} />
              <span>{isUpdatingName ? "Saving Changes..." : "Save Profile Details"}</span>
            </button>
          </form>
        </div>

        {/* Card 2: Change Password */}
        <div className="profile-form-card glass-card">
          <div className="profile-form-header">
            <Key className="text-sage" size={20} />
            <h4>Security & Password</h4>
          </div>
          <p className="profile-form-desc">
            Update your access password. Credentials are encrypted using PBKDF2-HMAC-SHA256 (100,000 iterations).
          </p>

          {passNotice && (
            <div className={`admin-notice-banner ${passNotice.type === "success" ? "admin-notice-success" : "admin-notice-error"}`} style={{ marginBottom: "16px" }}>
              {passNotice.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              <span>{passNotice.msg}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword}>
            <div className="profile-input-group">
              <label>Current Password:</label>
              <div className="profile-input-wrapper">
                <Lock className="profile-input-icon" size={17} />
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password..."
                  required
                />
              </div>
            </div>

            <div className="profile-input-group">
              <label>New Password:</label>
              <div className="profile-input-wrapper">
                <Key className="profile-input-icon" size={17} />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters..."
                  required
                />
              </div>
            </div>

            <div className="profile-input-group">
              <label>Confirm New Password:</label>
              <div className="profile-input-wrapper">
                <Key className="profile-input-icon" size={17} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password..."
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isChangingPass}
              className="cyber-btn-secondary"
              style={{ width: "100%", marginTop: "10px", justifyContent: "center" }}
            >
              <Lock size={16} className="text-sage" />
              <span>{isChangingPass ? "Encrypting & Updating..." : "Update Security Password"}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Security & Privacy Assurance Banner */}
      <div className="profile-security-banner glass-card">
        <div className="security-banner-content">
          <div className="security-shield-icon-wrap">
            <ShieldCheck size={26} />
          </div>
          <div className="security-banner-text">
            <h4>Isolated Security Operations & User Data Privacy</h4>
            <p>
              Your personal scan history is isolated to your profile. All database operations strictly adhere to role-based access control (RBAC).
            </p>
          </div>
        </div>

        <div className="security-banner-actions">
          <Link to="/history" className="about-pill-link">
            <History size={15} />
            <span>My Scan History</span>
          </Link>
          <Link to="/scanner" className="about-pill-link primary">
            <Radar size={15} />
            <span>Launch URL Scanner</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;

