import React, { useState } from "react";
import { 
  Radar, 
  Trash2, 
  Copy, 
  Check, 
  Download, 
  ShieldAlert, 
  ShieldCheck, 
  Sparkles, 
  AlertCircle, 
  Sliders, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Globe2,
  Server
} from "lucide-react";
import confetti from "canvas-confetti";
import jsPDF from "jspdf";
import apiService from "../services/api";
import RiskGauge from "../components/RiskGauge";
import ThreatReasons from "../components/ThreatReasons";
import FeatureTable from "../components/FeatureTable";

const Scanner = () => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);

  // Quick preset test samples
  const sampleUrls = [
    { label: "Google (Legitimate)", url: "https://www.google.com/search?q=cybersecurity" },
    { label: "SBI Netbanking (Whitelisted)", url: "https://onlinesbi.sbi/personal/login.html" },
    { label: "IP Phishing Attack", url: "http://174.139.46.123/ap/signin?paypal=verify&update=1" },
    { label: "Subdomain Apple Spoof", url: "https://support-appleld.com.secureupdate.duilawyeryork.com/login" }
  ];

  const handleScan = async (targetUrl = null) => {
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
      const data = await apiService.predictUrl(inputUrl);
      setResult(data);

      if (data.prediction === "Legitimate" && data.risk_score < 25) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.65 },
          colors: ["#10b981", "#00f0ff", "#38bdf8"]
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
      const existing = JSON.parse(localStorage.getItem("phishshield_history") || "[]");
      const record = {
        id: Date.now().toString(),
        url: item.url,
        prediction: item.prediction,
        confidence: item.confidence,
        risk_score: item.risk_score,
        risk_level: item.risk_level,
        tier: item.tier,
        dns: item.dns_info?.status || "Unknown",
        timestamp: new Date().toLocaleString(),
      };
      const updated = [record, ...existing.slice(0, 49)];
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
      doc.setTextColor(15, 23, 42);
      doc.text("PhishShield - Threat Audit Report", 20, 25);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated on: ${new Date().toLocaleString()} | Cybersecurity Audit Platform`, 20, 32);

      doc.setDrawColor(200, 200, 200);
      doc.line(20, 37, 190, 37);

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text("Target URL:", 20, 47);
      doc.setFont("courier", "normal");
      doc.setFontSize(10);
      doc.text(result.url, 20, 54);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Scan Verdict:", 20, 67);
      doc.setFontSize(14);
      if (result.prediction === "Phishing") {
        doc.setTextColor(225, 29, 72);
      } else {
        doc.setTextColor(22, 163, 74);
      }
      doc.text(`${result.prediction.toUpperCase()} (Risk Level: ${result.risk_level})`, 20, 75);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(51, 65, 85);
      doc.text(`Confidence Score: ${result.confidence}%`, 20, 85);
      doc.text(`Calculated Threat Score: ${result.risk_score}%`, 20, 92);
      doc.text(`Detection Mechanism: ${result.tier}`, 20, 99);
      doc.text(`Domain Live Status: ${result.dns_info?.status || "N/A"}${result.dns_info?.ip ? ` (IP: ${result.dns_info.ip})` : ""}`, 20, 106);

      doc.line(20, 112, 190, 112);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
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
      <div className="page-header">
        <div className="header-badge">REAL-TIME THREAT RADAR</div>
        <h2>URL Phishing Scanner</h2>
        <p>Analyze any web address for phishing, credential theft, and spoofing patterns.</p>
      </div>

      {/* Terminal Input Card */}
      <div className="scanner-card glass-card">
        <div className="terminal-header">
          <div className="terminal-dots">
            <span className="dot dot-red"></span>
            <span className="dot dot-yellow"></span>
            <span className="dot dot-green"></span>
          </div>
          <span className="terminal-title">TERMINAL: URL_INSPECTION_MODE</span>
        </div>

        <div className="scanner-input-wrapper">
          <input
            type="text"
            className="scanner-input"
            placeholder="Enter or paste URL (e.g. https://example.com/login)..."
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (error) setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleScan();
            }}
          />

          <div className="scanner-button-row">
            <button
              onClick={() => handleScan()}
              disabled={loading}
              className="cyber-btn-primary scan-btn"
            >
              <Radar size={18} className={loading ? "spin-icon" : ""} />
              <span>{loading ? "Analyzing..." : "Scan URL"}</span>
            </button>

            <button onClick={handleClear} className="cyber-btn-secondary clear-btn" title="Clear input">
              <Trash2 size={18} />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="scanner-error-box">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Sample Presets */}
        <div className="sample-presets">
          <span className="preset-label">Test Samples:</span>
          <div className="preset-chips">
            {sampleUrls.map((s, idx) => (
              <button
                key={idx}
                className="preset-chip"
                onClick={() => {
                  setUrl(s.url);
                  handleScan(s.url);
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scanning Animation */}
      {loading && (
        <div className="scanning-state glass-card">
          <div className="radar-spinner"></div>
          <p className="scan-status-text">
            Executing 30-feature lexical extraction & Random Forest inference...
          </p>
        </div>
      )}

      {/* Result Display Section */}
      {result && !loading && (
        <div className="result-container">
          <div className={`result-card glass-card ${result.prediction === "Phishing" ? "threat-border" : "safe-border"}`}>
            <div className="result-header">
              <div className="result-status-block">
                {result.prediction === "Phishing" ? (
                  <div className="status-icon-phish">
                    <ShieldAlert size={36} />
                  </div>
                ) : (
                  <div className="status-icon-safe">
                    <ShieldCheck size={36} />
                  </div>
                )}
                <div>
                  <span className="verdict-tag">DETECTION VERDICT</span>
                  <h3 className={`verdict-text ${result.prediction === "Phishing" ? "text-phish" : "text-safe"}`}>
                    {result.prediction.toUpperCase()} WEBSITE
                  </h3>
                  <span className="verdict-tier-info">Engine: {result.tier}</span>
                </div>
              </div>

              <div className="result-actions">
                <button onClick={handleCopyUrl} className="cyber-btn-secondary btn-sm" title="Copy scanned URL">
                  {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                  <span>{copied ? "Copied!" : "Copy URL"}</span>
                </button>

                <button onClick={handleDownloadPDF} className="cyber-btn-primary btn-sm" title="Export PDF Audit Report">
                  <Download size={16} />
                  <span>Download Report (PDF)</span>
                </button>
              </div>
            </div>

            <div className="result-body-grid">
              {/* Left Column: Risk Gauge */}
              <div className="result-gauge-col">
                <RiskGauge score={result.risk_score} level={result.risk_level} />
                <div className="confidence-meter-block">
                  <div className="meter-label-row">
                    <span>Model Confidence:</span>
                    <strong>{result.confidence}%</strong>
                  </div>
                  <div className="progress-bar-track">
                    <div
                      className={`progress-bar-fill ${result.prediction === "Phishing" ? "bg-phish" : "bg-safe"}`}
                      style={{ width: `${result.confidence}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Right Column: URL & Live DNS Status & Threat Breakdown */}
              <div className="result-info-col">
                <div className="scanned-url-display">
                  <span className="label">Inspected URL:</span>
                  <p className="mono url-text">{result.url}</p>
                </div>

                {/* Live Domain DNS Status Badge */}
                <div className="dns-status-strip">
                  <div className="dns-info-item">
                    <Globe2 size={16} className={result.dns_info?.exists ? "text-safe" : "text-warn"} />
                    <span>Domain Registry Status:</span>
                    <strong className={result.dns_info?.exists ? "text-safe" : "text-warn"}>
                      {result.dns_info?.status || "Unknown"}
                    </strong>
                  </div>
                  {result.dns_info?.ip && (
                    <div className="dns-info-item">
                      <Server size={16} className="cyan-text" />
                      <span>Resolved IP:</span>
                      <strong className="mono cyan-text">{result.dns_info.ip}</strong>
                    </div>
                  )}
                </div>

                {/* XAI Threat Reasons */}
                <ThreatReasons reasons={result.threat_reasons} prediction={result.prediction} />
              </div>
            </div>

            {/* Toggle 33 Features Button */}
            <div className="feature-toggle-footer">
              <button
                className="feature-toggle-btn"
                onClick={() => setShowFeatures((prev) => !prev)}
              >
                <Sliders size={18} />
                <span>{showFeatures ? "Hide 33 Extracted URL Features" : "View 33 Extracted URL Features"}</span>
                {showFeatures ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
            </div>
          </div>

          {/* Collapsible 33 Features Table */}
          {showFeatures && <FeatureTable features={result.features} />}
        </div>
      )}
    </div>
  );
};

export default Scanner;
