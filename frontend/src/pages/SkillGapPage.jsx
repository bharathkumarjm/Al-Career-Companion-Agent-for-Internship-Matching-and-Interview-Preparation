import { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../services/api";

export default function SkillGapPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRole = searchParams.get("role") || "Backend Developer";

  const [roles, setRoles] = useState([]);
  const [targetRole, setTargetRole] = useState(initialRole);
  const [customRole, setCustomRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [showJdInput, setShowJdInput] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    if (statusMsg) {
      const timer = setTimeout(() => setStatusMsg(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [statusMsg]);
  const [activeTab, setActiveTab] = useState("overview"); // overview, matrix, roadmap, courses, projects, all
  const [completedTasks, setCompletedTasks] = useState({});
  const [copiedIndex, setCopiedIndex] = useState(null);

  const roleIcons = {
    "Backend Developer": "💻",
    "Frontend Developer": "🎨",
    "Full Stack Developer": "🌐",
    "Full Stack Engineer": "🌐",
    "Generative AI & LLM Engineer": "🤖",
    "Generative AI Engineer": "🤖",
    "Data Scientist / ML Engineer": "🧠",
    "Data Scientist": "📊",
    "Cloud & DevOps Engineer": "☁️",
    "DevOps & Cloud Engineer": "☁️",
    "Mobile App Developer": "📱",
    "Cybersecurity Analyst": "🛡️",
    "Data Analyst": "📈",
    "Software Engineer Intern": "⚡"
  };

  // Load completed tasks from localStorage on initial render
  useEffect(() => {
    try {
      const saved = localStorage.getItem("talentsprint_completed_gap_tasks");
      if (saved) {
        setCompletedTasks(JSON.parse(saved));
      }
    } catch (e) {
      console.warn("Could not read completed tasks from storage", e);
    }
  }, []);

  // Fetch available roles from backend
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await api.get("/api/skill-gap/roles");
        setRoles(res.data);
      } catch (err) {
        console.error("Could not load roles:", err);
      }
    };
    fetchRoles();
  }, []);

  const runAnalysis = async (selectedRoleName, customJd) => {
    const roleToAnalyze = selectedRoleName || (customRole.trim() ? customRole.trim() : targetRole);
    if (!roleToAnalyze) return;

    setLoading(true);
    setStatusMsg("");
    try {
      const jdToSend = typeof customJd === "string" ? customJd : jobDescription;
      const res = await api.post("/api/skill-gap/analyze", {
        target_role: roleToAnalyze,
        job_description: jdToSend.trim()
      });
      setAnalysis(res.data);
      setTargetRole(roleToAnalyze);
      // Sync URL parameter
      setSearchParams({ role: roleToAnalyze });
    } catch (err) {
      console.error("Analysis failed:", err);
      setStatusMsg("Could not complete skill gap analysis. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runAnalysis(initialRole);
  }, []);

  const toggleTask = (taskKey) => {
    setCompletedTasks((prev) => {
      const updated = { ...prev, [taskKey]: !prev[taskKey] };
      try {
        localStorage.setItem("talentsprint_completed_gap_tasks", JSON.stringify(updated));
      } catch (e) {
        console.warn("Could not save to storage", e);
      }
      return updated;
    });
  };

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2200);
  };

  const getReadinessBadge = (level) => {
    const l = (level || "").toLowerCase();
    if (l.includes("ready") && !l.includes("near") && !l.includes("foundation")) {
      return { text: "🟢 Job-Ready Candidate", bg: "#ecfdf5", color: "#065f46", border: "#a7f3d0" };
    }
    if (l.includes("near") || l.includes("intermediate")) {
      return { text: "🟡 Near-Ready (1-2 Key Gaps)", bg: "#fffbeb", color: "#92400e", border: "#fde68a" };
    }
    return { text: "🟠 Foundational Preparation", bg: "#fef2f2", color: "#991b1b", border: "#fecaca" };
  };

  // Calculate roadmap progress
  const allRoadmapTasks = [];
  if (analysis?.learning_roadmap) {
    analysis.learning_roadmap.forEach((phase, pIdx) => {
      phase.action_items?.forEach((item, iIdx) => {
        allRoadmapTasks.push(`${analysis.target_role}_p${pIdx}_i${iIdx}`);
      });
    });
  }
  const completedCount = allRoadmapTasks.filter((k) => completedTasks[k]).length;
  const roadmapProgressPct =
    allRoadmapTasks.length > 0 ? Math.round((completedCount / allRoadmapTasks.length) * 100) : 0;

  const currentIcon = roleIcons[analysis?.target_role || targetRole] || "💼";
  const readiness = getReadinessBadge(analysis?.readiness_level);

  return (
    <Layout
      title="5. Skill Gap Analysis & Career Growth Engine"
      subtitle="Benchmark your verified skills against industry target roles, identify critical hiring filters, and follow a structured roadmap"
    >
      {/* ============================================================
          SECTION 1: TARGET ROLE BENCHMARK SELECTOR
      ============================================================ */}
      <div className="panel-box gap-benchmark-header">
        {/* Header Row */}
        <div className="benchmark-header-top">
          <div className="benchmark-header-info">
            <div className="benchmark-badge-row">
              <span className="benchmark-tag-pill">CAREER BENCHMARK</span>
              <span className="benchmark-active-pill">
                Active Target: <strong>{customRole || targetRole}</strong>
              </span>
            </div>
            <h4>🎯 Target Role & Industry Benchmarking</h4>
            <p className="benchmark-subtitle">
              Select an industry specialization track below or input a custom position to evaluate ATS keyword alignment
            </p>
          </div>

          <div className="benchmark-header-actions">
            <button
              type="button"
              className={`benchmark-jd-toggle-btn ${showJdInput ? "active" : ""}`}
              onClick={() => setShowJdInput(!showJdInput)}
            >
              <span>{showJdInput ? "✕ Close Job Description" : "📋 + Match Specific Job Description (JD)"}</span>
            </button>
          </div>
        </div>

        {/* Optional Collapsible Job Description Area */}
        {showJdInput && (
          <div className="benchmark-jd-drawer">
            <div className="jd-drawer-header">
              <span className="jd-drawer-icon">📝</span>
              <div>
                <strong>Target Job Description (JD) Keyword Extractor</strong>
                <small>Our AI will perform deep semantic matching against specific requirements and extract missing keywords</small>
              </div>
            </div>
            <textarea
              className="benchmark-jd-textarea"
              rows={4}
              placeholder="Paste the full job posting here (e.g., Responsibilities, Required Qualifications, Tech Stack)..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
            <div className="benchmark-jd-footer">
              <button
                type="button"
                className="btn-primary btn-sm"
                onClick={() => runAnalysis(targetRole, jobDescription)}
                disabled={loading || !jobDescription.trim()}
              >
                ⚡ Run JD-Specific Skill Gap Analysis
              </button>
              {jobDescription && (
                <button
                  type="button"
                  className="btn-outline btn-sm"
                  onClick={() => {
                    setJobDescription("");
                    runAnalysis(targetRole, "");
                  }}
                >
                  Clear JD Text
                </button>
              )}
            </div>
          </div>
        )}

        {/* Structured Grid of Industry Specialization Cards */}
        <div className="benchmark-roles-section">
          <div className="benchmark-section-meta">
            <span className="section-meta-label">POPULAR INDUSTRY CAREER PATHS</span>
            <span className="section-meta-count">8 Core Specializations</span>
          </div>

          <div className="benchmark-roles-grid">
            {roles.map((r) => {
              const icon = roleIcons[r.title] || "💼";
              const isActive = targetRole === r.title && !customRole;
              return (
                <button
                  key={r.id}
                  type="button"
                  className={`benchmark-role-tile ${isActive ? "active-tile" : ""}`}
                  onClick={() => {
                    setCustomRole("");
                    setTargetRole(r.title);
                    runAnalysis(r.title);
                  }}
                >
                  <div className="tile-icon-box">{icon}</div>
                  <div className="tile-text-box">
                    <span className="tile-title">{r.title}</span>
                    <span className="tile-domain">{r.domain || "Technology"}</span>
                  </div>
                  {isActive && (
                    <div className="tile-active-badge">
                      <span>✓ Active</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Divider Bar */}
        <div className="benchmark-custom-divider">
          <span className="divider-line"></span>
          <span className="divider-text">OR ANALYZE ANY CUSTOM ROLE</span>
          <span className="divider-line"></span>
        </div>

        {/* Custom Role Search Input Group */}
        <div className="benchmark-search-bar-wrap">
          <div className="benchmark-search-input-box">
            <span className="search-box-icon">🔍</span>
            <input
              type="text"
              placeholder="Type any specific role (e.g. AI Research Intern, Site Reliability Engineer, Mobile iOS Engineer, Solutions Architect)..."
              value={customRole}
              onChange={(e) => setCustomRole(e.target.value)}
              className="search-box-input"
              onKeyDown={(e) => {
                if (e.key === "Enter" && customRole.trim()) {
                  runAnalysis(customRole.trim());
                }
              }}
            />
            {customRole && (
              <button
                type="button"
                className="search-box-clear"
                onClick={() => setCustomRole("")}
                title="Clear input"
              >
                ✕
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => runAnalysis(customRole)}
            className="benchmark-analyze-btn"
            disabled={loading || !customRole.trim()}
          >
            {loading ? "Analyzing..." : "Analyze Custom Role →"}
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="loading-state panel-box">
          <div className="spinner"></div>
          <p style={{ marginTop: "12px", fontWeight: 600, color: "#1e293b" }}>
            Evaluating your profile against <strong>{customRole || targetRole}</strong> requirements...
          </p>
          <small style={{ color: "#64748b" }}>
            Calculating match compatibility, extracting critical recruiter filters, and generating customized milestones.
          </small>
        </div>
      )}

      {/* ============================================================
          SECTION 2: EXECUTIVE SCORECARD HERO & METRICS
      ============================================================ */}
      {!loading && analysis && (
        <div className="gap-analysis-results">
          <div className="gap-hero-card panel-box">
            <div className="gap-hero-main">
              <div className="gap-hero-left">
                <div className="gap-hero-role-badge">
                  <span className="gap-hero-role-icon">{currentIcon}</span>
                  <div>
                    <span className="gap-benchmark-tag">BENCHMARK EVALUATION</span>
                    <h2 className="gap-hero-role-title">{analysis.target_role}</h2>
                  </div>
                </div>

                <div className="gap-readiness-wrapper">
                  <span
                    className="gap-readiness-pill"
                    style={{
                      backgroundColor: readiness.bg,
                      color: readiness.color,
                      borderColor: readiness.border
                    }}
                  >
                    {readiness.text}
                  </span>
                  <span className="gap-evaluated-note">
                    Evaluated against top 2026 tech employer requirements & ATS filters
                  </span>
                </div>
              </div>

              {/* Match Score Display */}
              <div className="gap-hero-score-block">
                <div className="gap-score-radial-wrap">
                  <div className="gap-score-number">{analysis.match_percentage}%</div>
                  <div className="gap-score-label">Role Compatibility</div>
                </div>
                <div className="gap-score-progress-outer">
                  <div
                    className="gap-score-progress-bar"
                    style={{
                      width: `${analysis.match_percentage}%`,
                      backgroundColor:
                        analysis.match_percentage >= 75
                          ? "#10b981"
                          : analysis.match_percentage >= 50
                          ? "#f59e0b"
                          : "#ef4444"
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="gap-hero-metrics-grid">
              <div className="gap-metric-card">
                <div className="gap-metric-icon icon-green">✅</div>
                <div>
                  <div className="gap-metric-val">{analysis.mastered_skills?.length || 0}</div>
                  <div className="gap-metric-label">Skills Mastered</div>
                </div>
              </div>

              <div className="gap-metric-card">
                <div className="gap-metric-icon icon-red">🚨</div>
                <div>
                  <div className="gap-metric-val">{analysis.critical_gaps?.length || 0}</div>
                  <div className="gap-metric-label">Critical Gaps</div>
                </div>
              </div>

              <div className="gap-metric-card">
                <div className="gap-metric-icon icon-purple">💡</div>
                <div>
                  <div className="gap-metric-val">{analysis.secondary_gaps?.length || 0}</div>
                  <div className="gap-metric-label">Secondary Skills</div>
                </div>
              </div>

              <div className="gap-metric-card">
                <div className="gap-metric-icon icon-blue">🗺️</div>
                <div>
                  <div className="gap-metric-val">
                    {analysis.learning_roadmap?.length || 0} Phases
                  </div>
                  <div className="gap-metric-label">Learning Milestones</div>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================
              SECTION 3: STRUCTURED TAB NAVIGATION
          ============================================================ */}
          <div className="gap-tabs-container">
            <button
              type="button"
              className={`gap-tab-btn ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => setActiveTab("overview")}
            >
              📌 Executive Overview
            </button>
            <button
              type="button"
              className={`gap-tab-btn ${activeTab === "matrix" ? "active" : ""}`}
              onClick={() => setActiveTab("matrix")}
            >
              📊 Competency Matrix ({analysis.mastered_skills?.length || 0} / {(analysis.mastered_skills?.length || 0) + (analysis.critical_gaps?.length || 0)})
            </button>
            <button
              type="button"
              className={`gap-tab-btn ${activeTab === "roadmap" ? "active" : ""}`}
              onClick={() => setActiveTab("roadmap")}
            >
              🗺️ Interactive Roadmap {roadmapProgressPct > 0 ? `(${roadmapProgressPct}%)` : ""}
            </button>
            <button
              type="button"
              className={`gap-tab-btn ${activeTab === "courses" ? "active" : ""}`}
              onClick={() => setActiveTab("courses")}
            >
              📚 Curated Courses ({analysis.recommended_courses?.length || 0})
            </button>
            <button
              type="button"
              className={`gap-tab-btn ${activeTab === "projects" ? "active" : ""}`}
              onClick={() => setActiveTab("projects")}
            >
              🚀 Capstone Projects ({analysis.recommended_projects?.length || 0})
            </button>
            <button
              type="button"
              className={`gap-tab-btn ${activeTab === "all" ? "active" : ""}`}
              onClick={() => setActiveTab("all")}
            >
              👁️ Full Diagnostic View
            </button>
          </div>

          {/* ============================================================
              TAB 1: EXECUTIVE OVERVIEW
          ============================================================ */}
          {(activeTab === "overview" || activeTab === "all") && (
            <div className="panel-box gap-section-panel">
              <div className="panel-header-simple">
                <div>
                  <h4>📌 Executive Benchmark Summary</h4>
                  <p className="section-subtext">Strategic evaluation of your candidacy for {analysis.target_role}</p>
                </div>
                <span className="badge-primary">Strategic Analysis</span>
              </div>

              <div className="gap-overview-cards-grid">
                {/* Immediate Action Item */}
                <div className="overview-insight-card highlight-card">
                  <div className="insight-card-header">
                    <span className="insight-icon">🎯</span>
                    <strong>Top Upskilling Priority</strong>
                  </div>
                  <p>
                    Recruiters for <strong>{analysis.target_role}</strong> prioritize hands-on competency in:{" "}
                    <strong>
                      {analysis.critical_gaps?.slice(0, 3).join(", ") || "Advanced System Architectures"}
                    </strong>.
                    Closing these {analysis.critical_gaps?.length || 0} critical gaps will lift your match rate
                    from <strong>{analysis.match_percentage}%</strong> to <strong>90%+</strong>.
                  </p>
                  <div className="insight-actions">
                    <button
                      type="button"
                      className="btn-primary btn-sm"
                      onClick={() => setActiveTab("roadmap")}
                    >
                      View Structured Roadmap →
                    </button>
                    <button
                      type="button"
                      className="btn-outline btn-sm"
                      onClick={() => setActiveTab("courses")}
                    >
                      Explore Courses →
                    </button>
                  </div>
                </div>

                {/* ATS Screening Readiness */}
                <div className="overview-insight-card">
                  <div className="insight-card-header">
                    <span className="insight-icon">🤖</span>
                    <strong>ATS Parser Screening Status</strong>
                  </div>
                  <p>
                    Automated Applicant Tracking Systems (ATS) scan for exact technical keywords before human review.
                    Your resume currently matches <strong>{analysis.mastered_skills?.length || 0} keywords</strong>,
                    but is missing <strong>{analysis.critical_gaps?.length || 0} core terms</strong>.
                  </p>
                  <div className="ats-mini-pills">
                    {analysis.critical_gaps?.slice(0, 4).map((g) => (
                      <span key={g} className="ats-mini-missing">
                        Missing: {g}
                      </span>
                    ))}
                  </div>
                  <Link
                    to={`/customizer?role=${encodeURIComponent(analysis.target_role)}`}
                    className="ats-tailor-link"
                  >
                    ✍️ Tailor your resume to add these keywords →
                  </Link>
                </div>
              </div>

              {/* Recommended Certifications Box */}
              {analysis.recommended_certifications?.length > 0 && (
                <div className="gap-certifications-box">
                  <div className="cert-box-header">
                    <span className="cert-badge-icon">🏅</span>
                    <strong>High-Value Industry Certifications for {analysis.target_role}:</strong>
                  </div>
                  <div className="cert-chips-wrap">
                    {analysis.recommended_certifications.map((cert, idx) => (
                      <span key={idx} className="cert-chip">
                        ⭐ {cert}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================
              TAB 2: 3-WAY COMPETENCY MATRIX
          ============================================================ */}
          {(activeTab === "matrix" || activeTab === "all") && (
            <div className="panel-box gap-section-panel">
              <div className="panel-header-simple">
                <div>
                  <h4>📊 3-Way Competency Diagnostic Matrix</h4>
                  <p className="section-subtext">Detailed breakdown of verified competencies vs critical hiring criteria</p>
                </div>
                <span className="badge-primary">Triple Validation</span>
              </div>

              <div className="skills-comparison-grid">
                {/* Column 1: Mastered & Verified Skills */}
                <div className="skills-col matched-col">
                  <div className="col-header-row">
                    <span className="col-title">✅ Acquired & Verified</span>
                    <span className="pill-count count-green">{analysis.mastered_skills?.length || 0}</span>
                  </div>
                  <p className="col-subtext">Found in your profile, projects, and active resume:</p>
                  <div className="skills-tags-wrap">
                    {analysis.mastered_skills?.map((s) => (
                      <span key={s} className="tag-matched">
                        ✓ {s}
                      </span>
                    ))}
                    {(!analysis.mastered_skills || analysis.mastered_skills.length === 0) && (
                      <small className="empty-tag-note">No matching skills detected yet.</small>
                    )}
                  </div>
                  <div className="col-footer-note">
                    <small>✓ Highlighted automatically in ATS evaluations</small>
                  </div>
                </div>

                {/* Column 2: Critical Gaps */}
                <div className="skills-col missing-col">
                  <div className="col-header-row">
                    <span className="col-title">🚨 Critical Hiring Gaps</span>
                    <span className="pill-count count-red">{analysis.critical_gaps?.length || 0}</span>
                  </div>
                  <p className="col-subtext">High-priority requirements screened by technical interviewers:</p>
                  <div className="skills-tags-wrap">
                    {analysis.critical_gaps?.map((s) => (
                      <span key={s} className="tag-missing">
                        ⚠️ {s}
                      </span>
                    ))}
                    {(!analysis.critical_gaps || analysis.critical_gaps.length === 0) && (
                      <small className="empty-tag-note">🎉 No critical skill gaps! You match all requirements.</small>
                    )}
                  </div>
                  <div className="col-footer-note">
                    <small>⚠️ Must be addressed to pass round 1 resume screens</small>
                  </div>
                </div>

                {/* Column 3: Secondary / Emerging Edge */}
                <div className="skills-col secondary-col">
                  <div className="col-header-row">
                    <span className="col-title">💡 Secondary & Emerging Edge</span>
                    <span className="pill-count count-purple">{analysis.secondary_gaps?.length || 0}</span>
                  </div>
                  <p className="col-subtext">Modern tools and differentiating technologies to stand out:</p>
                  <div className="skills-tags-wrap">
                    {analysis.secondary_gaps?.map((s) => (
                      <span key={s} className="tag-secondary">
                        + {s}
                      </span>
                    ))}
                    {(!analysis.secondary_gaps || analysis.secondary_gaps.length === 0) && (
                      <small className="empty-tag-note">No secondary skills recommended.</small>
                    )}
                  </div>
                  <div className="col-footer-note">
                    <small>💡 Gives you a competitive edge over other applicants</small>
                  </div>
                </div>
              </div>

              {/* Recruiter Hiring Reality Insight Box */}
              <div className="recruiter-reality-banner">
                <div className="reality-icon">💡</div>
                <div className="reality-body">
                  <strong>Recruiter Tip for {analysis.target_role}:</strong>
                  <span>
                    When hiring managers look at candidates, having 3 high-priority skills proven in a practical
                    portfolio project carries 4x more weight than a certificate alone. Focus on building real-world
                    projects that demonstrate <em>{analysis.critical_gaps?.slice(0, 2).join(" & ") || "system competence"}</em>.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================
              TAB 3: INTERACTIVE MILESTONE ROADMAP
          ============================================================ */}
          {(activeTab === "roadmap" || activeTab === "all") && (
            <div className="panel-box gap-section-panel roadmap-panel">
              <div className="panel-header-simple">
                <div>
                  <h4>🗺️ Step-by-Step Learning Roadmap & Checklist</h4>
                  <p className="section-subtext">
                    Customized timeline designed to take you from {analysis.readiness_level} to Job-Ready
                  </p>
                </div>
                <div className="roadmap-progress-badge">
                  <span className="progress-badge-text">
                    {completedCount} of {allRoadmapTasks.length} Completed ({roadmapProgressPct}%)
                  </span>
                </div>
              </div>

              {/* Live Interactive Progress Bar */}
              <div className="roadmap-progress-bar-wrap">
                <div
                  className="roadmap-progress-bar-fill"
                  style={{ width: `${roadmapProgressPct}%` }}
                ></div>
              </div>

              <div className="roadmap-timeline-structured">
                {analysis.learning_roadmap?.map((phase, pIdx) => {
                  const phaseTasks = phase.action_items?.map((item, iIdx) => ({
                    text: item,
                    key: `${analysis.target_role}_p${pIdx}_i${iIdx}`
                  })) || [];
                  const phaseDoneCount = phaseTasks.filter((t) => completedTasks[t.key]).length;
                  const isPhaseComplete = phaseTasks.length > 0 && phaseDoneCount === phaseTasks.length;

                  return (
                    <div
                      key={pIdx}
                      className={`roadmap-phase-card ${isPhaseComplete ? "phase-completed" : ""}`}
                    >
                      <div className="phase-marker-column">
                        <div className={`phase-marker-circle ${isPhaseComplete ? "circle-done" : ""}`}>
                          {isPhaseComplete ? "✓" : pIdx + 1}
                        </div>
                        {pIdx < analysis.learning_roadmap.length - 1 && <div className="phase-vertical-line" />}
                      </div>

                      <div className="phase-content-card">
                        <div className="phase-card-header">
                          <div className="phase-title-group">
                            <span className="phase-time-pill">{phase.phase}</span>
                            <h5>{phase.topic}</h5>
                          </div>
                          <span className="phase-task-counter">
                            {phaseDoneCount}/{phaseTasks.length} done
                          </span>
                        </div>

                        {/* Interactive Task Checklist */}
                        <div className="phase-tasks-list">
                          {phaseTasks.map((t, idx) => {
                            const isChecked = !!completedTasks[t.key];
                            return (
                              <label
                                key={idx}
                                className={`roadmap-task-row ${isChecked ? "task-checked" : ""}`}
                                onClick={() => toggleTask(t.key)}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {}} // handled by parent onClick
                                  className="roadmap-checkbox"
                                />
                                <span className="task-text">{t.text}</span>
                                {isChecked && <span className="task-done-badge">Completed ✓</span>}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="roadmap-footer-tools">
                <small>💡 Check off action items as you complete them to track your learning journey.</small>
                {completedCount > 0 && (
                  <button
                    type="button"
                    className="btn-outline btn-sm"
                    onClick={() => {
                      if (window.confirm("Reset your checklist progress for this role?")) {
                        const updated = { ...completedTasks };
                        allRoadmapTasks.forEach((k) => delete updated[k]);
                        setCompletedTasks(updated);
                        localStorage.setItem("talentsprint_completed_gap_tasks", JSON.stringify(updated));
                      }
                    }}
                  >
                    Reset Progress
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ============================================================
              TAB 4: CURATED LEARNING COURSES
          ============================================================ */}
          {(activeTab === "courses" || activeTab === "all") && (
            <div className="panel-box gap-section-panel">
              <div className="panel-header-simple">
                <div>
                  <h4>📚 Curated Learning Courses & Resources</h4>
                  <p className="section-subtext">Directly mapped to address your critical and secondary skill gaps</p>
                </div>
                <span className="badge-primary">{analysis.recommended_courses?.length || 0} Courses Recommended</span>
              </div>

              <div className="courses-grid">
                {analysis.recommended_courses?.map((course, idx) => (
                  <div key={idx} className="course-card">
                    <div className="course-card-top">
                      <span className="course-platform-badge">{course.platform || "Platform"}</span>
                      <span className="course-type-pill">{course.type || "Specialization"}</span>
                    </div>

                    <h5 className="course-title">{course.title}</h5>
                    <p className="course-desc">{course.description}</p>

                    <div className="course-card-footer">
                      <a
                        href={course.url || "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-primary btn-sm course-action-btn"
                      >
                        Start Learning ↗
                      </a>
                    </div>
                  </div>
                ))}

                {(!analysis.recommended_courses || analysis.recommended_courses.length === 0) && (
                  <div className="empty-hint">No specific courses found for this role.</div>
                )}
              </div>
            </div>
          )}

          {/* ============================================================
              TAB 5: HANDS-ON CAPSTONE PROJECTS
          ============================================================ */}
          {(activeTab === "projects" || activeTab === "all") && (
            <div className="panel-box gap-section-panel">
              <div className="panel-header-simple">
                <div>
                  <h4>🚀 Hands-on Capstone Projects</h4>
                  <p className="section-subtext">
                    Build these portfolio projects to tangibly prove competency in your gap areas
                  </p>
                </div>
                <span className="badge-primary">Portfolio Ready</span>
              </div>

              <div className="projects-grid">
                {analysis.recommended_projects?.map((proj, idx) => (
                  <div key={idx} className="project-card">
                    <div className="project-card-header">
                      <div>
                        <span className="project-number-tag">Project #{idx + 1}</span>
                        <h4 className="project-title">{proj.title}</h4>
                      </div>
                      <span className="badge-success">Recruiter Recommended</span>
                    </div>

                    {/* Tech Stack Pills */}
                    <div className="project-tech-stack">
                      {proj.tech_stack?.map((t) => (
                        <span key={t} className="tech-mini-tag">
                          {t}
                        </span>
                      ))}
                    </div>

                    <p className="project-description">{proj.description}</p>

                    {/* Recruiter Resume Impact Box */}
                    <div className="resume-impact-box">
                      <div className="impact-header">
                        <strong>⭐ Recruiter Resume Impact (Add this bullet to your CV):</strong>
                        <button
                          type="button"
                          className="copy-bullet-btn"
                          onClick={() => copyToClipboard(proj.resume_impact, idx)}
                        >
                          {copiedIndex === idx ? "✓ Copied!" : "📋 Copy Bullet"}
                        </button>
                      </div>
                      <p className="impact-text">"{proj.resume_impact}"</p>
                    </div>
                  </div>
                ))}

                {(!analysis.recommended_projects || analysis.recommended_projects.length === 0) && (
                  <div className="empty-hint">No projects generated for this configuration.</div>
                )}
              </div>
            </div>
          )}

          {/* ============================================================
              SECTION 4: ACTION DECK (BRIDGE THE GAP)
          ============================================================ */}
          <div className="panel-box gap-bridge-action-deck">
            <div className="action-deck-left">
              <div className="action-deck-icon">⚡</div>
              <div>
                <h4>Accelerate Your Hiring Readiness</h4>
                <p>
                  Put your new skills to work: tailor your resume for <strong>{analysis.target_role}</strong>,
                  practice mock technical interview questions, or consult your AI Mentor.
                </p>
              </div>
            </div>

            <div className="action-deck-buttons">
              <Link
                to={`/customizer?role=${encodeURIComponent(analysis.target_role)}`}
                className="deck-btn deck-btn-white"
              >
                <span>✍️</span> Tailor CV for Gaps
              </Link>
              <Link
                to={`/interview-prep?role=${encodeURIComponent(analysis.target_role)}`}
                className="deck-btn deck-btn-glass"
              >
                <span>🎙️</span> Practice Role Interview
              </Link>
              <Link
                to={`/career-assistant?topic=${encodeURIComponent(`Skill gap upskilling for ${analysis.target_role}`)}`}
                className="deck-btn deck-btn-mentor"
              >
                <span>🤖</span> Ask AI Mentor
              </Link>
              <button
                type="button"
                className="deck-btn deck-btn-glass"
                onClick={() => window.print()}
              >
                <span>🖨️</span> Export PDF Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating On-Screen Notification */}
      {statusMsg && (
        <div className="floating-apply-toast">
          <div className="toast-icon-wrap">🎯</div>
          <div className="toast-body">
            <h5 className="toast-title">Skill Gap Analysis</h5>
            <p className="toast-desc">{statusMsg}</p>
          </div>
          <button
            type="button"
            onClick={() => setStatusMsg("")}
            className="btn-toast-close"
            aria-label="Close notification"
          >
            ✕
          </button>
        </div>
      )}
    </Layout>
  );
}

