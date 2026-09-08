import React from "react";

const RiskGauge = ({ score, level }) => {
  // score from 0 to 100
  const normalizedScore = Math.min(Math.max(score || 0, 0), 100);
  const radius = 75;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  // Use a 270-degree semi-gauge arc
  const arcFraction = 0.75;
  const arcLength = circumference * arcFraction;
  const strokeDashoffset = arcLength - (arcLength * normalizedScore) / 100;

  // Determine color theme based on level or score
  let color = "var(--green-safe)";
  let glowColor = "rgba(16, 185, 129, 0.4)";
  let badgeClass = "badge-safe";

  if (normalizedScore >= 70 || level === "High") {
    color = "var(--red-threat)";
    glowColor = "rgba(244, 63, 94, 0.4)";
    badgeClass = "badge-phish";
  } else if (normalizedScore >= 45 || level === "Medium") {
    color = "var(--amber-warn)";
    glowColor = "rgba(245, 158, 11, 0.4)";
    badgeClass = "badge-warn";
  } else if (normalizedScore >= 20 || level === "Low") {
    color = "#38bdf8";
    glowColor = "rgba(56, 189, 248, 0.4)";
    badgeClass = "badge-cyan";
  }

  return (
    <div className="risk-gauge-container">
      <div className="gauge-svg-wrapper">
        <svg className="gauge-svg" width="200" height="200" viewBox="0 0 200 200">
          <defs>
            <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#f43f5e" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background Track Arc */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="var(--border-color)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
            transform="rotate(135 100 100)"
          />

          {/* Value Arc */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(135 100 100)"
            style={{
              transition: "stroke-dashoffset 1s ease-out, stroke 0.4s ease",
              filter: `drop-shadow(0 0 8px ${glowColor})`
            }}
          />
        </svg>

        <div className="gauge-center-content">
          <span className="gauge-score-number" style={{ color }}>{normalizedScore.toFixed(1)}%</span>
          <span className="gauge-score-title">THREAT SCORE</span>
          <span className={`badge ${badgeClass} gauge-badge`}>{level || "SAFE"}</span>
        </div>
      </div>
    </div>
  );
};

export default RiskGauge;
