import React, { useState, useEffect } from "react";
import { 
  Users, Shield, ShieldCheck, ShieldAlert, Activity, Search, 
  Trash2, UserX, UserCheck, RefreshCw, Download, Filter, 
  CheckCircle2, AlertTriangle, Database, Lock, Clock, Calendar, Globe
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
  const [activeTab, setActiveTab] = useState("users"); // 'users' | 'scans' | 'system'
  
  // User Management State
  const [users, setUsers] = useState([]);
  const [userLoading, setUserLoading] = useState(true);
  const [userSearch, setUserSearch] = useState("");
  const [actionNotice, setActionNotice] = useState(null);

  // Global Scans State
  const [scans, setScans] = useState([]);
  const [scanLoading, setScanLoading] = useState(true);
  const [scanSearch, setScanSearch] = useState("");
  const [analystFilter, setAnalystFilter] = useState("all");
  const [verdictFilter, setVerdictFilter] = useState("all");

  const showNotice = (msg, type = "success") => {
    setActionNotice({ msg, type });
    setTimeout(() => setActionNotice(null), 4000);
  };

  // Fetch Users
  const loadUsers = async () => {
    setUserLoading(true);
    try {
      const data = await apiService.getAdminUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load users:", err);
      // Client offline fallback
      try {
        const local = JSON.parse(localStorage.getItem("phishshield_registered_users") || "{}");
        const list = Object.values(local).map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role || "SOC Security Analyst",
          status: u.status || "active",
          created_at: u.created_at || "2026-01-01T00:00:00Z"
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

  useEffect(() => {
    loadUsers();
    loadScans();
  }, []);

  // Update Role
  const handleRoleChange = async (email, newRole) => {
    try {
      await apiService.updateUserRole(email, newRole);
      showNotice(`Updated role for ${email} to "${newRole}".`);
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
      <div className="page-header">
        <div className="admin-badge-banner">
          <Shield size={13} /> SOC ROOT ADMINISTRATOR CONSOLE
        </div>
        <h2>Enterprise Access & Governance Hub</h2>
        <p>
          Manage analyst accounts, govern SOC authorization privileges, review live organization-wide forensic scan activity, and audit platform security posture.
        </p>
      </div>

      {/* Action Notification Alert */}
      {actionNotice && (
        <div 
          style={{
            padding: "12px 18px",
            borderRadius: "10px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "0.9rem",
            fontWeight: "600",
            background: actionNotice.type === "error" ? "rgba(244, 63, 94, 0.15)" : "rgba(16, 185, 129, 0.15)",
            border: `1px solid ${actionNotice.type === "error" ? "rgba(244, 63, 94, 0.4)" : "rgba(16, 185, 129, 0.4)"}`,
            color: actionNotice.type === "error" ? "#fb7185" : "#34d399"
          }}
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
            <div className="daily-stat-label">Total Registered Analysts</div>
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
            <div className="daily-stat-label">Global Scans Tracked</div>
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
              <span>Registered SOC Security Analysts</span>
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <div className="history-search-input-box" style={{ width: "260px" }}>
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
                    <th>Assigned Role & Privilege</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th style={{ textAlign: "right" }}>Governance Actions</th>
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
                            <div>
                              <div className="admin-user-name">
                                {u.name || "SOC Analyst"}
                                {isCurrentUser && (
                                  <span style={{ fontSize: "0.72rem", marginLeft: "6px", color: "var(--cyan)" }}>
                                    (You)
                                  </span>
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

                        <td className="text-sm text-muted">
                          {formatDate(u.created_at)}
                        </td>

                        <td style={{ textAlign: "right" }}>
                          <div className="admin-actions-cell" style={{ justifyContent: "flex-end" }}>
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
                                      <UserCheck size={14} /> Activate
                                    </>
                                  ) : (
                                    <>
                                      <UserX size={14} /> Suspend
                                    </>
                                  )}
                                </button>

                                <button
                                  className="action-btn action-btn-delete"
                                  onClick={() => handleDeleteUser(u.email)}
                                  title="Permanently remove analyst"
                                >
                                  <Trash2 size={14} /> Delete
                                </button>
                              </>
                            )}
                            {isRoot && (
                              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                                Root System Admin
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

              {/* Analyst Filter Dropdown */}
              <select
                className="admin-role-select"
                value={analystFilter}
                onChange={(e) => setAnalystFilter(e.target.value)}
              >
                <option value="all">All Analysts</option>
                {Array.from(new Set(scans.map(s => s.user_email).filter(Boolean))).map(em => (
                  <option key={em} value={em}>
                    {em}
                  </option>
                ))}
              </select>

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
              >
                <Download size={15} /> Export CSV
              </button>

              <button onClick={loadScans} className="cyber-btn-secondary btn-sm">
                <RefreshCw size={15} className={scanLoading ? "spin-icon" : ""} />
              </button>
            </div>
          </div>

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
                    <th>Analyst</th>
                    <th>Verdict</th>
                    <th>Confidence</th>
                    <th>Risk Tier</th>
                    <th>Date & Time</th>
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
                          {s.user_email || s.user_id || "Anonymous"}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`badge ${
                            s.prediction === "Phishing" ? "badge-phish" : "badge-safe"
                          }`}
                        >
                          {s.prediction === "Phishing" ? <ShieldAlert size={13} /> : <ShieldCheck size={13} />}
                          {s.prediction}
                        </span>
                      </td>

                      <td className="mono font-semibold">{s.confidence}%</td>

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

      {/* TAB 3: ROLE PRIVILEGES & GOVERNANCE POLICIES */}
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
                <h4 style={{ margin: 0, color: "#fff" }}>SOC Security Analyst</h4>
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
                <h4 style={{ margin: 0, color: "#fff" }}>SOC Administrator</h4>
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "14px", lineHeight: "1.5" }}>
                Privileged administrative role for centralized team governance and telemetry oversight.
              </p>
              <ul style={{ fontSize: "0.82rem", color: "var(--text-secondary)", paddingLeft: "18px", lineHeight: "1.7" }}>
                <li>Access the dedicated Administrator Control Hub (<code style={{ color: "var(--cyan)" }}>/admin</code>)</li>
                <li>Inspect and audit all organization-wide threat detection records</li>
                <li>Assign and elevate analyst privilege roles</li>
                <li>Suspend compromised analyst accounts or activate approved users</li>
                <li>Remove obsolete accounts and govern audit compliance</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPortal;
