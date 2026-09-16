import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  History, Search, Trash2, Download, RefreshCw, Copy, Check, 
  ExternalLink, Filter, AlertTriangle, ShieldCheck, ShieldAlert,
  Calendar, Clock, User, Shield, ArrowRight, BarChart2, Cpu
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import apiService from "../services/api";

const ScanHistory = () => {
  const { currentUser, isAdmin, isAuthenticated } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [dateFilter, setDateFilter] = useState("all"); // 'all', 'today', 'yesterday', 'past7', 'custom'
  
  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [customDate, setCustomDate] = useState(getTodayStr());
  const [copiedId, setCopiedId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const navigate = useNavigate();

  const loadHistory = async () => {
    setLoading(true);
    try {
      const currEmail = (currentUser?.email || "").toLowerCase().trim();
      const currId = currentUser?.id || null;

      let serverScans = [];
      let fetchedFromServer = false;
      if (currEmail) {
        try {
          serverScans = await apiService.getScans(currEmail);
          if (Array.isArray(serverScans)) {
            fetchedFromServer = true;
          }
        } catch (e) {
          console.warn("Server scans fetch failed, falling back to local storage:", e);
        }
      }

      if (fetchedFromServer) {
        // Strict single source of truth from backend
        const cleanScans = serverScans.filter((s) => (s.user_email || "").toLowerCase().trim() === currEmail);
        cleanScans.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
        setHistory(cleanScans);
        // Cache to localStorage for offline fallback
        try {
          localStorage.setItem("phishshield_history", JSON.stringify(cleanScans));
        } catch (e) {}
      } else {
        // Fallback to offline localStorage cache
        const rawStored = JSON.parse(localStorage.getItem("phishshield_history") || "[]");
        const userStored = rawStored.filter((item) => {
          const itemEmail = (item.user_email || "").toLowerCase().trim();
          return Boolean(currEmail && itemEmail === currEmail);
        });
        userStored.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
        setHistory(userStored);
      }
    } catch (e) {
      console.error("Failed to load history:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [currentUser]);

  const handleDelete = async (id) => {
    const targetItem = history.find((item) => item.id === id);
    // Optimistically update UI
    const updated = history.filter((item) => item.id !== id);
    setHistory(updated);
    if (selectedIds.has(id)) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }

    const currEmail = (currentUser?.email || "").toLowerCase().trim();

    // 1. Permanently delete from backend server
    try {
      await apiService.deleteScan(id, currEmail || null);
    } catch (e) {
      console.error("Backend delete failed:", e);
    }

    // 2. Remove from localStorage cache
    try {
      const stored = JSON.parse(localStorage.getItem("phishshield_history") || "[]");
      const filteredLocal = stored.filter(
        (item) => item.id !== id && !(targetItem && item.url === targetItem.url && item.timestamp === targetItem.timestamp)
      );
      localStorage.setItem("phishshield_history", JSON.stringify(filteredLocal));
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearAll = async () => {
    const confirmMsg = "Are you sure you want to permanently delete all your private scan records? This cannot be undone.";
    if (window.confirm(confirmMsg)) {
      setHistory([]);
      setSelectedIds(new Set());
      const currEmail = (currentUser?.email || "").toLowerCase().trim();

      // 1. Purge from backend database permanently
      try {
        if (currEmail) {
          await apiService.clearScans(currEmail);
        }
      } catch (e) {
        console.error("Backend clear failed:", e);
      }

      // 2. Clear from localStorage cache
      try {
        const stored = JSON.parse(localStorage.getItem("phishshield_history") || "[]");
        const retained = stored.filter(
          (item) => (item.user_email || "").toLowerCase().trim() !== currEmail
        );
        localStorage.setItem("phishshield_history", JSON.stringify(retained));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleToggleSelectAll = () => {
    const allIds = filtered.map((r) => r.id).filter(Boolean);
    const isAllSelected = allIds.length > 0 && allIds.every((id) => selectedIds.has(id));
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allIds));
    }
  };

  const handleToggleSelectOne = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    const confirmMsg = `Are you sure you want to permanently delete ${count} selected scan records? This action cannot be undone.`;
    if (!window.confirm(confirmMsg)) return;

    setIsBulkDeleting(true);
    const idsToDelete = Array.from(selectedIds);

    // Optimistically update UI
    setHistory((prev) => prev.filter((item) => !selectedIds.has(item.id)));
    setSelectedIds(new Set());

    const currEmail = (currentUser?.email || "").toLowerCase().trim();

    try {
      await apiService.bulkDeleteScans(idsToDelete, currEmail || null);
    } catch (e) {
      console.error("Bulk delete failed on backend:", e);
    }

    try {
      const stored = JSON.parse(localStorage.getItem("phishshield_history") || "[]");
      const filteredLocal = stored.filter((item) => !idsToDelete.includes(item.id));
      localStorage.setItem("phishshield_history", JSON.stringify(filteredLocal));
    } catch (e) {
      console.error(e);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleExportSelectedCSV = () => {
    const selectedItems = filtered.filter((h) => selectedIds.has(h.id));
    if (selectedItems.length === 0) return;
    const headers = [
      "ID",
      "Analyst Email",
      "URL",
      "Prediction",
      "Confidence",
      "ThreatScore",
      "RiskLevel",
      "Tier",
      "Timestamp"
    ];
    const rows = selectedItems.map((h) => [
      h.id,
      `"${h.user_email || currentUser?.email || "analyst"}"`,
      `"${(h.url || "").replace(/"/g, '""')}"`,
      h.prediction,
      h.confidence,
      h.risk_score,
      h.risk_level,
      `"${h.tier || "Random Forest"}"`,
      `"${h.timestamp}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `phishshield_selected_scans_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopy = (url, id) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleExportCSV = () => {
    if (filtered.length === 0) return;
    const headers = [
      "ID",
      "Analyst Email",
      "URL",
      "Prediction",
      "Confidence",
      "ThreatScore",
      "RiskLevel",
      "Tier",
      "Timestamp"
    ];
    const rows = filtered.map((h) => [
      h.id,
      `"${h.user_email || currentUser?.email || "analyst"}"`,
      `"${(h.url || "").replace(/"/g, '""')}"`,
      h.prediction,
      h.confidence,
      h.risk_score,
      h.risk_level,
      `"${h.tier || "Random Forest"}"`,
      `"${h.timestamp}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const dateTag = dateFilter === "today" ? "today" : dateFilter === "custom" ? customDate : "all";
    link.setAttribute("download", `phishshield_scans_${dateTag}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    if (filtered.length === 0) return;
    const jsonContent = JSON.stringify(filtered, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const dateTag = dateFilter === "today" ? "today" : dateFilter === "custom" ? customDate : "all";
    link.download = `phishshield_scans_${dateTag}_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Helper date checker
  const checkDateMatch = (itemTimestamp, mode, targetCustom) => {
    if (!itemTimestamp) return false;
    const itemDate = new Date(itemTimestamp);
    if (isNaN(itemDate.getTime())) return true; // if invalid date, don't drop

    const now = new Date();
    const itemYMD = `${itemDate.getFullYear()}-${String(itemDate.getMonth() + 1).padStart(2, "0")}-${String(itemDate.getDate()).padStart(2, "0")}`;
    const todayYMD = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    if (mode === "all") return true;

    if (mode === "today") {
      return itemYMD === todayYMD;
    }

    if (mode === "yesterday") {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayYMD = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
      return itemYMD === yesterdayYMD;
    }

    if (mode === "past7") {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return itemDate >= sevenDaysAgo;
    }

    if (mode === "custom") {
      return itemYMD === targetCustom;
    }

    return true;
  };

  // Filtered Scan List
  const filtered = history.filter((item) => {
    const matchSearch = (item.url || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.user_email || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchFilter =
      filterType === "All" ||
      (filterType === "Phishing" && item.prediction === "Phishing") ||
      (filterType === "Legitimate" && item.prediction === "Legitimate") ||
      (filterType === "High" && item.risk_level === "High");

    const matchDate = checkDateMatch(item.timestamp, dateFilter, customDate);

    return matchSearch && matchFilter && matchDate;
  });

  // Calculate live daily stats based on current date selection
  const dailyTotal = filtered.length;
  const dailyPhish = filtered.filter((i) => i.prediction === "Phishing").length;
  const dailyClean = filtered.filter((i) => i.prediction === "Legitimate").length;
  const phishRate = dailyTotal > 0 ? Math.round((dailyPhish / dailyTotal) * 100) : 0;

  const formatDateDisplay = (isoStr) => {
    if (!isoStr) return "N/A";
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return isoStr;
      return d.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoStr;
    }
  };

  const formatEngineTier = (tier) => {
    if (!tier) return { label: "Random Forest ML", full: "Tier-2 Random Forest ML Classifier", type: "rf" };
    if (tier.includes("Whitelist") || tier.includes("Allowlist")) {
      return { label: "Allowlist Fastpath", full: tier, type: "whitelist" };
    }
    if (tier.includes("Hybrid")) {
      return { label: "Hybrid Security ML", full: tier, type: "hybrid" };
    }
    if (tier.includes("Random Forest")) {
      return { label: "Random Forest ML", full: tier, type: "rf" };
    }
    return { label: tier, full: tier, type: "default" };
  };

  return (
    <div className="history-page-container">
      {/* Header Banner */}
      <div className="page-header flex-header">
        <div>
          <div className="header-badge">FORENSIC AUDIT TRAIL</div>
          <h2>URL Threat Scan History</h2>
          <p style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span className="user-view-tag">
              <User size={14} /> Personal Scan Log: <strong>{currentUser?.email || "Analyst"}</strong>
            </span>
          </p>
        </div>

        <div className="history-actions-row">
          <button
            onClick={loadHistory}
            className="cyber-btn-secondary btn-sm"
            title="Refresh logs"
          >
            <RefreshCw size={15} className={loading ? "spin-icon" : ""} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleExportCSV}
            disabled={filtered.length === 0}
            className="cyber-btn-secondary btn-sm"
            title="Export filtered records as CSV"
          >
            <Download size={15} />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleExportJSON}
            disabled={filtered.length === 0}
            className="cyber-btn-secondary btn-sm"
            title="Export filtered records as JSON"
          >
            <Download size={15} />
            <span>Export JSON</span>
          </button>
          <button
            onClick={handleClearAll}
            disabled={filtered.length === 0}
            className="cyber-btn-secondary btn-sm clear-danger-btn"
            title="Clear records"
          >
            <Trash2 size={15} />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Daily Telemetry Cards Bar */}
      <div className="daily-stats-grid">
        <div className="daily-stat-card glass-card">
          <div className="daily-stat-icon-wrap icon-blue">
            <History size={20} />
          </div>
          <div>
            <div className="daily-stat-label">
              {dateFilter === "today" ? "Today's Scans" : dateFilter === "yesterday" ? "Yesterday's Scans" : dateFilter === "custom" ? `Scans on ${customDate}` : "Selected Period Scans"}
            </div>
            <div className="daily-stat-val">{dailyTotal}</div>
          </div>
        </div>

        <div className="daily-stat-card glass-card">
          <div className="daily-stat-icon-wrap icon-red">
            <ShieldAlert size={20} />
          </div>
          <div>
            <div className="daily-stat-label">Malicious Threats</div>
            <div className="daily-stat-val danger-text">{dailyPhish}</div>
          </div>
        </div>

        <div className="daily-stat-card glass-card">
          <div className="daily-stat-icon-wrap icon-green">
            <ShieldCheck size={20} />
          </div>
          <div>
            <div className="daily-stat-label">Clean / Legitimate</div>
            <div className="daily-stat-val success-text">{dailyClean}</div>
          </div>
        </div>

        <div className="daily-stat-card glass-card">
          <div className="daily-stat-icon-wrap icon-purple">
            <BarChart2 size={20} />
          </div>
          <div>
            <div className="daily-stat-label">Threat Percentage</div>
            <div className="daily-stat-val mono">{phishRate}%</div>
          </div>
        </div>
      </div>

      {/* Date Navigation & Period Selector */}
      <div className="date-filter-section glass-card">
        <div className="date-preset-group">
          <span className="date-filter-title">
            <Calendar size={16} /> Date Window:
          </span>
          <button
            className={`date-tab-btn ${dateFilter === "all" ? "active" : ""}`}
            onClick={() => setDateFilter("all")}
          >
            All Time
          </button>
          <button
            className={`date-tab-btn ${dateFilter === "today" ? "active" : ""}`}
            onClick={() => setDateFilter("today")}
          >
            📅 Today
          </button>
          <button
            className={`date-tab-btn ${dateFilter === "yesterday" ? "active" : ""}`}
            onClick={() => setDateFilter("yesterday")}
          >
            Yesterday
          </button>
          <button
            className={`date-tab-btn ${dateFilter === "past7" ? "active" : ""}`}
            onClick={() => setDateFilter("past7")}
          >
            Past 7 Days
          </button>
        </div>

        <div className="custom-date-picker-wrap">
          <span className="custom-date-label">Custom Day:</span>
          <input
            type="date"
            className="cyber-date-input"
            value={customDate}
            onChange={(e) => {
              setCustomDate(e.target.value);
              setDateFilter("custom");
            }}
          />
        </div>
      </div>

      {/* Search and Classification Filter Bar */}
      <div className="history-filter-bar glass-card">
        <div className="history-search-input-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by URL, domain, or parameters..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-pill-row">
          <span className="filter-label"><Filter size={15} /> Verdict:</span>
          {["All", "Phishing", "Legitimate", "High"].map((ft) => (
            <button
              key={ft}
              className={`filter-pill-btn ${filterType === ft ? "active" : ""}`}
              onClick={() => setFilterType(ft)}
            >
              {ft}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Actions Floating Bar */}
      {selectedIds.size > 0 && (
        <div className="bulk-actions-toolbar glass-card">
          <div className="bulk-info-group">
            <span className="bulk-badge">{selectedIds.size}</span>
            <span className="bulk-label">Records Selected</span>
            <button onClick={() => setSelectedIds(new Set())} className="bulk-clear-link">
              Deselect all
            </button>
          </div>
          <div className="bulk-btn-group">
            <button
              onClick={handleExportSelectedCSV}
              className="cyber-btn-secondary btn-sm"
              title="Export selected scans to CSV"
            >
              <Download size={14} />
              <span>Export Selected ({selectedIds.size})</span>
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="cyber-btn-secondary btn-sm clear-danger-btn"
              title="Permanently delete selected records"
            >
              <Trash2 size={14} />
              <span>{isBulkDeleting ? "Deleting..." : `Delete Selected (${selectedIds.size})`}</span>
            </button>
          </div>
        </div>
      )}

      {/* History Table Card */}
      <div className="history-table-card glass-card">
        {loading ? (
          <div className="empty-history-box">
            <RefreshCw size={36} className="spin-icon text-cyan" />
            <p className="text-secondary">Retrieving encrypted scan records...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-history-box">
            <History size={48} className="empty-icon text-muted" />
            <h4>No Scan Records Found</h4>
            <p className="text-secondary">
              {searchTerm
                ? "No scans match your current search query."
                : dateFilter !== "all"
                ? `No scan records recorded for ${dateFilter === "today" ? "today" : dateFilter === "yesterday" ? "yesterday" : dateFilter === "past7" ? "the past 7 days" : customDate}.`
                : "You haven't performed any URL scans in this session yet."}
            </p>
            <button
              onClick={() => navigate("/scanner")}
              className="cyber-btn-primary btn-sm"
              style={{ marginTop: "12px" }}
            >
              Launch URL Scanner
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="cyber-table">
              <thead>
                <tr>
                  <th style={{ width: "40px", textAlign: "center" }}>
                    <input
                      type="checkbox"
                      className="cyber-checkbox"
                      checked={filtered.length > 0 && filtered.every((r) => selectedIds.has(r.id))}
                      onChange={handleToggleSelectAll}
                      title="Select / Deselect all visible records"
                      aria-label="Select all visible records"
                    />
                  </th>
                  <th>Target URL</th>
                  <th>Verdict</th>
                  <th>Confidence</th>
                  <th>Risk Tier</th>
                  <th>Detection Engine</th>
                  <th>Date & Time</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr 
                    key={row.id || `${row.url}_${row.timestamp}`}
                    className={selectedIds.has(row.id) ? "row-selected" : ""}
                  >
                    <td style={{ textAlign: "center" }}>
                      <input
                        type="checkbox"
                        className="cyber-checkbox"
                        checked={selectedIds.has(row.id)}
                        onChange={() => handleToggleSelectOne(row.id)}
                        title="Select row"
                        aria-label={`Select scan ${row.url}`}
                      />
                    </td>
                    <td className="mono truncate-url-col">
                      <div className="url-flex-cell">
                        <span className="cell-url-text" title={row.url}>{row.url}</span>
                        <button
                          onClick={() => handleCopy(row.url, row.id)}
                          className="copy-cell-btn"
                          title="Copy URL"
                        >
                          {copiedId === row.id ? (
                            <Check size={13} color="#10b981" />
                          ) : (
                            <Copy size={13} />
                          )}
                        </button>
                      </div>
                    </td>

                    <td>
                      <span
                        className={`badge ${
                          row.prediction === "Phishing" ? "badge-phish" : "badge-safe"
                        }`}
                      >
                        {row.prediction === "Phishing" ? (
                          <ShieldAlert size={13} />
                        ) : (
                          <ShieldCheck size={13} />
                        )}
                        <span>{row.prediction}</span>
                      </span>
                    </td>

                    <td>
                      <div className="confidence-cell">
                        <span className="mono font-semibold" style={{ fontSize: "0.86rem" }}>
                          {row.confidence}%
                        </span>
                        <div className="confidence-bar-bg">
                          <div
                            className={`confidence-bar-fill ${
                              row.prediction === "Phishing" ? "fill-threat" : "fill-safe"
                            }`}
                            style={{ width: `${Math.min(100, Math.max(0, row.confidence))}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td>
                      <span
                        className={`badge ${
                          row.risk_level === "High"
                            ? "badge-phish"
                            : row.risk_level === "Medium"
                            ? "badge-warn"
                            : "badge-safe"
                        }`}
                      >
                        {row.risk_level}
                      </span>
                    </td>

                    <td>
                      {(() => {
                        const eng = formatEngineTier(row.tier);
                        return (
                          <span className={`engine-badge engine-badge-${eng.type}`} title={eng.full}>
                            <Cpu size={12} />
                            <span>{eng.label}</span>
                          </span>
                        );
                      })()}
                    </td>

                    <td className="text-sm text-muted" style={{ whiteSpace: "nowrap" }}>
                      {formatDateDisplay(row.timestamp)}
                    </td>

                    <td style={{ textAlign: "right" }}>
                      <button
                        onClick={() => handleDelete(row.id)}
                        className="delete-row-btn"
                        title="Delete record"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanHistory;
