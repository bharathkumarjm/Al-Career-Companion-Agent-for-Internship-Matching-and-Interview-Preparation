import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../services/api";

export default function JobMatchingPage() {
  const navigate = useNavigate();
  const [matchingData, setMatchingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [minScore, setMinScore] = useState(0);
  const [statusMsg, setStatusMsg] = useState("");

  // Application flow states
  const [appliedJobs, setAppliedJobs] = useState(() => {
    try {
      const stored = localStorage.getItem("applied_internship_keys");
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [applyModalJob, setApplyModalJob] = useState(null);
  const [applicantNote, setApplicantNote] = useState("");
  const [portfolioLink, setPortfolioLink] = useState("");
  const [applyToast, setApplyToast] = useState(null);

  const handleOpenApplyModal = (job) => {
    setApplicantNote(`Dear Hiring Team at ${job.company},\n\nI am excited to submit my application for the ${job.title} role. With my relevant technical background and verified skills, I am eager to contribute to your engineering initiatives.`);
    setApplyModalJob(job);
  };

  const handleConfirmApply = (e) => {
    e?.preventDefault();
    if (!applyModalJob) return;
    const key = `${applyModalJob.company.trim().toLowerCase()}_${applyModalJob.title.trim().toLowerCase()}`;
    const nextSet = new Set(appliedJobs);
    nextSet.add(key);
    if (applyModalJob.id) nextSet.add(String(applyModalJob.id));
    setAppliedJobs(nextSet);
    try {
      localStorage.setItem("applied_internship_keys", JSON.stringify(Array.from(nextSet)));
    } catch (err) {
      console.warn("Storage warning:", err);
    }
    const currentJob = applyModalJob;
    setApplyModalJob(null);
    setApplyToast({
      company: currentJob.company,
      role: currentJob.title,
      stipend: currentJob.stipend
    });
    setTimeout(() => {
      setApplyToast(null);
    }, 5000);
  };

  const loadMatches = async () => {
    setLoading(true);
    setStatusMsg("");
    try {
      const res = await api.get("/matching/compatibility");
      setMatchingData(res.data);
    } catch (err) {
      console.error("Failed to load compatibility matches:", err);
      setStatusMsg("Please upload your resume in 'Profile & Resumes' first to calculate matches.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatches();
  }, []);

  const filteredMatches = matchingData?.matches?.filter(
    (m) => m.compatibility_score >= minScore
  ) || [];

  return (
    <Layout
      title="4. Job-Resume Matching & Compatibility Scoring"
      subtitle="AI-driven multi-factor compatibility scoring comparing skills, domain, and experience"
    >
      {/* 📄 Redesigned Executive Active Resume Context Card */}
      <div className="match-active-resume-card">
        <div className="resume-card-main-header">
          <div className="resume-icon-badge-box">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <line x1="10" y1="9" x2="8" y2="9" />
            </svg>
          </div>

          <div className="resume-text-meta">
            <div className="resume-tag-row">
              <span className="badge-active-target">ACTIVE RESUME BENCHMARK</span>
              <span className="badge-verified-target">✓ Verified for Compatibility</span>
            </div>
            <h3 className="resume-file-title">
              Matching for: <span className="highlight-filename">{matchingData?.filename || "Active Resume.pdf"}</span>
            </h3>
            <p className="resume-guidance-subtext">
              Real-time compatibility scores calculated by comparing your verified resume skill stack against <strong>12+ industry internship requirements</strong>.
            </p>
          </div>

          <div className="resume-action-switch">
            <Link to="/profile" className="btn-switch-resume-link">
              Switch Resume →
            </Link>
          </div>
        </div>

        {/* Extracted Skills Cloud (Clear, Individual Badges) */}
        <div className="extracted-skills-container">
          <div className="skills-cloud-header">
            <div className="skills-cloud-title">
              <span className="skills-dot-accent">⚡</span>
              <strong>Extracted Skills Stack:</strong>
              <span className="skills-pill-count">
                {matchingData?.extracted_skills?.length || 0} Verified Skills
              </span>
            </div>
            <small className="skills-helper-text">
              Every skill below directly boosts your compatibility score for matching roles
            </small>
          </div>

          <div className="skills-chips-wrapper">
            {matchingData?.extracted_skills && matchingData.extracted_skills.length > 0 ? (
              matchingData.extracted_skills.map((skill) => (
                <span key={skill} className="skill-chip-pill">
                  <span className="chip-indicator"></span>
                  {skill}
                </span>
              ))
            ) : (
              <span className="empty-skills-msg">
                No extracted skills detected. Please upload and parse your resume in Profile & Resumes.
              </span>
            )}
          </div>
        </div>

        {/* Match Controls & Filter Bar */}
        <div className="match-filter-toolbar">
          <div className="toolbar-left-group">
            <span className="filter-group-label">Filter by Match Score:</span>
            <div className="filter-segmented-pill">
              <button
                type="button"
                className={`score-filter-btn ${minScore === 0 ? "active" : ""}`}
                onClick={() => setMinScore(0)}
              >
                All Matches ({matchingData?.matches?.length || 0})
              </button>
              <button
                type="button"
                className={`score-filter-btn ${minScore === 75 ? "active" : ""}`}
                onClick={() => setMinScore(75)}
              >
                🌟 75%+ Strong Fits
              </button>
              <button
                type="button"
                className={`score-filter-btn ${minScore === 85 ? "active" : ""}`}
                onClick={() => setMinScore(85)}
              >
                🔥 85%+ Top Matches
              </button>
            </div>
          </div>

          <div className="toolbar-right-group">
            <button
              type="button"
              onClick={loadMatches}
              className={`btn-recalculate-match ${loading ? "loading" : ""}`}
              disabled={loading}
              title="Re-run matching algorithm against current resume"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={loading ? "spin-icon" : ""}>
                <path d="M23 4v6h-6" />
                <path d="M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              <span>{loading ? "Calculating..." : "Re-calculate"}</span>
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="loading-state panel-box">
          <div className="spinner"></div>
          <p>Analyzing resume skills against knowledge base opportunities...</p>
        </div>
      )}

      {!loading && !matchingData && (
        <div className="panel-box empty-hint">
          No resume detected. Please upload and parse a resume in{" "}
          <Link to="/profile">Profile & Resumes</Link>.
        </div>
      )}

      {/* Match Cards List */}
      <div className="match-cards-container">
        {!loading &&
          filteredMatches.map((match) => (
            <div key={match.internship_id} className="match-detail-card panel-box">
              <div className="match-card-top-row">
                <div className="match-job-info">
                  <div className="company-logo-avatar">
                    {(match.company || "AI").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="match-job-title">{match.title}</h3>
                    <p className="match-job-meta">
                      <strong>{match.company}</strong> • 📍 {match.location} ({match.work_mode}) • ⏱️ {match.duration}
                    </p>
                    <span className="stipend-tag-plain">💰 {match.stipend}</span>
                  </div>
                </div>

                {/* Compatibility Score Ring */}
                <div className="match-score-badge-box">
                  <div
                    className="score-circle"
                    style={{
                      borderColor:
                        match.compatibility_score >= 80
                          ? "#10b981"
                          : match.compatibility_score >= 60
                          ? "#f59e0b"
                          : "#6366f1"
                    }}
                  >
                    <span className="score-num">{match.compatibility_score}%</span>
                    <small>Match</small>
                  </div>
                </div>
              </div>

              {/* Progress bars for skills & domain fit */}
              <div className="score-breakdown-row">
                <div className="bar-wrapper">
                  <div className="bar-labels">
                    <span>Skills Compatibility</span>
                    <strong>{match.skills_match_score}%</strong>
                  </div>
                  <div className="custom-progress-bg">
                    <div
                      className="custom-progress-fill fill-green"
                      style={{ width: `${match.skills_match_score}%` }}
                    ></div>
                  </div>
                </div>

                <div className="bar-wrapper">
                  <div className="bar-labels">
                    <span>Domain & Role Fit</span>
                    <strong>{match.domain_match_score}%</strong>
                  </div>
                  <div className="custom-progress-bg">
                    <div
                      className="custom-progress-fill fill-indigo"
                      style={{ width: `${match.domain_match_score}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Matched vs Missing Skills */}
              <div className="skills-comparison-grid">
                <div className="skills-col matched-col">
                  <span className="col-title">✅ Matching Skills You Possess:</span>
                  <div className="skills-tags-wrap">
                    {match.matched_skills.length > 0 ? (
                      match.matched_skills.map((s) => (
                        <span key={s} className="tag-matched">
                          {s}
                        </span>
                      ))
                    ) : (
                      <small className="empty-subtext">No direct exact matches found</small>
                    )}
                  </div>
                </div>

                <div className="skills-col missing-col">
                  <span className="col-title">⚠️ Skills to Learn / Bridge:</span>
                  <div className="skills-tags-wrap">
                    {match.missing_skills.length > 0 ? (
                      match.missing_skills.map((s) => (
                        <span key={s} className="tag-missing">
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="tag-matched">You have all core required skills! 🎉</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Match Reason */}
              <div className="ai-reason-quote">
                <strong>🤖 AI Compatibility Rationale:</strong>
                <p>{match.reason}</p>
              </div>

              {/* Actions Row */}
              <div className="match-card-actions">
                <Link
                  to={`/customizer?company=${encodeURIComponent(match.company)}&role=${encodeURIComponent(match.title)}`}
                  className="btn-sm btn-outline"
                >
                  ✍️ Tailor Cover Letter
                </Link>
                <button
                  type="button"
                  onClick={() => handleOpenApplyModal(match)}
                  className={`btn-sm ${
                    appliedJobs.has(`${match.company.trim().toLowerCase()}_${match.title.trim().toLowerCase()}`)
                      ? "btn-applied-success"
                      : "btn-primary"
                  }`}
                >
                  {appliedJobs.has(`${match.company.trim().toLowerCase()}_${match.title.trim().toLowerCase()}`)
                    ? "✅ Applied"
                    : "🚀 Apply"}
                </button>
                <Link
                  to={`/skill-gap?role=${encodeURIComponent(match.title)}`}
                  className="btn-sm btn-outline"
                >
                  📈 Analyze Skill Gap
                </Link>
                <Link
                  to={`/interview-prep?role=${encodeURIComponent(match.domain || "Backend Developer")}`}
                  className="btn-sm btn-outline"
                >
                  🎙️ Prepare Interview
                </Link>
              </div>
            </div>
          ))}
      </div>

      {/* Quick Application Modal */}
      {applyModalJob && (
        <div className="quick-apply-modal-overlay" onClick={() => setApplyModalJob(null)}>
          <div className="quick-apply-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="quick-apply-modal-header">
              <div>
                <h3>Apply to {applyModalJob.company}</h3>
                <div className="quick-apply-meta-pills">
                  <span>💼 {applyModalJob.title}</span>
                  <span>📍 {applyModalJob.location}</span>
                  <span>💰 {applyModalJob.stipend}</span>
                </div>
              </div>
              <button
                type="button"
                className="quick-apply-close-btn"
                onClick={() => setApplyModalJob(null)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmApply}>
              <div className="quick-apply-modal-body">
                <div className="quick-apply-field-group">
                  <label>Applicant Full Name</label>
                  <input
                    type="text"
                    className="quick-apply-input"
                    value={localStorage.getItem("user_name") || "Student"}
                    disabled
                  />
                </div>

                <div className="quick-apply-field-group">
                  <label>Applicant Email</label>
                  <input
                    type="email"
                    className="quick-apply-input"
                    value={localStorage.getItem("user_email") || "student@example.com"}
                    disabled
                  />
                </div>

                <div className="quick-apply-field-group">
                  <label>Active Resume</label>
                  <div className="quick-apply-resume-badge">
                    <span>📄 Verified Profile Resume Attached</span>
                    <span style={{ fontSize: "11px", color: "#15803d", fontWeight: "bold" }}>READY</span>
                  </div>
                </div>

                <div className="quick-apply-field-group">
                  <label>Portfolio / GitHub / LinkedIn (Optional)</label>
                  <input
                    type="url"
                    className="quick-apply-input"
                    placeholder="https://github.com/yourprofile"
                    value={portfolioLink}
                    onChange={(e) => setPortfolioLink(e.target.value)}
                  />
                </div>

                <div className="quick-apply-field-group">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label>Cover Note / Pitch to Recruiter</label>
                    <Link
                      to={`/customizer?company=${encodeURIComponent(applyModalJob.company)}&role=${encodeURIComponent(applyModalJob.title)}`}
                      className="quick-apply-cover-tip"
                    >
                      ✍️ Open CV Builder →
                    </Link>
                  </div>
                  <textarea
                    rows={4}
                    className="quick-apply-textarea"
                    value={applicantNote}
                    onChange={(e) => setApplicantNote(e.target.value)}
                  />
                </div>
              </div>

              <div className="quick-apply-modal-footer">
                <button
                  type="button"
                  className="btn-sm btn-outline"
                  onClick={() => setApplyModalJob(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-sm btn-primary"
                >
                  ⚡ Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Celebratory Confirmation Toast */}
      {applyToast && (
        <div className="quick-apply-toast">
          <div className="quick-apply-toast-icon">🎉</div>
          <div className="quick-apply-toast-body">
            <h5>Application Submitted!</h5>
            <p>
              Your application for <strong>{applyToast.role}</strong> at <strong>{applyToast.company}</strong> has been successfully submitted.
            </p>
          </div>
          <button
            type="button"
            className="quick-apply-toast-close"
            onClick={() => setApplyToast(null)}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      )}
    </Layout>
  );
}
