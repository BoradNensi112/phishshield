import React, { useState } from "react";
import { Search, SlidersHorizontal, CheckCircle2, AlertTriangle, Layers } from "lucide-react";

const FEATURE_CATEGORIES = {
  url_length: "Structural",
  domain_length: "Structural",
  path_length: "Structural",
  query_length: "Structural",
  num_dots: "Lexical",
  num_hyphens: "Lexical",
  num_underscores: "Lexical",
  num_slashes: "Structural",
  num_question_marks: "Lexical",
  num_equals: "Lexical",
  num_at_symbol: "Security",
  num_percent: "Security",
  num_digits: "Statistical",
  num_special_chars: "Lexical",
  has_https: "Security",
  is_ip_address: "Security",
  count_subdomains: "Structural",
  has_double_slash_redirect: "Security",
  has_port_number: "Security",
  shannon_entropy: "Statistical",
  is_url_shortened: "Security",
  brand_spoofing_keyword: "Security",
  tld_length: "Structural",
  suspicious_tld_flag: "Security",
  digit_to_letter_ratio: "Statistical",
  consecutive_hyphens_count: "Lexical",
  homograph_punycode_flag: "Security",
  count_vowels_in_domain: "Statistical",
  count_consonants_in_domain: "Statistical",
  has_sensitive_words_in_path: "Security",
};

const FeatureTable = ({ features }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCat, setSelectedCat] = useState("All");

  if (!features || Object.keys(features).length === 0) {
    return null;
  }

  const categories = ["All", "Security", "Statistical", "Structural", "Lexical"];

  const featureList = Object.entries(features).map(([key, val]) => ({
    name: key,
    value: val,
    category: FEATURE_CATEGORIES[key] || "General",
  }));

  const filtered = featureList.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCat === "All" || item.category === selectedCat;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="feature-drawer-card glass-card">
      <div className="feature-header">
        <div className="feature-title-block">
          <Layers size={22} className="feature-icon-accent" />
          <div>
            <h3>30-Feature Deep Neural Inspection</h3>
            <p>Lexical, structural & entropy characteristics extracted for ML evaluation</p>
          </div>
        </div>

        <div className="feature-filter-row">
          <div className="filter-search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search feature name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="cat-pill-group">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`cat-pill ${selectedCat === cat ? "active" : ""}`}
                onClick={() => setSelectedCat(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="feature-table-wrapper">
        <table className="cyber-table">
          <thead>
            <tr>
              <th>Feature Name</th>
              <th>Category</th>
              <th>Extracted Value</th>
              <th>Risk Signal</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => {
              const isSuspicious =
                (item.name === "is_ip_address" && item.value === 1) ||
                (item.name === "brand_spoofing_keyword" && item.value === 1) ||
                (item.name === "has_https" && item.value === 0) ||
                (item.name === "shannon_entropy" && item.value >= 4.4) ||
                (item.name === "count_subdomains" && item.value >= 3) ||
                (item.name === "suspicious_tld_flag" && item.value === 1) ||
                (item.name === "is_url_shortened" && item.value === 1) ||
                (item.name === "has_sensitive_words_in_path" && item.value > 0);

              return (
                <tr key={item.name} className={isSuspicious ? "row-flagged" : ""}>
                  <td className="mono feature-cell-name">
                    {item.name}
                  </td>
                  <td>
                    <span className={`badge cat-badge-${item.category.toLowerCase()}`}>
                      {item.category}
                    </span>
                  </td>
                  <td className="mono feature-val">
                    {typeof item.value === "boolean" ? (item.value ? "True" : "False") : item.value}
                  </td>
                  <td>
                    {isSuspicious ? (
                      <span className="risk-indicator threat">
                        <AlertTriangle size={15} /> Flagged Anomaly
                      </span>
                    ) : (
                      <span className="risk-indicator normal">
                        <CheckCircle2 size={15} /> Normal Range
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FeatureTable;
