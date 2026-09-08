import React from "react";
import { ShieldCheck, Cpu, Code2, Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="cyber-footer">
      <div className="footer-container">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="footer-logo">
              <ShieldCheck size={24} className="footer-shield" />
              <span className="footer-title">PhishShield</span>
            </div>
            <p className="footer-desc">
              Advanced Machine Learning Web Page Phishing Detection System. Combining 33 URL Lexical Heuristics, Shannon Entropy Analysis, and Random Forest Classifier for Real-Time Threat Mitigation.
            </p>
          </div>

          <div className="footer-meta">
            <h4>Project Architecture</h4>
            <ul className="footer-list">
              <li><Cpu size={14} /> Model: Random Forest Classifier (150 Trees, 95.8% ROC-AUC)</li>
              <li><Code2 size={14} /> Stack: React (Vite) + Python (FastAPI) + Scikit-Learn</li>
              <li><ShieldCheck size={14} /> Dataset: 11,430 Balanced Verified URLs</li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 PhishShield • Advanced Cybersecurity & Machine Learning Platform. All Rights Reserved.</p>
          <p className="footer-badges">
            <span className="footer-pill">Production Quality</span>
            <span className="footer-pill">Zero-Day Detection</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
