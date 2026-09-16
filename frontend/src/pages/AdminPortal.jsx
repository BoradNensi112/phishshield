import React, { useState, useEffect } from "react";
import { 
  Users, Shield, ShieldCheck, ShieldAlert, Activity, Search, 
  Trash2, UserX, UserCheck, RefreshCw, Download, Filter, 
  CheckCircle2, AlertTriangle, Database, Lock, Clock, Calendar, Globe,
  UserPlus, Key, X, Check, Eye, Mail, User, MessageSquare
} from "lucide-react";
import apiService from "../services/api";
import { useAuth } from "../context/AuthContext";

const ROLES = [
  "SOC Security Analyst",
  "Lead SOC Analyst",
  "Threat Intelligence Lead",
  "Incident Response Specialist",
  "SOC Administrator"
];

const AdminPortal = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState("users"); // 'users' | 'scans' | 'support' | 'system'
  
  // User Management State
  const [users, setUsers] = useState([]);
  const [userLoading, setUserLoading] = useState(true);
  const [userSearch, setUserSearch] = useState("");
  const [actionNotice, setActionNotice] = useState(null);

  // Add User Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState(ROLES[0]);
  const [isSubmittingNewUser, setIsSubmittingNewUser] = useState(false);

  // Reset Password Modal State
  const [resetTargetUser, setResetTargetUser] = useState(null);
  const [newResetPassword, setNewResetPassword] = useState("");
  const [isSubmittingReset, setIsSubmittingReset] = useState(false);

  // Global Scans State
  const [scans, setScans] = useState([]);
  const [scanLoading, setScanLoading] = useState(true);
  const [scanSearch, setScanSearch] = useState("");
  const [analystFilter, setAnalystFilter] = useState("all");
  const [verdictFilter, setVerdictFilter] = useState("all");

  // Support Inquiries State
  const [supportMessages, setSupportMessages] = useState([]);
  const [supportLoading, setSupportLoading] = useState(false);

  const showNotice = (msg, type = "success") => {
    setActionNotice({ msg, type });
    setTimeout(() => setActionNotice(null), 4500);
  };

  // Fetch Users
  const loadUsers = async () => {
    setUserLoading(true);
    try {
      const data = await apiService.getAdminUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load users:", err);
      // Local fallback
      try {
        const local = JSON.parse(localStorage.getItem("phishshield_registered_users") || "{}");
        const list = Object.values(local).map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role || "SOC Security Analyst",
          status: u.status || "active",
          created_at: u.created_at || "2026-01-01T00:00:00Z",
          total_scans: 0,
          total_threats: 0
        }));
        setUsers(list);
      } catch (e) {
        console.error(e);
      }
    } finally {
      setUserLoading(false);
    }
  };

  // Fetch Global Scans
  const loadScans = async () => {
    setScanLoading(true);
    try {
      const data = await apiService.getAdminScans();
      setScans(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load admin scans:", err);
      const local = JSON.parse(localStorage.getItem("phishshield_history") || "[]");
      setScans(local);
    } finally {
      setScanLoading(false);
    }
  };

  // Fetch Support Inquiries
  const loadSupportMessages = async () => {
    setSupportLoading(true);
    try {
      const data = await apiService.getAdminSupportMessages();
      setSupportMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load support messages:", err);
    } finally {
      setSupportLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    loadScans();
    loadSupportMessages();
  }, []);

  // Create User
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim() || !newPassword) {
      showNotice("All fields are required.", "error");
      return;
    }
    if (newPassword.length < 6) {
      showNotice("Password must be at least 6 characters.", "error");
      return;
    }

    try {
      setIsSubmittingNewUser(true);
      await apiService.createAdminUser({
        name: newName.trim(),
        email: newEmail.trim().toLowerCase(),
        password: newPassword,
        role: newRole,
        status: "active"
      });
      showNotice(`Analyst account "${newEmail}" created successfully.`);
      setShowAddModal(false);
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      await loadUsers();
    } catch (err) {
      showNotice(err.response?.data?.detail || "Failed to create user.", "error");
    } finally {
      setIsSubmittingNewUser(false);
    }
  };

  // Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newResetPassword || newResetPassword.length < 6) {
      showNotice("New password must be at least 6 characters.", "error");
      return;
    }

    try {
      setIsSubmittingReset(true);
      await apiService.resetUserPassword(resetTargetUser.email, newResetPassword);
      showNotice(`Password for ${resetTargetUser.email} has been updated.`);
      setResetTargetUser(null);
      setNewResetPassword("");
    } catch (err) {
      showNotice(err.response?.data?.detail || "Failed to reset password.", "error");
    } finally {
      setIsSubmittingReset(false);
    }
  };

  // Update Role
  const handleRoleChange = async (email, newRole) => {
    try {
      await apiService.updateUserRole(email, newRole);
      showNotice(`Updated privilege for ${email} to "${newRole}".`);
      setUsers(prev => prev.map(u => u.email === email ? { ...u, role: newRole } : u));
    } catch (err) {
      showNotice(err.response?.data?.detail || "Failed to update role.", "error");
    }
  };

  // Toggle Suspend / Active Status
  const handleToggleStatus = async (email, currentStatus) => {
    const nextStatus = currentStatus === "active" ? "suspended" : "active";
    if (email === "admin@phishshield.com") {
      showNotice("Root system administrator cannot be suspended.", "error");
      return;
    }

    try {
      await apiService.updateUserStatus(email, nextStatus);
      showNotice(`Account ${email} is now ${nextStatus.toUpperCase()}.`);
      setUsers(prev => prev.map(u => u.email === email ? { ...u, status: nextStatus } : u));
    } catch (err) {
      showNotice(err.response?.data?.detail || "Failed to update account status.", "error");
    }
  };

  // Delete User
  const handleDeleteUser = async (email) => {
    if (email === "admin@phishshield.com") {
      showNotice("Cannot delete root system administrator.", "error");
      return;
    }
    if (!window.confirm(`Are you sure you want to permanently remove analyst profile ${email}?`)) {
      return;
    }

    try {
      await apiService.deleteUser(email);
      showNotice(`Analyst account ${email} removed successfully.`);
      setUsers(prev => prev.filter(u => u.email !== email));
    } catch (err) {
      showNotice(err.response?.data?.detail || "Failed to delete analyst account.", "error");
    }
  };

  // Clear Global Scans
  const handleClearGlobalScans = async () => {
    if (scans.length === 0) return;
    if (!window.confirm("Are you sure you want to purge all global scan records? This action cannot be undone.")) {
      return;
    }
    try {
      await apiService.clearAdminScans();
      setScans([]);
      showNotice("All organization-wide threat scan logs have been purged.");
    } catch (err) {
      showNotice("Failed to clear global scans.", "error");
    }
  };

  // Filtered Users
  const filteredUsers = users.filter(u => {
    const match = 
      (u.name || "").toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.role || "").toLowerCase().includes(userSearch.toLowerCase());
    return match;
  });

  // Filtered Global Scans
  const filteredScans = scans.filter(s => {
    const matchSearch = 
      (s.url || "").toLowerCase().includes(scanSearch.toLowerCase()) ||
      (s.user_email || "").toLowerCase().includes(scanSearch.toLowerCase());

    const matchAnalyst = 
      analystFilter === "all" || 
      (s.user_email || "").toLowerCase() === analystFilter.toLowerCase();

    const matchVerdict = 
      verdictFilter === "all" || 
      (verdictFilter === "Phishing" && s.prediction === "Phishing") ||
      (verdictFilter === "Legitimate" && s.prediction === "Legitimate");

    return matchSearch && matchAnalyst && matchVerdict;
  });

  // Export Global Scans to CSV
  const handleExportGlobalScans = () => {
    if (filteredScans.length === 0) return;
    const headers = ["Scan ID", "Analyst Email", "URL", "Prediction", "Confidence", "Risk Level", "Timestamp"];
    const rows = filteredScans.map(s => [
      s.id,
      `"${s.user_email || "anonymous"}"`,
      `"${(s.url || "").replace(/"/g, '""')}"`,
      s.prediction,
      s.confidence,
      s.risk_level,
      `"${s.timestamp}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `phishshield_global_scans_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Format Date
  const formatDate = (iso) => {
    if (!iso) return "N/A";
    try {
      return new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="admin-portal-container">
      {/* Page Header */}
      <div className="page-header flex-header">
        <div>
          <div className="admin-badge-banner">
            <Shield size={13} /> SOC ROOT ADMINISTRATOR CONSOLE
          </div>
          <h2>Enterprise Access & Governance Hub</h2>
          <p>
            Centralized SOC control: Provision new analysts, govern access privileges, suspend compromised profiles, reset passwords, and audit forensic telemetry.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            onClick={() => setShowAddModal(true)}
            className="cyber-btn-primary btn-sm"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <UserPlus size={16} />
            <span>+ Add New Analyst</span>
          </button>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionNotice && (
        <div 
          className={`admin-notice-banner ${
            actionNotice.type === "error" ? "admin-notice-error" : "admin-notice-success"
          }`}
        >
          {actionNotice.type === "error" ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
          <span>{actionNotice.msg}</span>
        </div>
      )}

      {/* Admin KPI Summary Cards */}
      <div className="daily-stats-grid">
        <div className="daily-stat-card glass-card">
          <div className="daily-stat-icon-wrap icon-purple">
            <Users size={20} />
          </div>
          <div>
            <div className="daily-stat-label">Total Analysts</div>
            <div className="daily-stat-val">{users.length}</div>
          </div>
        </div>

        <div className="daily-stat-card glass-card">
          <div className="daily-stat-icon-wrap icon-green">
            <UserCheck size={20} />
          </div>
          <div>
            <div className="daily-stat-label">Active SOC Accounts</div>
            <div className="daily-stat-val success-text">
              {users.filter(u => u.status !== "suspended").length}
            </div>
          </div>
        </div>

        <div className="daily-stat-card glass-card">
          <div className="daily-stat-icon-wrap icon-red">
            <UserX size={20} />
          </div>
          <div>
            <div className="daily-stat-label">Suspended Accounts</div>
            <div className="daily-stat-val danger-text">
              {users.filter(u => u.status === "suspended").length}
            </div>
          </div>
        </div>

        <div className="daily-stat-card glass-card">
          <div className="daily-stat-icon-wrap icon-blue">
            <Activity size={20} />
          </div>
          <div>
            <div className="daily-stat-label">Total Scans Audited</div>
            <div className="daily-stat-val mono">{scans.length}</div>
          </div>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="admin-tabs-nav">
        <button
          className={`admin-tab-nav-btn ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          <Users size={16} /> Analyst Management ({users.length})
        </button>

        <button
          className={`admin-tab-nav-btn ${activeTab === "scans" ? "active" : ""}`}
          onClick={() => setActiveTab("scans")}
        >
          <Globe size={16} /> Global Scan Audit ({scans.length})
        </button>

        <button
          className={`admin-tab-nav-btn ${activeTab === "support" ? "active" : ""}`}
          onClick={() => setActiveTab("support")}
        >
          <Mail size={16} /> User Inquiries & Support ({supportMessages.length})
        </button>

        <button
          className={`admin-tab-nav-btn ${activeTab === "system" ? "active" : ""}`}
          onClick={() => setActiveTab("system")}
        >
          <Lock size={16} /> Role Privileges & Policies
        </button>
      </div>

      {/* TAB 1: ANALYST USER MANAGEMENT */}
      {activeTab === "users" && (
        <div className="glass-card admin-card">
          <div className="admin-card-header">
            <div className="admin-card-title">
              <Users size={20} color="var(--cyan)" />
              <span>Registered SOC Security Analysts & Governance</span>
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
              <div className="history-search-input-box" style={{ width: "240px" }}>
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search analysts..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </div>

              <button onClick={loadUsers} className="cyber-btn-secondary btn-sm" title="Refresh User List">
                <RefreshCw size={15} className={userLoading ? "spin-icon" : ""} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {userLoading ? (
            <div className="empty-history-box">
              <RefreshCw size={36} className="spin-icon text-cyan" />
              <p className="text-secondary">Loading analyst registry...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="empty-history-box">
              <Users size={40} className="empty-icon text-muted" />
              <h4>No Analysts Found</h4>
              <p className="text-secondary">No user matches the current search query.</p>
            </div>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Analyst Profile</th>
                    <th>Role & Privilege</th>
                    <th>Status</th>
                    <th>Scans</th>
                    <th>Created</th>
                    <th style={{ textAlign: "right", minWidth: "210px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => {
                    const isRoot = u.email === "admin@phishshield.com";
                    const isCurrentUser = u.email === currentUser?.email;
                    const initial = (u.name || u.email || "A").charAt(0).toUpperCase();

                    return (
                      <tr key={u.email}>
                        <td>
                          <div className="admin-user-cell">
                            <div className="admin-user-avatar">{initial}</div>
                            <div className="admin-user-info">
                              <div className="admin-user-name">
                                <span>{u.name || "SOC Analyst"}</span>
                                {isCurrentUser && (
                                  <span className="current-user-pill">You</span>
                                )}
                              </div>
                              <div className="admin-user-email">{u.email}</div>
                            </div>
                          </div>
                        </td>

                        <td>
                          <select
                            className="admin-role-select"
                            value={u.role || "SOC Security Analyst"}
                            disabled={isRoot}
                            onChange={(e) => handleRoleChange(u.email, e.target.value)}
                            title="Change user privilege role"
                          >
                            {ROLES.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td>
                          <span
                            className={`status-badge ${
                              u.status === "suspended"
                                ? "status-badge-suspended"
                                : "status-badge-active"
                            }`}
                          >
                            {u.status === "suspended" ? (
                              <>
                                <UserX size={12} /> Suspended
                              </>
                            ) : (
                              <>
                                <CheckCircle2 size={12} /> Active
                              </>
                            )}
                          </span>
                        </td>

                        <td>
                          <div style={{ fontSize: "0.85rem", whiteSpace: "nowrap" }}>
                            <strong>{u.total_scans || 0}</strong> scans
                            {(u.total_threats || 0) > 0 && (
                              <span className="scans-threat-count">
                                ({u.total_threats} threats)
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="text-sm text-muted" style={{ whiteSpace: "nowrap" }}>
                          {formatDate(u.created_at)}
                        </td>

                        <td style={{ textAlign: "right" }}>
                          <div className="admin-actions-cell">
                            {/* View Scans Button */}
                            <button
                              className="action-btn action-btn-view-activity"
                              onClick={() => {
                                setAnalystFilter(u.email);
                                setActiveTab("scans");
                              }}
                              title={`Inspect all scans performed by ${u.name}`}
                            >
                              <Eye size={13} />
                              <span>Scans</span>
                            </button>

                            {/* Reset Password Button */}
                            <button
                              className="action-btn action-btn-pwd"
                              onClick={() => {
                                setResetTargetUser(u);
                                setNewResetPassword("");
                              }}
                              title="Reset Password for this user"
                            >
                              <Key size={13} />
                              <span>Password</span>
                            </button>

                            {!isRoot && (
                              <>
                                <button
                                  className={`action-btn ${
                                    u.status === "suspended"
                                      ? "action-btn-activate"
                                      : "action-btn-suspend"
                                  }`}
                                  onClick={() => handleToggleStatus(u.email, u.status || "active")}
                                  title={
                                    u.status === "suspended"
                                      ? "Restore Analyst Access"
                                      : "Suspend Analyst Access"
                                  }
                                >
                                  {u.status === "suspended" ? (
                                    <>
                                      <UserCheck size={13} />
                                      <span>Activate</span>
                                    </>
                                  ) : (
                                    <>
                                      <UserX size={13} />
                                      <span>Suspend</span>
                                    </>
                                  )}
                                </button>

                                <button
                                  className="action-btn action-btn-delete"
                                  onClick={() => handleDeleteUser(u.email)}
                                  title="Permanently delete user"
                                >
                                  <Trash2 size={13} />
                                  <span>Delete</span>
                                </button>
                              </>
                            )}
                            {isRoot && (
                              <span className="root-protected-badge">
                                Root Protected
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: GLOBAL AUDIT SCANS */}
      {activeTab === "scans" && (
        <div className="glass-card admin-card">
          <div className="admin-card-header">
            <div className="admin-card-title">
              <Globe size={20} color="var(--cyan)" />
              <span>Organization-Wide Threat Forensics Log</span>
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
              <div className="history-search-input-box" style={{ width: "220px" }}>
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search URL or analyst..."
                  value={scanSearch}
                  onChange={(e) => setScanSearch(e.target.value)}
                />
              </div>

              {/* Verdict Filter */}
              <div className="filter-pill-row">
                {["all", "Phishing", "Legitimate"].map((vf) => (
                  <button
                    key={vf}
                    className={`filter-pill-btn ${verdictFilter === vf ? "active" : ""}`}
                    onClick={() => setVerdictFilter(vf)}
                  >
                    {vf === "all" ? "All" : vf}
                  </button>
                ))}
              </div>

              <button
                onClick={handleExportGlobalScans}
                disabled={filteredScans.length === 0}
                className="cyber-btn-secondary btn-sm"
                title="Export all global scans as CSV"
              >
                <Download size={15} /> Export CSV
              </button>

              <button
                onClick={handleClearGlobalScans}
                disabled={scans.length === 0}
                className="cyber-btn-secondary btn-sm clear-danger-btn"
                title="Purge global audit logs"
              >
                <Trash2 size={15} /> Clear Scans
              </button>

              <button onClick={loadScans} className="cyber-btn-secondary btn-sm" title="Refresh scans">
                <RefreshCw size={15} className={scanLoading ? "spin-icon" : ""} />
              </button>
            </div>
          </div>

          {/* Dedicated User Button Selector Bar (Step 5 Requirement) */}
          <div className="admin-user-pills-bar">
            <div className="user-pills-title">
              <Users size={15} /> Click User / Analyst Name to Inspect Their Scan Activity:
            </div>
            <div className="user-pills-list">
              <button
                type="button"
                className={`user-pill-tab ${analystFilter === "all" ? "active" : ""}`}
                onClick={() => setAnalystFilter("all")}
              >
                <Globe size={13} />
                <span>All Users</span>
                <span className="user-pill-counter">{scans.length}</span>
              </button>
              {users.map((u) => {
                const uEmail = (u.email || "").toLowerCase();
                const count = scans.filter(s => (s.user_email || "").toLowerCase() === uEmail).length;
                return (
                  <button
                    key={u.email}
                    type="button"
                    className={`user-pill-tab ${analystFilter.toLowerCase() === uEmail ? "active" : ""}`}
                    onClick={() => setAnalystFilter(u.email)}
                    title={`Click to inspect scans by ${u.name} (${u.email})`}
                  >
                    <User size={13} />
                    <span>{u.name || u.email}</span>
                    <span className="user-pill-counter">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active User Inspection Alert Banner */}
          {analystFilter !== "all" && (
            <div className="admin-filter-active-banner">
              <div className="filter-banner-text">
                <UserCheck size={16} />
                <span>Inspecting scans for: <strong>{users.find(u => (u.email || "").toLowerCase() === analystFilter.toLowerCase())?.name || analystFilter}</strong> ({analystFilter})</span>
              </div>
              <button
                type="button"
                onClick={() => setAnalystFilter("all")}
                className="clear-user-filter-btn"
              >
                <X size={13} /> Show All Users
              </button>
            </div>
          )}

          {scanLoading ? (
            <div className="empty-history-box">
              <RefreshCw size={36} className="spin-icon text-cyan" />
              <p className="text-secondary">Retrieving global audit telemetry...</p>
            </div>
          ) : filteredScans.length === 0 ? (
            <div className="empty-history-box">
              <Globe size={40} className="empty-icon text-muted" />
              <h4>No Global Scans Found</h4>
              <p className="text-secondary">No scan records match the active criteria.</p>
            </div>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Target URL</th>
                    <th>Analyst Email</th>
                    <th>Verdict</th>
                    <th>Confidence</th>
                    <th>Risk Tier</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredScans.map((s) => (
                    <tr key={s.id || `${s.url}_${s.timestamp}`}>
                      <td className="mono truncate-url-col" style={{ maxWidth: "340px" }}>
                        <span className="cell-url-text" title={s.url}>{s.url}</span>
                      </td>

                      <td>
                        <span className="analyst-tag-cell">
                          <User size={11} />
                          <span>{s.user_email || s.user_id || "Anonymous"}</span>
                        </span>
                      </td>

                      <td>
                        <span
                          className={`badge ${
                            s.prediction === "Phishing" ? "badge-phish" : "badge-safe"
                          }`}
                        >
                          {s.prediction === "Phishing" ? <ShieldAlert size={13} /> : <ShieldCheck size={13} />}
                          <span>{s.prediction}</span>
                        </span>
                      </td>

                      <td>
                        <div className="confidence-cell">
                          <span className="mono font-semibold" style={{ fontSize: "0.86rem" }}>
                            {s.confidence}%
                          </span>
                          <div className="confidence-bar-bg">
                            <div
                              className={`confidence-bar-fill ${
                                s.prediction === "Phishing" ? "fill-threat" : "fill-safe"
                              }`}
                              style={{ width: `${Math.min(100, Math.max(0, s.confidence))}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`badge ${
                            s.risk_level === "High"
                              ? "badge-phish"
                              : s.risk_level === "Medium"
                              ? "badge-warn"
                              : "badge-safe"
                          }`}
                        >
                          {s.risk_level}
                        </span>
                      </td>

                      <td className="text-sm text-muted">
                        {formatDate(s.timestamp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: USER INQUIRIES & SUPPORT MESSAGES */}
      {activeTab === "support" && (
        <div className="glass-card admin-card">
          <div className="admin-card-header">
            <div className="admin-card-title">
              <Mail size={20} color="var(--terracotta)" />
              <span>User Incident Reports & Support Messages ({supportMessages.length})</span>
            </div>
            <button onClick={loadSupportMessages} className="cyber-btn-secondary btn-sm">
              <RefreshCw size={15} className={supportLoading ? "spin-icon" : ""} />
              <span>Refresh Inquiries</span>
            </button>
          </div>

          {supportLoading ? (
            <div className="empty-history-box">
              <RefreshCw size={36} className="spin-icon text-cyan" />
              <p className="text-secondary">Retrieving user messages...</p>
            </div>
          ) : supportMessages.length === 0 ? (
            <div className="empty-history-box">
              <MessageSquare size={44} className="text-muted" />
              <h4>No Support Inquiries Recorded</h4>
              <p className="text-secondary">Users have not submitted any incident reports or questions yet.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="cyber-table">
                <thead>
                  <tr>
                    <th>Sender Name</th>
                    <th>Email Address</th>
                    <th>Subject</th>
                    <th>Message Details</th>
                    <th>Received At</th>
                  </tr>
                </thead>
                <tbody>
                  {supportMessages.map((m) => (
                    <tr key={m.id}>
                      <td style={{ fontWeight: 600 }}>{m.name}</td>
                      <td className="mono">{m.email}</td>
                      <td>
                        <span className="badge badge-warn">{m.subject}</span>
                      </td>
                      <td style={{ maxWidth: "340px", wordBreak: "break-word" }}>{m.message}</td>
                      <td className="text-sm text-muted">{formatDate(m.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ROLE PRIVILEGES & GOVERNANCE POLICIES */}
      {activeTab === "system" && (
        <div className="glass-card admin-card">
          <div className="admin-card-header">
            <div className="admin-card-title">
              <Lock size={20} color="var(--cyan)" />
              <span>Role-Based Access Control (RBAC) Governance Matrix</span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
            <div className="glass-card" style={{ padding: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <Shield size={22} color="var(--cyan)" />
                <h4 style={{ margin: 0, color: "var(--text-primary)" }}>SOC Security Analyst</h4>
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "14px", lineHeight: "1.5" }}>
                Standard operational security role for conducting real-time domain threat investigations.
              </p>
              <ul style={{ fontSize: "0.82rem", color: "var(--text-secondary)", paddingLeft: "18px", lineHeight: "1.7" }}>
                <li>Execute heuristic and Random Forest ML URL inspections</li>
                <li>View isolated personal scan history and export private CSV audit logs</li>
                <li>Inspect feature importance metrics and detection explanations</li>
                <li>Cannot view other analysts' scans or modify user accounts</li>
              </ul>
            </div>

            <div className="glass-card" style={{ padding: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <ShieldAlert size={22} color="#c084fc" />
                <h4 style={{ margin: 0, color: "var(--text-primary)" }}>SOC Administrator</h4>
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "14px", lineHeight: "1.5" }}>
                Privileged administrative role for centralized team governance and telemetry oversight.
              </p>
              <ul style={{ fontSize: "0.82rem", color: "var(--text-secondary)", paddingLeft: "18px", lineHeight: "1.7" }}>
                <li>Access the dedicated Administrator Control Hub (<code style={{ color: "var(--cyan)" }}>/admin</code>)</li>
                <li>Provision new analysts and reset user credentials</li>
                <li>Assign and elevate analyst privilege roles instantly</li>
                <li>Suspend compromised analyst accounts or activate approved users</li>
                <li>Inspect and audit all organization-wide threat detection records</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD NEW USER */}
      {showAddModal && (
        <div 
          style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(5, 8, 18, 0.75)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px"
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div 
            className="glass-card" 
            style={{ width: "100%", maxWidth: "480px", padding: "28px", background: "var(--bg-surface)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
                <UserPlus size={20} color="var(--cyan)" />
                <span>Create New Analyst Account</span>
              </h3>
              <button 
                onClick={() => setShowAddModal(false)} 
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: 600, display: "block", marginBottom: "6px" }}>
                  Analyst Name:
                </label>
                <input
                  type="text"
                  className="cyber-input"
                  placeholder="e.g. John Doe"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: 600, display: "block", marginBottom: "6px" }}>
                  Work Email:
                </label>
                <input
                  type="email"
                  className="cyber-input"
                  placeholder="e.g. jdoe@phishshield.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: 600, display: "block", marginBottom: "6px" }}>
                  Initial Password:
                </label>
                <input
                  type="password"
                  className="cyber-input"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: 600, display: "block", marginBottom: "6px" }}>
                  Privilege Role:
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="admin-role-select"
                  style={{ width: "100%", padding: "10px", maxWidth: "100%" }}
                >
                  {ROLES.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "14px" }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="cyber-btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNewUser}
                  className="cyber-btn-primary btn-sm"
                >
                  {isSubmittingNewUser ? "Creating Profile..." : "Create Analyst Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RESET PASSWORD */}
      {resetTargetUser && (
        <div 
          style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(5, 8, 18, 0.75)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px"
          }}
          onClick={() => setResetTargetUser(null)}
        >
          <div 
            className="glass-card" 
            style={{ width: "100%", maxWidth: "440px", padding: "28px", background: "var(--bg-surface)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
                <Key size={20} color="var(--cyan)" />
                <span>Reset User Password</span>
              </h3>
              <button 
                onClick={() => setResetTargetUser(null)} 
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "16px" }}>
              Setting new authentication password for <strong>{resetTargetUser.name}</strong> ({resetTargetUser.email}).
            </p>

            <form onSubmit={handleResetPassword} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: 600, display: "block", marginBottom: "6px" }}>
                  New Access Password:
                </label>
                <input
                  type="password"
                  className="cyber-input"
                  placeholder="Enter at least 6 characters"
                  value={newResetPassword}
                  onChange={(e) => setNewResetPassword(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "14px" }}>
                <button
                  type="button"
                  onClick={() => setResetTargetUser(null)}
                  className="cyber-btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReset}
                  className="cyber-btn-primary btn-sm"
                >
                  {isSubmittingReset ? "Updating..." : "Save New Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPortal;
