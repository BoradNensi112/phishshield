import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from "recharts";
import { 
  ShieldCheck, ShieldAlert, Globe, Activity, ArrowUpRight, 
  TrendingUp, RefreshCw, BarChart3, AlertOctagon, Radar 
} from "lucide-react";
import apiService from "../services/api";

const Dashboard = () => {
  const [modelInfo, setModelInfo] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const meta = await apiService.getModelInfo();
      setModelInfo(meta);
    } catch (e) {
      console.error("Model info load failed:", e);
    }

    try {
      const stored = JSON.parse(localStorage.getItem("phishshield_history") || "[]");
      setHistory(stored);
    } catch (e) {
      console.error("History parse failed:", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute live scan stats from history
  const totalScans = history.length;
  const phishScans = history.filter((h) => h.prediction === "Phishing").length;
  const legitScans = history.filter((h) => h.prediction === "Legitimate").length;

  // Chart 1: Threat distribution data
  const pieData = [
    { name: "Legitimate", value: legitScans || 1, color: "#10b981" },
    { name: "Phishing", value: phishScans || 1, color: "#f43f5e" },
  ];

  // Chart 2: Risk distribution data
  const riskCounts = {
    Safe: history.filter((h) => h.risk_level === "Safe").length,
    Low: history.filter((h) => h.risk_level === "Low").length,
    Medium: history.filter((h) => h.risk_level === "Medium").length,
    High: history.filter((h) => h.risk_level === "High").length,
  };

  const barData = [
    { name: "Safe", count: riskCounts.Safe, fill: "#10b981" },
    { name: "Low", count: riskCounts.Low, fill: "#38bdf8" },
    { name: "Medium", count: riskCounts.Medium, fill: "#f59e0b" },
    { name: "High", count: riskCounts.High, fill: "#f43f5e" },
  ];

  // Chart 3: Confidence trend line
  const lineData = history
    .slice(0, 10)
    .reverse()
    .map((item, idx) => ({
      index: `#${idx + 1}`,
      confidence: item.confidence,
      threatScore: item.risk_score,
    }));

  return (
    <div className="dashboard-page-container">
      <div className="page-header flex-header">
        <div>
          <div className="header-badge">SECURITY OPERATIONS CENTER (SOC)</div>
          <h2>Phishing Defense Dashboard</h2>
          <p>Real-time analytics, machine learning model telemetry, and threat distributions.</p>
        </div>

        <button onClick={loadData} className="cyber-btn-secondary btn-sm" title="Refresh Dashboard">
          <RefreshCw size={16} />
          <span>Refresh</span>
        </button>
      </div>

      {/* 4 KPI Cards */}
      <div className="kpi-grid">
        <div className="glass-card kpi-card">
          <div className="kpi-icon-wrapper cyan-bg">
            <Globe size={24} className="cyan-text" />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Total URLs Scanned</span>
            <h3 className="kpi-value">{totalScans}</h3>
            <span className="kpi-subtext">Captured in active session</span>
          </div>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-icon-wrapper green-bg">
            <ShieldCheck size={24} className="green-text" />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Legitimate Clean URLs</span>
            <h3 className="kpi-value text-safe">{legitScans}</h3>
            <span className="kpi-subtext">Verified safe from threats</span>
          </div>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-icon-wrapper red-bg">
            <ShieldAlert size={24} className="red-text" />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Phishing Attacks Blocked</span>
            <h3 className="kpi-value text-phish">{phishScans}</h3>
            <span className="kpi-subtext">Malicious vectors intercepted</span>
          </div>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-icon-wrapper purple-bg">
            <Activity size={24} className="purple-text" />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Model ROC-AUC</span>
            <h3 className="kpi-value cyan-text">
              {modelInfo ? `${(modelInfo.roc_auc * 100).toFixed(1)}%` : "94.7%"}
            </h3>
            <span className="kpi-subtext">Accuracy: {modelInfo?.accuracy || "87.8"}%</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Chart 1: Threat Distribution Pie */}
        <div className="glass-card chart-card">
          <div className="chart-header">
            <h4>Threat Classification Ratio</h4>
            <span className="chart-sub">Legitimate vs Phishing</span>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "var(--bg-surface)", 
                    borderColor: "var(--border-color)", 
                    borderRadius: 8 
                  }} 
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Risk Breakdown Bar */}
        <div className="glass-card chart-card">
          <div className="chart-header">
            <h4>Scans by Risk Severity</h4>
            <span className="chart-sub">Categorized into 4 risk tiers</span>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.5} />
                <XAxis dataKey="name" stroke="var(--text-secondary)" />
                <YAxis stroke="var(--text-secondary)" allowDecimals={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "var(--bg-surface)", 
                    borderColor: "var(--border-color)", 
                    borderRadius: 8 
                  }} 
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Confidence Trend Line */}
        <div className="glass-card chart-card span-full">
          <div className="chart-header">
            <h4>Detection Confidence & Threat Trend</h4>
            <span className="chart-sub">Tracking model telemetry over recent scans</span>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={lineData.length > 0 ? lineData : [{ index: "#1", confidence: 95, threatScore: 10 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.5} />
                <XAxis dataKey="index" stroke="var(--text-secondary)" />
                <YAxis domain={[0, 100]} stroke="var(--text-secondary)" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "var(--bg-surface)", 
                    borderColor: "var(--border-color)", 
                    borderRadius: 8 
                  }} 
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="confidence" 
                  name="Model Confidence (%)" 
                  stroke="#00f0ff" 
                  strokeWidth={3} 
                  dot={{ r: 5, fill: "#00f0ff" }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="threatScore" 
                  name="Calculated Threat Score (%)" 
                  stroke="#f43f5e" 
                  strokeWidth={3} 
                  dot={{ r: 5, fill: "#f43f5e" }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Recent Scan Feed */}
      <div className="recent-scans-card glass-card">
        <div className="recent-header">
          <div className="recent-header-title">
            <Activity size={20} className="cyan-text" />
            <h4>Recent Activity Feed</h4>
          </div>
          <Link to="/history" className="cyber-btn-secondary btn-sm">
            <span>View Full History</span>
            <ArrowUpRight size={16} />
          </Link>
        </div>

        {history.length === 0 ? (
          <div className="empty-feed-container">
            <Activity size={40} className="text-muted empty-icon" />
            <p className="empty-title">No Scans Recorded Yet</p>
            <p className="empty-sub">URLs evaluated in this session will appear in this real-time forensic threat feed.</p>
            <Link to="/scanner" className="cyber-btn-primary btn-sm empty-cta">
              <Radar size={16} />
              <span>Scan a URL Now</span>
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="recent-table-scroll desktop-only-table">
              <table className="cyber-table">
                <thead>
                  <tr>
                    <th>URL</th>
                    <th>Verdict</th>
                    <th>Confidence</th>
                    <th>Risk Tier</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {history.slice(0, 5).map((row) => (
                    <tr key={row.id}>
                      <td className="mono truncate-url-col">
                        <div className="url-flex-cell">
                          <span className="cell-url-text" title={row.url}>{row.url}</span>
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
                      <td className="text-muted text-sm">{row.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Feed View */}
            <div className="recent-mobile-list mobile-only-feed">
              {history.slice(0, 5).map((row) => (
                <div key={row.id} className="recent-feed-item">
                  <div className="feed-item-top">
                    <span className={`badge ${row.prediction === "Phishing" ? "badge-phish" : "badge-safe"}`}>
                      {row.prediction === "Phishing" ? <ShieldAlert size={13} /> : <ShieldCheck size={13} />}
                      {row.prediction}
                    </span>
                    <span className={`badge ${row.risk_level === "High" ? "badge-phish" : row.risk_level === "Medium" ? "badge-warn" : "badge-safe"}`}>
                      {row.risk_level}
                    </span>
                    <span className="feed-time">{row.timestamp}</span>
                  </div>
                  <div className="feed-item-url mono" title={row.url}>
                    {row.url}
                  </div>
                  <div className="feed-item-meta">
                    <span className="meta-label">Confidence:</span>
                    <strong className="mono cyan-text">{row.confidence}%</strong>
                    <span className="meta-divider">•</span>
                    <span className="meta-tier text-muted text-sm">{row.tier || "Random Forest"}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
