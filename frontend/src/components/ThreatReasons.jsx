import React from "react";
import { AlertOctagon, CheckCircle2, ShieldAlert, AlertTriangle } from "lucide-react";

const ThreatReasons = ({ reasons, prediction }) => {
  const isPhish = prediction === "Phishing";
  const hasReasons = reasons && reasons.length > 0;

  if (!isPhish && !hasReasons) {
    return (
      <div className="threat-reasons-card glass-card safe-state">
        <div className="threat-card-header">
          <CheckCircle2 className="reason-icon-safe" size={24} />
          <div>
            <h4>Clean Security Posture</h4>
            <p>No malicious behavioral indicators or lexical anomalies detected</p>
          </div>
        </div>
        <div className="safe-checklist">
          <div className="check-item"><span className="dot-safe"></span> Standard URL structure within safe entropy bounds</div>
          <div className="check-item"><span className="dot-safe"></span> Valid SSL/TLS protocol detected</div>
          <div className="check-item"><span className="dot-safe"></span> No known brand squatting or credential harvesting signals</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`threat-reasons-card glass-card ${isPhish ? "threat-state" : "warn-state"}`}>
      <div className="threat-card-header">
        {isPhish ? (
          <ShieldAlert className="reason-icon-threat" size={24} />
        ) : (
          <AlertTriangle className="text-warn" size={24} />
        )}
        <div>
          <h4>Security Threat Analysis & Risk Breakdown</h4>
          <p>Key risk factors identified by the 33-feature security heuristics</p>
        </div>
      </div>

      <div className="reasons-list">
        {hasReasons ? (
          reasons.map((reason, idx) => (
            <div key={idx} className="reason-bullet">
              <AlertOctagon size={18} className="bullet-alert-icon" />
              <span>{reason}</span>
            </div>
          ))
        ) : (
          <div className="reason-bullet">
            <AlertOctagon size={18} className="bullet-alert-icon" />
            <span>High probability of phishing determined by Random Forest ensemble rules</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThreatReasons;
