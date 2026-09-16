import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  Radar, 
  Trash2, 
  Copy, 
  Check, 
  Download, 
  ShieldAlert, 
  ShieldCheck, 
  AlertCircle, 
  Sliders, 
  ChevronDown, 
  ChevronUp, 
  Globe2, 
  Server, 
  LogIn, 
  UserPlus, 
  Clipboard, 
  X, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Cpu, 
  Layers 
} from "lucide-react";
import confetti from "canvas-confetti";
import jsPDF from "jspdf";
import apiService from "../services/api";
import { useAuth } from "../context/AuthContext";
import RiskGauge from "../components/RiskGauge";
import ThreatReasons from "../components/ThreatReasons";
import FeatureTable from "../components/FeatureTable";

const Scanner = () => {
  const { isAuthenticated, currentUser } = useAuth();
  const navigate = useNavigate();

  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);
  const [scanStep, setScanStep] = useState(1);

  // Quick preset test samples categorized
  const safeSamples = [
    { label: "Google Search", category: "safe", desc: "Legitimate Global Search", url: "https://www.google.com/search?q=cybersecurity" },
    { label: "SBI Netbanking", category: "safe", desc: "Whitelisted Financial Portal", url: "https://onlinesbi.sbi/personal/login.html" }
  ];

  const threatSamples = [
    { label: "PayPal IP Attack", category: "threat", desc: "Raw IP & Credential Phish", url: "http://174.139.46.123/ap/signin?paypal=verify&update=1" },
    { label: "Apple ID Spoof", category: "threat", desc: "Subdomain Brand Hijack", url: "https://support-appleld.com.secureupdate.duilawyeryork.com/login" }
  ];

  // Multi-step scanning animation simulation
  useEffect(() => {
    let timer;
    if (loading) {
      setScanStep(1);
      timer = setInterval(() => {
        setScanStep((prev) => (prev < 3 ? prev + 1 : 1));
      }, 450);
    } else {
      setScanStep(1);
    }
    return () => clearInterval(timer);
  }, [loading]);

  const handleScan = async (targetUrl = null) => {
    // STRICT AUTHENTICATION GUARD
    if (!isAuthenticated) {
      setError("Terminal Access Restricted: You must be logged in to scan websites.");
      navigate("/login", {
        state: {
          from: { pathname: "/scanner" },
          message: "Security Clearance Required: Please sign in or register to scan websites."
        }
      });
      return;
    }

    let inputUrl = (targetUrl || url).trim();
    if (!inputUrl) {
      setError("Please enter or paste a valid website URL to analyze.");
      return;
    }

    // Auto-normalize typos like "http: /", "http: //", "http:/"
    inputUrl = inputUrl.replace(/^(https?):\s*\/+/i, "$1://");
    if (!inputUrl.startsWith("http://") && !inputUrl.startsWith("https://")) {
      inputUrl = "http://" + inputUrl;
    }
    setUrl(inputUrl);

    setError("");
    setLoading(true);
    setResult(null);

    try {
      const data = await apiService.predictUrl({
        url: inputUrl,
        user_id: currentUser?.id || "",
        user_email: (currentUser?.email || "").toLowerCase().trim()
      });
      setResult(data);

      if (data.prediction === "Legitimate" && data.risk_score < 25) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.65 },
          colors: ["#3b7454", "#52af7d", "#10b981"]
        });
      }

      saveToHistory(data);
    } catch (err) {
      console.error("Scan error:", err);
      setError(
        err.response?.data?.detail || "Failed to reach backend API. Ensure FastAPI server is running."
      );
    } finally {
      setLoading(false);
    }
  };

  const saveToHistory = (item) => {
    try {
      const currEmail = (currentUser?.email || "").toLowerCase().trim();
      if (!currEmail) return;
      const existing = JSON.parse(localStorage.getItem("phishshield_history") || "[]");
      const record = {
        id: item.id || Date.now().toString(),
        url: item.url,
        prediction: item.prediction,
        confidence: item.confidence,
        risk_score: item.risk_score,
        risk_level: item.risk_level,
        tier: item.tier,
        dns: item.dns_info?.status || "Unknown",
        timestamp: item.timestamp || new Date().toISOString(),
        user_id: currentUser?.id || "anonymous",
        user_email: currEmail,
        user_name: currentUser?.name || "Analyst"
      };
      // Prevent duplicate if item already exists in local cache
      const filtered = existing.filter((e) => e.id !== record.id && e.url !== record.url);
      const updated = [record, ...filtered.slice(0, 99)];
      localStorage.setItem("phishshield_history", JSON.stringify(updated));
    } catch (e) {
      console.error("Storage error:", e);
    }
  };

  const handleClear = () => {
    setUrl("");
    setResult(null);
    setError("");
  };

  const handlePaste = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setUrl(text.trim());
          setError("");
        }
      }
    } catch (e) {
      console.warn("Clipboard access failed:", e);
    }
  };

  const handleCopyUrl = () => {
    if (!result?.url) return;
    navigator.clipboard.writeText(result.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = () => {
    if (!result) return;
    try {
      const doc = new jsPDF();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(25, 39, 32);
      doc.text("PhishShield - Threat Audit Report", 20, 25);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated on: ${new Date().toLocaleString()} | SOC Cybersecurity Audit Platform`, 20, 32);

      doc.setDrawColor(200, 200, 200);
      doc.line(20, 37, 190, 37);

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(25, 39, 32);
      doc.text("Target Inspected URL:", 20, 47);
      doc.setFont("courier", "normal");
      doc.setFontSize(10);
      doc.text(result.url, 20, 54);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Scan Verdict:", 20, 67);
      doc.setFontSize(14);
      if (result.prediction === "Phishing") {
        doc.setTextColor(217, 125, 84);
      } else {
        doc.setTextColor(46, 125, 50);
      }
      doc.text(`${result.prediction.toUpperCase()} (Risk Level: ${result.risk_level})`, 20, 75);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(51, 65, 85);
      doc.text(`Confidence Score: ${result.confidence}%`, 20, 85);
      doc.text(`Calculated Threat Score: ${result.risk_score}%`, 20, 92);
      doc.text(`Detection Engine: ${result.tier}`, 20, 99);
      doc.text(`Domain Registry Status: ${result.dns_info?.status || "N/A"}${result.dns_info?.ip ? ` (IP: ${result.dns_info.ip})` : ""}`, 20, 106);

      doc.line(20, 112, 190, 112);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(25, 39, 32);
      doc.text("Security Threat Analysis & Identified Risk Signals:", 20, 122);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      let yOffset = 130;
      if (result.threat_reasons && result.threat_reasons.length > 0) {
        result.threat_reasons.forEach((r) => {
          doc.text(`• ${r}`, 25, yOffset);
          yOffset += 8;
        });
      } else {
        doc.text("• No anomalous threat signals detected in URL structure.", 25, yOffset);
        yOffset += 8;
      }

      yOffset += 10;
      doc.line(20, yOffset, 190, yOffset);
      yOffset += 10;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Key Extracted Features (33 Total):", 20, yOffset);
      yOffset += 8;
      doc.setFont("courier", "normal");
      doc.setFontSize(9);

      const featKeys = Object.keys(result.features || {}).slice(0, 12);
      featKeys.forEach((k) => {
        doc.text(`${k}: ${result.features[k]}`, 25, yOffset);
        yOffset += 6;
      });

      doc.save(`PhishShield_Report_${Date.now()}.pdf`);
    } catch (e) {
      console.error("PDF generation failed:", e);
    }
  };

  return (
    <div className="scanner-page-container">
      {/* Hero Header */}
      <div className="page-header scanner-hero-header">
        <div className="header-badge scanner-badge">
          <span className="pulse-dot"></span>
          <span>REAL-TIME THREAT RADAR // 33-FEATURE ENGINE</span>
        </div>
        <h1 className="scanner-hero-title">URL Phishing & Spoof Scanner</h1>
        <p className="scanner-hero-subtitle">
          Inspect any web address for phishing, brand impersonation, zero-day anomalies, and credential harvesting patterns.
        </p>
      </div>

      {/* If NOT authenticated: show security lockdown screen */}
      {!isAuthenticated ? (
        <div className="scanner-lockdown-card glass-card">
          <div className="lockdown-badge">
            <ShieldAlert size={48} className="lockdown-shield-icon" />
          </div>
          <h3 className="lockdown-title">TERMINAL ACCESS RESTRICTED</h3>
          <div className="lockdown-status-tag">SOC CLEARANCE: UNAUTHENTICATED</div>
          <p className="lockdown-description">
            Live URL phishing analysis, heuristic anomaly checks, and Random Forest classifier 
            inference are strictly restricted to authenticated SOC Security Analysts.
          </p>
          <p className="lockdown-prompt">
            Please log in with your credentials or register a new analyst profile to activate the terminal.
          </p>
          <div className="lockdown-cta-row">
            <Link 
              to="/login" 
              state={{ from: { pathname: "/scanner" }, message: "Please sign in to access the URL Scanner." }} 
              className="cyber-btn-primary lockdown-btn"
            >
              <LogIn size={18} />
              <span>Sign In to Terminal</span>
            </Link>
            <Link to="/register" className="cyber-btn-secondary lockdown-btn">
              <UserPlus size={18} />
              <span>Register New Analyst</span>
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Main Inspection Terminal Card */}
          <div className="scanner-card glass-card">
            {/* Terminal Status Bar */}
            <div className="terminal-header">
              <div className="terminal-status-left">
                <span className="pulse-dot"></span>
                <span className="terminal-status-text">LIVE THREAT INSPECTION TERMINAL</span>
              </div>
              <div className="terminal-status-right">
                <span className="terminal-specs-tag">RF Model v1.2.0 • 33 Features • 99.2% Precision</span>
              </div>
            </div>

            <div className="scanner-card-body">
              {/* Modern Enclosed Omnibar Input */}
              <div className="scanner-omnibar">
                <div className="omnibar-icon-wrapper">
                  <Search size={20} className="omnibar-icon" />
                </div>

                <input
                  type="text"
                  className="scanner-omnibar-input"
                  placeholder="Enter or paste URL to inspect (e.g. https://example.com/login)..."
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    if (error) setError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleScan();
                  }}
                  autoFocus
                />

                <div className="omnibar-actions">
                  {url ? (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="omnibar-action-btn clear-btn"
                      title="Clear input"
                    >
                      <X size={16} />
                      <span className="desktop-only-text">Clear</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handlePaste}
                      className="omnibar-action-btn paste-btn"
                      title="Paste from clipboard"
                    >
                      <Clipboard size={15} />
                      <span className="desktop-only-text">Paste</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleScan()}
                    disabled={loading}
                    className="cyber-btn-primary scan-btn-primary"
                  >
                    <Radar size={18} className={loading ? "spin-icon" : ""} />
                    <span>{loading ? "Analyzing..." : "Scan URL"}</span>
                  </button>
                </div>
              </div>

              {/* Error Banner */}
              {error && (
                <div className="scanner-error-banner" role="alert">
                  <AlertCircle size={18} className="error-icon-accent" />
                  <span>{error}</span>
                  <button type="button" onClick={() => setError("")} className="error-dismiss-btn" aria-label="Dismiss error">
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Quick Presets Section */}
              <div className="scanner-presets-container">
                <div className="presets-group">
                  <span className="presets-group-label">
                    <CheckCircle2 size={14} className="text-sage" /> Verified Safe:
                  </span>
                  <div className="preset-chips-row">
                    {safeSamples.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="preset-pill preset-safe"
                        title={s.desc}
                        onClick={() => {
                          setUrl(s.url);
                          handleScan(s.url);
                        }}
                      >
                        <span className="preset-dot safe-dot"></span>
                        <span className="preset-pill-title">{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="presets-group">
                  <span className="presets-group-label">
                    <AlertTriangle size={14} className="text-terracotta" /> Threat Patterns:
                  </span>
                  <div className="preset-chips-row">
                    {threatSamples.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="preset-pill preset-threat"
                        title={s.desc}
                        onClick={() => {
                          setUrl(s.url);
                          handleScan(s.url);
                        }}
                      >
                        <span className="preset-dot threat-dot"></span>
                        <span className="preset-pill-title">{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Capabilities Bar */}
              <div className="scanner-capabilities-strip">
                <div className="capability-item">
                  <Layers size={14} className="cap-icon" />
                  <span>33 Lexical Features</span>
                </div>
                <div className="capability-item">
                  <Cpu size={14} className="cap-icon" />
                  <span>Random Forest Ensemble</span>
                </div>
                <div className="capability-item">
                  <Globe2 size={14} className="cap-icon" />
                  <span>Live DNS & IP Resolver</span>
                </div>
                <div className="capability-item">
                  <ShieldCheck size={14} className="cap-icon" />
                  <span>Explainable XAI Audit</span>
                </div>
              </div>
            </div>
          </div>

          {/* Scanning Animation State */}
          {loading && (
            <div className="scanning-state-card glass-card">
              <div className="radar-animation-box">
                <div className="radar-pulse-ring ring-1"></div>
                <div className="radar-pulse-ring ring-2"></div>
                <div className="radar-pulse-ring ring-3"></div>
                <div className="radar-center-core">
                  <Radar size={32} className="spin-icon text-sage" />
                </div>
              </div>

              <div className="scanning-steps-block">
                <h4 className="scanning-title">Executing Deep Forensic Inspection</h4>
                <div className="scanning-step-list">
                  <div className={`scan-step-item ${scanStep >= 1 ? "active" : ""}`}>
                    <span className="step-num">1</span>
                    <span>Extracting 33 Structural, Lexical & Entropy Features...</span>
                  </div>
                  <div className={`scan-step-item ${scanStep >= 2 ? "active" : ""}`}>
                    <span className="step-num">2</span>
                    <span>Querying DNS Host Records & Domain Status...</span>
                  </div>
                  <div className={`scan-step-item ${scanStep >= 3 ? "active" : ""}`}>
                    <span className="step-num">3</span>
                    <span>Evaluating Random Forest Tree Ensembles & Confidence...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Scan Result Presentation */}
          {result && !loading && (
            <div className="result-container">
              <div className={`result-card glass-card ${result.prediction === "Phishing" ? "threat-verdict-border" : "safe-verdict-border"}`}>
                {/* Result Header & Verdict Banner */}
                <div className="result-header">
                  <div className="result-verdict-block">
                    <div className={result.prediction === "Phishing" ? "verdict-icon-badge threat-badge" : "verdict-icon-badge safe-badge"}>
                      {result.prediction === "Phishing" ? (
                        <ShieldAlert size={36} />
                      ) : (
                        <ShieldCheck size={36} />
                      )}
                    </div>

                    <div className="verdict-titles">
                      <span className="verdict-overline">SECURITY EVALUATION RESULT</span>
                      <h2 className={`verdict-main-heading ${result.prediction === "Phishing" ? "text-terracotta" : "text-sage"}`}>
                        {result.prediction === "Phishing" ? "MALICIOUS PHISHING DETECTED" : "VERIFIED SAFE WEBSITE"}
                      </h2>
                      <div className="verdict-engine-tag">
                        <span>Detection Engine: <strong>{result.tier}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Copy URL, Download PDF, Rescan */}
                  <div className="result-actions">
                    <button 
                      type="button" 
                      onClick={handleCopyUrl} 
                      className="cyber-btn-secondary btn-sm" 
                      title="Copy scanned URL"
                    >
                      {copied ? <Check size={16} className="text-sage" /> : <Copy size={16} />}
                      <span>{copied ? "Copied!" : "Copy URL"}</span>
                    </button>

                    <button 
                      type="button" 
                      onClick={handleDownloadPDF} 
                      className="cyber-btn-primary btn-sm" 
                      title="Export PDF Forensic Report"
                    >
                      <Download size={16} />
                      <span>Download Report (PDF)</span>
                    </button>

                    <button 
                      type="button" 
                      onClick={handleClear} 
                      className="cyber-btn-secondary btn-sm" 
                      title="Clear and inspect another URL"
                    >
                      <RefreshCw size={15} />
                      <span>New Scan</span>
                    </button>
                  </div>
                </div>

                {/* Result Body 2-Column Grid */}
                <div className="result-body-grid">
                  {/* Left Column: Risk Gauge & Confidence Meter */}
                  <div className="result-gauge-col">
                    <RiskGauge score={result.risk_score} level={result.risk_level} />
                    
                    <div className="confidence-meter-card">
                      <div className="meter-header-row">
                        <span className="meter-title">Model Confidence</span>
                        <span className="meter-val">{result.confidence}%</span>
                      </div>
                      <div className="progress-bar-track">
                        <div
                          className={`progress-bar-fill ${result.prediction === "Phishing" ? "bg-terracotta" : "bg-sage"}`}
                          style={{ width: `${result.confidence}%` }}
                        ></div>
                      </div>
                      <p className="confidence-explainer">
                        {result.prediction === "Phishing"
                          ? "Probability estimate of threat patterns matching known phishing repositories."
                          : "Probability estimate of legitimate institutional web characteristics."}
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Inspected URL, Live DNS, and XAI Explanations */}
                  <div className="result-info-col">
                    {/* URL Card */}
                    <div className="target-url-card">
                      <div className="target-url-top">
                        <span className="target-url-label">INSPECTED URL TARGET</span>
                        <span className={`protocol-badge ${result.url.startsWith("https://") ? "badge-https" : "badge-http"}`}>
                          {result.url.startsWith("https://") ? "HTTPS SECURE PROTOCOL" : "INSECURE / HTTP / IP"}
                        </span>
                      </div>
                      <p className="mono target-url-string">{result.url}</p>
                    </div>

                    {/* Live DNS & IP Strip */}
                    <div className="dns-status-strip">
                      <div className="dns-info-item">
                        <Globe2 size={16} className={result.dns_info?.exists ? "text-sage" : "text-terracotta"} />
                        <span className="dns-label">Domain Registry Status:</span>
                        <strong className={result.dns_info?.exists ? "text-sage" : "text-terracotta"}>
                          {result.dns_info?.status || "Unknown"}
                        </strong>
                      </div>

                      {result.dns_info?.ip && (
                        <div className="dns-info-item">
                          <Server size={16} className="text-sage" />
                          <span className="dns-label">Resolved Host IP:</span>
                          <strong className="mono text-sage">{result.dns_info.ip}</strong>
                        </div>
                      )}
                    </div>

                    {/* Explainable AI (XAI) Threat Breakdown */}
                    <ThreatReasons reasons={result.threat_reasons} prediction={result.prediction} />
                  </div>
                </div>

                {/* Toggle 33 Features Drawer */}
                <div className="feature-toggle-footer">
                  <button
                    type="button"
                    className="feature-toggle-btn"
                    onClick={() => setShowFeatures((prev) => !prev)}
                  >
                    <Sliders size={18} className="toggle-icon" />
                    <span>{showFeatures ? "Collapse 33 Extracted URL Features" : "View All 33 Extracted URL Features"}</span>
                    {showFeatures ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>
                </div>
              </div>

              {/* Collapsible 33 Features Table */}
              {showFeatures && <FeatureTable features={result.features} />}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Scanner;
