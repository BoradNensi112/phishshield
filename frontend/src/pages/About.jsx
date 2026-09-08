import { 
  ShieldCheck, Brain, Database, Code, BookOpen 
} from "lucide-react";

const About = () => {
  return (
    <div className="about-page-container">
      <div className="page-header">
        <div className="header-badge">PROJECT SPECIFICATIONS & ARCHITECTURE</div>
        <h2>About PhishShield</h2>
        <p>BCA Final Year Capstone Project • Machine Learning Cyber Security Architecture</p>
      </div>

      {/* 1. Problem Statement & Objectives */}
      <div className="about-grid">
        <div className="glass-card doc-card">
          <div className="doc-card-header">
            <ShieldCheck size={24} className="cyan-text" />
            <h3>Problem Statement</h3>
          </div>
          <p>
            Phishing remains the #1 initial infection vector in global cyber attacks, accounting for over 
            <strong> 80% of reported security incidents</strong>. Attackers constantly generate new domains, 
            spoofed banking portals, and obfuscated subdomains that bypass conventional domain blacklists. 
            Conventional content crawlers present security hazards by sending live HTTP requests to infected servers.
          </p>
        </div>

        <div className="glass-card doc-card">
          <div className="doc-card-header">
            <Brain size={24} className="green-text" />
            <h3>Project Objective</h3>
          </div>
          <p>
            To design, train, and deploy an intelligent, client-safe <strong>Hybrid Phishing Detection System</strong> 
            that analyzes purely the structural and mathematical properties of URL strings in real-time (&lt;15ms), 
            achieving zero-day detection without executing untrusted web code, coupled with an algorithmic threat forensics engine.
          </p>
        </div>
      </div>

      {/* 2. Dataset Information */}
      <div className="glass-card doc-card full-width-card">
        <div className="doc-card-header">
          <Database size={24} className="purple-text" />
          <h3>Benchmark Dataset Architecture</h3>
        </div>
        <p>
          The system is trained on a gold-standard benchmark dataset comprising <strong>11,430 verified URLs</strong>. 
          To prevent algorithmic bias, the dataset is strictly balanced with a 50:50 ratio:
        </p>

        <div className="dataset-stats-row">
          <div className="dataset-stat-badge">
            <span className="stat-big">11,430</span>
            <span className="stat-desc">Total URLs Evaluated</span>
          </div>
          <div className="dataset-stat-badge">
            <span className="stat-big text-safe">5,715</span>
            <span className="stat-desc">Legitimate Clean URLs</span>
          </div>
          <div className="dataset-stat-badge">
            <span className="stat-big text-phish">5,715</span>
            <span className="stat-desc">Confirmed Phishing Attacks</span>
          </div>
          <div className="dataset-stat-badge">
            <span className="stat-big cyan-text">80 / 20</span>
            <span className="stat-desc">Train / Test Stratified Split</span>
          </div>
        </div>
      </div>

      {/* 3. Mathematical Formula: Shannon Entropy */}
      <div className="glass-card doc-card full-width-card">
        <div className="doc-card-header">
          <BookOpen size={24} className="cyan-text" />
          <h3>Mathematical Feature: Shannon Entropy Analysis</h3>
        </div>
        <p>
          Phishing campaigns and Domain Generation Algorithms (DGAs) frequently generate pseudo-random alphanumeric 
          strings. We implement Claude Shannon's Information Theory formula to quantify the uncertainty and randomness 
          of character distributions in every URL:
        </p>

        <div className="entropy-math-box">
          <span className="formula mono">H(X) = - ∑ P(xᵢ) · log₂(P(xᵢ))</span>
          <p className="formula-desc">
            Where <em>P(xᵢ)</em> is the frequency probability of character <em>xᵢ</em> in the URL string. 
            Legitimate human-readable domains exhibit lower entropy (~2.5 - 3.8), whereas obfuscated phishing 
            payloads generate high entropy (&gt; 4.4), serving as a crucial indicator for Random Forest decision trees.
          </p>
        </div>
      </div>

      {/* 4. Technologies Used */}
      <div className="glass-card doc-card full-width-card">
        <div className="doc-card-header">
          <Code size={24} className="cyan-text" />
          <h3>Technologies Used</h3>
        </div>

        <div className="tech-stack-pills">
          <div className="tech-pill"><strong>Frontend:</strong> React 18 (Vite), JavaScript</div>
          <div className="tech-pill"><strong>Styling:</strong> Pure CSS (Cyber SOC Dark & Light Themes)</div>
          <div className="tech-pill"><strong>Visualizations:</strong> Recharts, Lucide Icons</div>
          <div className="tech-pill"><strong>Backend:</strong> Python 3.11, FastAPI, Uvicorn, Pydantic</div>
          <div className="tech-pill"><strong>Machine Learning:</strong> Scikit-Learn, Random Forest, Pandas, NumPy</div>
          <div className="tech-pill"><strong>Model Persistence:</strong> Joblib, JSON Meta Store</div>
          <div className="tech-pill"><strong>Export:</strong> jsPDF for Audit Threat Reports</div>
        </div>
      </div>
    </div>
  );
};

export default About;
