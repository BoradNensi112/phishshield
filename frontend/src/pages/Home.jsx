import React from "react";
import { Link } from "react-router-dom";
import { Shield, Radar, Zap, Lock, Cpu, ArrowRight, BarChart3, CheckCircle, AlertTriangle } from "lucide-react";

const Home = () => {
  return (
    <div className="home-page-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-badge">
          <span className="pulsing-radar-dot"></span>
          <span>CYBER DEFENSE PLATFORM • ZERO-DAY PHISHING MITIGATION</span>
        </div>

        <h1 className="hero-title">
          Next-Gen Machine Learning <br />
          <span className="gradient-text">Phishing Website Detection</span>
        </h1>

        <p className="hero-description">
          PhishShield inspects suspicious URLs in real-time using a <strong>2-tier Hybrid Architecture</strong>. 
          Extracting 33 lexical, structural, and Shannon entropy characteristics, powered by an ensemble 
          <strong> Random Forest Classifier</strong> trained on 11,430 verified benchmark URLs.
        </p>

        <div className="hero-cta-group">
          <Link to="/scanner" className="cyber-btn-primary hero-btn">
            <Radar size={20} />
            <span>Scan URL Now</span>
            <ArrowRight size={18} />
          </Link>
          <Link to="/dashboard" className="cyber-btn-secondary hero-btn">
            <BarChart3 size={20} />
            <span>Threat Dashboard</span>
          </Link>
        </div>

        {/* Animated Cyber Shield Illustration */}
        <div className="hero-radar-display">
          <div className="radar-circle circle-1"></div>
          <div className="radar-circle circle-2"></div>
          <div className="radar-circle circle-3"></div>
          <div className="radar-scanner-sweep"></div>
          <div className="radar-center-shield">
            <Shield size={64} className="radar-shield-icon" />
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="features-section">
        <div className="section-heading">
          <h2>Core Architectural Pillars</h2>
          <p>Engineered for high accuracy, zero-latency inference, and explainable cybersecurity.</p>
        </div>

        <div className="features-grid">
          <div className="glass-card feature-card">
            <div className="feature-card-icon cyan-icon">
              <Zap size={28} />
            </div>
            <h3>33-Feature Lexical Engine</h3>
            <p>
              Extracts Shannon entropy, IP address indicators, homograph punycode, TLD reputation, 
              and brand squatting signals directly from the URL string without crawling dangerous web pages.
            </p>
          </div>

          <div className="glass-card feature-card">
            <div className="feature-card-icon green-icon">
              <Lock size={28} />
            </div>
            <h3>2-Tier Hybrid Pipeline</h3>
            <p>
              Layer 1 leverages an instantaneous allowlist for verified domains (Google, SBI, Microsoft). 
              Layer 2 executes Random Forest ML inference to detect zero-day phishing variants.
            </p>
          </div>

          <div className="glass-card feature-card">
            <div className="feature-card-icon purple-icon">
              <Cpu size={28} />
            </div>
            <h3>Security Threat Forensics</h3>
            <p>
              Provides human-readable threat justification breakdown alongside confidence percentages, 
              ensuring non-technical users and security analysts understand exactly why a URL was blocked.
            </p>
          </div>
        </div>
      </section>

      {/* Live Benchmark Stats */}
      <section className="stats-banner glass-card">
        <div className="stat-box">
          <span className="stat-number">11,430</span>
          <span className="stat-label">Trained Benchmark URLs</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-box">
          <span className="stat-number">95.84%</span>
          <span className="stat-label">Model ROC-AUC Score</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-box">
          <span className="stat-number">33</span>
          <span className="stat-label">Extracted URL Features</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-box">
          <span className="stat-number">&lt; 15 ms</span>
          <span className="stat-label">Average Inference Latency</span>
        </div>
      </section>
    </div>
  );
};

export default Home;
