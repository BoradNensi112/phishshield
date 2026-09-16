import React, { useState } from "react";
import { 
  ShieldCheck, Radar, History, UserCheck, Send, 
  HelpCircle, CheckCircle2, AlertCircle, ArrowRight, ShieldAlert, MessageSquare 
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import apiService from "../services/api";

const About = () => {
  const { currentUser, isAuthenticated } = useAuth();

  // Support Form State
  const [name, setName] = useState(currentUser?.name || "");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [subject, setSubject] = useState("False Positive / Scam Link Question");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);

  const handleSubmitMessage = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setNotice({ type: "error", msg: "Please fill out all fields before sending." });
      return;
    }

    try {
      setSubmitting(true);
      await apiService.sendSupportMessage({
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim()
      });
      setNotice({ 
        type: "success", 
        msg: "Your message has been delivered to the Security Administrator! They will inspect your inquiry." 
      });
      setMessage("");
    } catch (err) {
      setNotice({ type: "error", msg: "Could not send message. Please try again later." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="about-page-container">
      {/* Header */}
      <div className="page-header">
        <div className="header-badge">SECURITY PLATFORM GUIDE & SUPPORT</div>
        <h2>About PhishShield</h2>
        <p>Comprehensive Threat Intelligence Guide & Direct Security Administration Help Desk</p>
      </div>

      {/* SECTION 1: KYA KAR SAKTE HAIN (PLATFORM CAPABILITIES) */}
      <div className="about-section-block">
        <div className="section-title-wrap">
          <ShieldCheck size={22} className="text-sage" />
          <h3 className="section-heading">Kya Kar Sakte Hain? (What PhishShield Does)</h3>
        </div>
        <p className="section-subtext">
          PhishShield ek advanced cyber defense terminal hai jo internet par aane wali shaq wali aur farzi links (phishing scams) se aapko surakshit rakhta hai.
        </p>

        <div className="tactile-features-grid">
          <div className="glass-card tactile-feature-card">
            <div className="feature-icon-circle icon-orange">
              <Radar size={24} />
            </div>
            <h4>Instant Threat Detection</h4>
            <p>
              Kisi bhi URL ko kholne se pehle check karein. Hamara system fake banking portals, duplicate social media login pages, aur fraud links ko seconds me identify karta hai.
            </p>
          </div>

          <div className="glass-card tactile-feature-card">
            <div className="feature-icon-circle icon-green">
              <ShieldCheck size={24} />
            </div>
            <h4>Safe & Heuristic Analysis</h4>
            <p>
              Ye tool direct dangerous website par jakar aapka computer kharab nahi karta, balki URL string ke lakshan (patterns) dekh kar safe verdict deta hai.
            </p>
          </div>

          <div className="glass-card tactile-feature-card">
            <div className="feature-icon-circle icon-stone">
              <History size={24} />
            </div>
            <h4>Personal Scan History & Bulk Delete</h4>
            <p>
              Aapne jo jo links scan ki hain, wo sirf aapke private account me save rehti hain. Aap unhe filter kar sakte hain, CSV me export kar sakte hain ya ek click me delete kar sakte hain.
            </p>
          </div>

          <div className="glass-card tactile-feature-card">
            <div className="feature-icon-circle icon-blue">
              <UserCheck size={24} />
            </div>
            <h4>Centralized Admin Governance</h4>
            <p>
              Organization heads aur Administrators poore system ke users manage kar sakte hain, security accounts suspend/activate kar sakte hain, aur global threat logs inspect kar sakte hain.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 2: KAISE KAR SAKTE HAIN (4-STEP HOW-TO GUIDE) */}
      <div className="about-section-block">
        <div className="section-title-wrap">
          <HelpCircle size={22} className="text-terracotta" />
          <h3 className="section-heading">Kaise Kar Sakte Hain? (How to Use PhishShield in 4 Steps)</h3>
        </div>

        <div className="how-to-steps-container">
          <div className="how-to-step-card glass-card">
            <div className="step-number-badge">1</div>
            <h4>Sign In to Terminal</h4>
            <p>
              Apna work email aur password daal kar login karein. Agar naye hain to "Register" par click karke naya account banayein.
            </p>
          </div>

          <div className="how-to-step-card glass-card">
            <div className="step-number-badge">2</div>
            <h4>Paste Suspicious URL</h4>
            <p>
              Navigation bar se <strong>"URL Scanner"</strong> tab par jayein aur jo link shaq wali lag rahi hai, use input box me paste karein.
            </p>
          </div>

          <div className="how-to-step-card glass-card">
            <div className="step-number-badge">3</div>
            <h4>Analyze Result</h4>
            <p>
              <strong>"Analyze Threat"</strong> button dabayein. System aapko <em>Safe (Clean)</em> ya <em>Phishing (Malicious)</em> ka clear verdict aur threat score dikhayega.
            </p>
          </div>

          <div className="how-to-step-card glass-card">
            <div className="step-number-badge">4</div>
            <h4>Manage Scan Records</h4>
            <p>
              <strong>"Scan History"</strong> me jakar purane scans dekhein, checkboxes tick karke bulk delete karein ya reports CSV me download karein.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 3: CONTACT ADMIN & SUPPORT DESK (PROBLEM SOLUTION) */}
      <div className="about-section-block">
        <div className="glass-card support-form-card">
          <div className="support-form-header">
            <div className="support-icon-wrap">
              <MessageSquare size={26} color="var(--terracotta)" />
            </div>
            <div>
              <h3>Koi Problem Aayi? Admin Ko Inform Karein</h3>
              <p>
                Agar kisi link ka result galat laga ho, scan me error aaya ho, ya account related koi sawaal ho, to niche message bhej kar seedha Administrator se contact karein.
              </p>
            </div>
          </div>

          {notice && (
            <div className={`admin-notice-banner ${notice.type === "success" ? "admin-notice-success" : "admin-notice-error"}`}>
              {notice.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span>{notice.msg}</span>
            </div>
          )}

          <form onSubmit={handleSubmitMessage} className="support-message-form">
            <div className="support-form-grid">
              <div className="support-input-group">
                <label>Aapka Naam (Name):</label>
                <input
                  type="text"
                  className="cyber-input"
                  placeholder="e.g. Nensi Borad"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="support-input-group">
                <label>Email Address:</label>
                <input
                  type="email"
                  className="cyber-input"
                  placeholder="analyst@phishshield.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="support-input-group">
              <label>Kis Baare Me Help Chahiye? (Subject):</label>
              <select
                className="admin-role-select"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              >
                <option value="False Positive / Scam Link Question">False Positive / Link Verification Issue</option>
                <option value="Scanner Error / Link Not Analyzing">Scanner Error / Link Not Analyzing</option>
                <option value="Account & Access Support">Account Credentials & Access Support</option>
                <option value="Feature Suggestion">Feature Suggestion or Feedback</option>
                <option value="Other Problem">Other Technical Problem</option>
              </select>
            </div>

            <div className="support-input-group">
              <label>Aapka Message / Detail Problem:</label>
              <textarea
                className="cyber-input"
                rows="4"
                placeholder="Yahan apni problem ya sawaal likhein..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="cyber-btn-primary"
              style={{ alignSelf: "flex-start", marginTop: "8px" }}
            >
              {submitting ? (
                <span>Sending Message to Admin...</span>
              ) : (
                <>
                  <Send size={16} />
                  <span>Send Message to Administrator</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default About;
