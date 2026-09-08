import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  History, Search, Trash2, Download, RefreshCw, Copy, Check, 
  ExternalLink, Filter, AlertTriangle, ShieldCheck, ShieldAlert 
} from "lucide-react";

const ScanHistory = () => {
  const [history, setHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [copiedId, setCopiedId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    try {
      const stored = JSON.parse(localStorage.getItem("phishshield_history") || "[]");
      setHistory(stored);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = (id) => {
    const updated = history.filter((item) => item.id !== id);
    setHistory(updated);
    localStorage.setItem("phishshield_history", JSON.stringify(updated));
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear all stored scan records?")) {
      setHistory([]);
      localStorage.removeItem("phishshield_history");
    }
  };

  const handleCopy = (url, id) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleExportCSV = () => {
    if (history.length === 0) return;
    const headers = ["ID", "URL", "Prediction", "Confidence", "ThreatScore", "RiskLevel", "Tier", "Timestamp"];
    const rows = history.map((h) => [
      h.id,
      `"${h.url.replace(/"/g, '""')}"`,
      h.prediction,
      h.confidence,
      h.risk_score,
      h.risk_level,
      `"${h.tier}"`,
      `"${h.timestamp}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `phishshield_scans_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = history.filter((item) => {
    const matchSearch = item.url.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFilter =
      filterType === "All" ||
      (filterType === "Phishing" && item.prediction === "Phishing") ||
      (filterType === "Legitimate" && item.prediction === "Legitimate") ||
      (filterType === "High" && item.risk_level === "High");
    return matchSearch && matchFilter;
  });

  return (
    <div className="history-page-container">
      <div className="page-header flex-header">
        <div>
          <div className="header-badge">AUDIT TRAIL</div>
          <h2>URL Threat Scan History</h2>
          <p>Inspect past forensic scans, filter by classification, and export audit records.</p>
        </div>

        <div className="history-actions-row">
          <button onClick={handleExportCSV} disabled={history.length === 0} className="cyber-btn-secondary btn-sm" title="Export as CSV">
            <Download size={16} />
            <span>Export CSV</span>
          </button>
          <button onClick={handleClearAll} disabled={history.length === 0} className="cyber-btn-secondary btn-sm clear-danger-btn" title="Clear all history">
            <Trash2 size={16} />
            <span>Clear All</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="history-filter-bar glass-card">
        <div className="history-search-input-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by URL, domain or parameter..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-pill-row">
          <span className="filter-label"><Filter size={15} /> Filter:</span>
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

      {/* History Table Card */}
      <div className="history-table-card glass-card">
        {filtered.length === 0 ? (
          <div className="empty-history-box">
            <History size={48} className="empty-icon text-muted" />
            <h4>No Scan Records Found</h4>
            <p className="text-secondary">
              {searchTerm ? "No scans match your search query." : "You haven't performed any URL scans yet."}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="cyber-table">
              <thead>
                <tr>
                  <th>URL</th>
                  <th>Verdict</th>
                  <th>Confidence</th>
                  <th>Risk Tier</th>
                  <th>Detection Engine</th>
                  <th>Timestamp</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id}>
                    <td className="mono truncate-url-col">
                      <div className="url-flex-cell">
                        <span className="cell-url-text" title={row.url}>{row.url}</span>
                        <button
                          onClick={() => handleCopy(row.url, row.id)}
                          className="copy-cell-btn"
                          title="Copy URL"
                        >
                          {copiedId === row.id ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${row.prediction === "Phishing" ? "badge-phish" : "badge-safe"}`}>
                        {row.prediction === "Phishing" ? <ShieldAlert size={14} /> : <ShieldCheck size={14} />}
                        {row.prediction}
                      </span>
                    </td>
                    <td className="mono font-semibold">{row.confidence}%</td>
                    <td>
                      <span className={`badge ${row.risk_level === "High" ? "badge-phish" : row.risk_level === "Medium" ? "badge-warn" : "badge-safe"}`}>
                        {row.risk_level}
                      </span>
                    </td>
                    <td className="text-sm text-secondary">{row.tier || "Random Forest"}</td>
                    <td className="text-sm text-muted">{row.timestamp}</td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        onClick={() => handleDelete(row.id)}
                        className="delete-row-btn"
                        title="Delete record"
                      >
                        <Trash2 size={16} />
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
