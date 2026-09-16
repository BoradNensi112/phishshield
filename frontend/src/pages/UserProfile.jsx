import React, { useState, useEffect } from "react";
import { 
  User, Shield, ShieldCheck, ShieldAlert, Key, Lock, 
  Calendar, CheckCircle2, AlertTriangle, RefreshCw, Save, Activity
} from "lucide-react";
import apiService from "../services/api";
import { useAuth } from "../context/AuthContext";

const UserProfile = () => {
  const { currentUser, login } = useAuth();

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
    if (!isoStr) return "Jan 2026";
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="history-page-container">
      {/* Header */}
      <div className="page-header flex-header">
        <div>
          <div className="header-badge">SECURITY OPERATIONS CLEARANCE</div>
          <h2>Analyst Identity & Settings</h2>
          <p>Manage your SOC credentials, personal profile, and review your forensic detection metrics.</p>
        </div>

        <button onClick={loadProfile} className="cyber-btn-secondary btn-sm" title="Refresh Profile">
          <RefreshCw size={15} className={loading ? "spin-icon" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* User Identity Banner Card */}
      <div className="glass-card" style={{ padding: "24px", marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
          <div style={{
            width: "68px",
            height: "68px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, var(--cyan, #00f0ff), #38bdf8)",
            color: "#070b14",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.75rem",
            fontWeight: "800",
            boxShadow: "0 0 20px rgba(0, 240, 255, 0.35)",
            flexShrink: 0
          }}>
            {(profileData?.name || currentUser?.name || "A")[0].toUpperCase()}
          </div>

          <div style={{ flex: 1, minWidth: "220px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "6px" }}>
              <h3 style={{ margin: 0, fontSize: "1.35rem", fontWeight: "700" }}>
                {profileData?.name || currentUser?.name || "Analyst"}
              </h3>
              <span className="badge badge-safe" style={{ fontSize: "0.75rem" }}>
                <ShieldCheck size={12} /> {profileData?.role || currentUser?.role || "SOC Security Analyst"}
              </span>
              <span className="badge" style={{ 
                background: "rgba(16, 185, 129, 0.12)", 
                color: "#10b981", 
                border: "1px solid rgba(16, 185, 129, 0.3)", 
                fontSize: "0.72rem" 
              }}>
                ● Active Clearance
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "18px", color: "var(--text-secondary)", fontSize: "0.86rem", flexWrap: "wrap" }}>
              <span>Work Email: <strong style={{ color: "var(--text-primary)" }}>{profileData?.email || currentUser?.email}</strong></span>
              <span>•</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                <Calendar size={14} /> Registered: {formatDate(profileData?.created_at)}
              </span>
              <span>•</span>
              <span>Storage: <strong style={{ color: "#38bdf8" }}>SQLite ACID Database</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Telemetry KPI Cards */}
      <div className="daily-stats-grid" style={{ marginBottom: "28px" }}>
        <div className="daily-stat-card glass-card">
          <div className="daily-stat-icon-wrap icon-blue">
            <Activity size={20} />
          </div>
          <div>
            <div className="daily-stat-label">Personal Scans</div>
            <div className="daily-stat-val">{stats.total_scans}</div>
          </div>
        </div>

        <div className="daily-stat-card glass-card">
          <div className="daily-stat-icon-wrap icon-red">
            <ShieldAlert size={20} />
          </div>
          <div>
            <div className="daily-stat-label">Malicious Threats</div>
            <div className="daily-stat-val danger-text">{stats.phishing_count}</div>
          </div>
        </div>

        <div className="daily-stat-card glass-card">
          <div className="daily-stat-icon-wrap icon-green">
            <ShieldCheck size={20} />
          </div>
          <div>
            <div className="daily-stat-label">Verified Safe URLs</div>
            <div className="daily-stat-val success-text">{stats.safe_count}</div>
          </div>
        </div>

        <div className="daily-stat-card glass-card">
          <div className="daily-stat-icon-wrap" style={{ background: "rgba(245, 158, 11, 0.12)", color: "#f59e0b" }}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <div className="daily-stat-label">High Risk Detections</div>
            <div className="daily-stat-val" style={{ color: "#f59e0b" }}>{stats.high_risk_count}</div>
          </div>
        </div>
      </div>

      {/* Settings Forms Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
        {/* Card 1: Update Profile Name */}
        <div className="glass-card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <User className="cyan-text" size={20} />
            <h4 style={{ margin: 0, fontSize: "1.1rem" }}>Personal Information</h4>
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "20px" }}>
            Update your operational analyst display name as shown on forensic reports and telemetry.
          </p>

          {nameNotice && (
            <div className={`auth-alert ${nameNotice.type === "error" ? "auth-alert-error" : "auth-alert-success"}`} style={{ marginBottom: "16px" }}>
              {nameNotice.type === "error" ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
              <span>{nameNotice.msg}</span>
            </div>
          )}

          <form onSubmit={handleUpdateName}>
            <div className="auth-field" style={{ marginBottom: "16px" }}>
              <label className="auth-label">Analyst Display Name</label>
              <div className="auth-input-wrapper">
                <User className="auth-input-icon" size={18} />
                <input
                  type="text"
                  className="auth-input"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Enter full name..."
                  required
                />
              </div>
            </div>

            <div className="auth-field" style={{ marginBottom: "24px" }}>
              <label className="auth-label">Assigned SOC Email</label>
              <div className="auth-input-wrapper" style={{ opacity: 0.7 }}>
                <input
                  type="email"
                  className="auth-input"
                  value={profileData?.email || currentUser?.email || ""}
                  disabled
                />
              </div>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
                Work email address is cryptographically bound to your clearance profile.
              </span>
            </div>

            <button
              type="submit"
              disabled={isUpdatingName}
              className="cyber-btn-primary"
              style={{ width: "100%" }}
            >
              <Save size={16} />
              <span>{isUpdatingName ? "Saving Changes..." : "Save Profile Details"}</span>
            </button>
          </form>
        </div>

        {/* Card 2: Change Password */}
        <div className="glass-card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
            <Key className="cyan-text" size={20} />
            <h4 style={{ margin: 0, fontSize: "1.1rem" }}>Security & Credentials</h4>
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "20px" }}>
            Update your account password. Passwords are encrypted using PBKDF2-HMAC-SHA256 (100,000 iterations).
          </p>

          {passNotice && (
            <div className={`auth-alert ${passNotice.type === "error" ? "auth-alert-error" : "auth-alert-success"}`} style={{ marginBottom: "16px" }}>
              {passNotice.type === "error" ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
              <span>{passNotice.msg}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword}>
            <div className="auth-field" style={{ marginBottom: "14px" }}>
              <label className="auth-label">Current Password</label>
              <div className="auth-input-wrapper">
                <Lock className="auth-input-icon" size={18} />
                <input
                  type="password"
                  className="auth-input"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password..."
                  required
                />
              </div>
            </div>

            <div className="auth-field" style={{ marginBottom: "14px" }}>
              <label className="auth-label">New Password</label>
              <div className="auth-input-wrapper">
                <Key className="auth-input-icon" size={18} />
                <input
                  type="password"
                  className="auth-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters..."
                  required
                />
              </div>
            </div>

            <div className="auth-field" style={{ marginBottom: "24px" }}>
              <label className="auth-label">Confirm New Password</label>
              <div className="auth-input-wrapper">
                <Key className="auth-input-icon" size={18} />
                <input
                  type="password"
                  className="auth-input"
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
              style={{ width: "100%", borderColor: "var(--cyan)" }}
            >
              <Lock size={16} className="cyan-text" />
              <span>{isChangingPass ? "Encrypting & Updating..." : "Update Security Password"}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
