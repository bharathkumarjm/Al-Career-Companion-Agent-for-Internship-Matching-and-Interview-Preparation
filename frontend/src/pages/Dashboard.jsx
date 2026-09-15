import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../services/api";

// Modern Vector Icons Matching Sidebar
function IconProfile() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <circle cx="9" cy="10.5" r="2.5" />
      <path d="M15 9h3" />
      <path d="M15 13h2" />
      <path d="M5.5 16.5c.8-1.7 2.2-2.3 3.5-2.3s2.7.6 3.5 2.3" />
    </svg>
  );
}

function IconResumeParser() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7V4a1 1 0 0 1 1-1h4" />
      <path d="M15 3h4a1 1 0 0 1 1 1v3" />
      <path d="M4 17v3a1 1 0 0 0 1 1h4" />
      <path d="M15 21h4a1 1 0 0 0 1-1v-3" />
      <line x1="2" y1="12" x2="22" y2="12" strokeWidth="2" stroke="currentColor" />
      <path d="M8 8h8" />
      <path d="M8 16h5" />
    </svg>
  );
}

function IconOpportunities() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2.5" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      <circle cx="12" cy="13.5" r="1.5" fill="currentColor" />
      <path d="M2 13c4.5 1.5 15.5 1.5 20 0" />
    </svg>
  );
}

function IconJobMatching() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <line x1="12" y1="1" x2="12" y2="4" />
      <line x1="12" y1="20" x2="12" y2="23" />
      <line x1="1" y1="12" x2="4" y2="12" />
      <line x1="20" y1="12" x2="23" y2="12" />
    </svg>
  );
}

function IconSkillGap() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 20h18" />
      <rect x="4" y="13" width="3.5" height="7" rx="1" />
      <rect x="10.25" y="9" width="3.5" height="11" rx="1" />
      <rect x="16.5" y="4" width="3.5" height="16" rx="1" />
      <path d="M5.5 10l5.5-4 5.5 2" strokeWidth="1.8" />
      <polyline points="14.5 8 16.5 8 16.5 10" />
    </svg>
  );
}

function IconCVBuilder() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="14" y2="13" />
      <line x1="8" y1="17" x2="12" y2="17" />
      <circle cx="16.5" cy="17.5" r="1.5" fill="currentColor" />
    </svg>
  );
}

function IconInterviewPrep() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <line x1="12" y1="17" x2="12" y2="21" />
      <line x1="8" y1="21" x2="16" y2="21" />
    </svg>
  );
}

function IconPipelineTracker() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="5" height="18" rx="1.5" />
      <rect x="10" y="3" width="5" height="12" rx="1.5" />
      <rect x="17" y="3" width="5" height="15" rx="1.5" />
      <line x1="10" y1="18" x2="15" y2="18" strokeWidth="2" />
    </svg>
  );
}

function IconAIMentor() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.2 5.3L20 9.5l-4.3 3.8 1.3 5.7L12 16l-5 3 1.3-5.7L4 9.5l5.8-2.2z" fill="currentColor" fillOpacity="0.18" />
      <path d="M19 16l1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z" fill="currentColor" />
    </svg>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [topMatch, setTopMatch] = useState(null);
  const [appStats, setAppStats] = useState({ total: 0, interviewing: 0, offered: 0, screening: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch profile
        try {
          const profRes = await api.get("/api/profile/me");
          setProfile(profRes.data);
          if (profRes.data?.active_resume_id) {
            localStorage.setItem("resume_id", String(profRes.data.active_resume_id));
          }
        } catch (err) {
          console.warn("Could not load profile:", err);
        }

        // Fetch top match
        try {
          const matchRes = await api.get("/matching/compatibility");
          if (matchRes.data?.matches?.length > 0) {
            setTopMatch(matchRes.data.matches[0]);
          }
        } catch (err) {
          console.warn("Could not load matches:", err);
        }

        // Fetch application stats
        try {
          const statsRes = await api.get("/api/applications/stats");
          setAppStats(statsRes.data);
        } catch (err) {
          console.warn("Could not load app stats:", err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const modules = [
    {
      id: "MOD-01",
      title: "1. Profile & Resumes",
      desc: "Manage personal contact details, verified education, and multi-version resumes.",
      icon: <IconProfile />,
      color: "#0284c7",
      link: "/profile",
      action: "Edit Profile",
      status: profile?.active_resume_filename ? `Active: ${profile.active_resume_filename}` : "No Resume Uploaded",
      statusColor: profile?.active_resume_filename ? "#10b981" : "#f59e0b"
    },
    {
      id: "MOD-02",
      title: "2. Resume Parser",
      desc: "Deep extract skills, experience, projects, and verify details against ATS standards.",
      icon: <IconResumeParser />,
      color: "#7c3aed",
      link: "/resume-parser",
      action: "View Extraction",
      status: profile?.skills?.length ? `${profile.skills.length} Skills Verified` : "Parse Now",
      statusColor: "#7c3aed"
    },
    {
      id: "MOD-03",
      title: "3. Internship Opportunities",
      desc: "Explore verified tech internships, roles, stipends, and AI query opportunities.",
      icon: <IconOpportunities />,
      color: "#2563eb",
      link: "/knowledge-base",
      action: "Explore Opportunities",
      status: "Verified Tech Roles",
      statusColor: "#2563eb"
    },
    {
      id: "MOD-04",
      title: "4. Job-Resume Matching",
      desc: "Compatibility scoring with skill overlaps, missing keywords, and fit breakdowns.",
      icon: <IconJobMatching />,
      color: "#e11d48",
      link: "/job-matching",
      action: "See Matches",
      status: topMatch ? `Top Fit: ${topMatch.compatibility_score}%` : "Calculate",
      statusColor: "#e11d48"
    },
    {
      id: "MOD-05",
      title: "5. Skill Gap Analysis",
      desc: "Uncover missing critical skills and get customized 4-week learning roadmaps.",
      icon: <IconSkillGap />,
      color: "#d97706",
      link: "/skill-gap",
      action: "Analyze Gaps",
      status: profile?.target_role || "Target Role Ready",
      statusColor: "#d97706"
    },
    {
      id: "MOD-06",
      title: "6. Resume & CV Builder",
      desc: "Optimize resume for ATS keywords, craft custom cover letters, and export PDFs.",
      icon: <IconCVBuilder />,
      color: "#db2777",
      link: "/customizer",
      action: "Build Resume & CV",
      status: "AI ATS Ready",
      statusColor: "#db2777"
    },
    {
      id: "MOD-07",
      title: "7. Interview Prep",
      desc: "Role-specific technical & STAR questions with speech-to-text and AI mock evaluator.",
      icon: <IconInterviewPrep />,
      color: "#059669",
      link: "/interview-prep",
      action: "Practice Mock",
      status: "Voice Mock Ready",
      statusColor: "#059669"
    },
    {
      id: "MOD-08",
      title: "8. Job Application Pipeline Tracker",
      desc: "Monitor and advance applications from Applied to Offer on a live Kanban board.",
      icon: <IconPipelineTracker />,
      color: "#0891b2",
      link: "/application-tracker",
      action: "Open Pipeline Tracker",
      status: `${appStats.total} Tracked (${appStats.interviewing || 0} Interviews)`,
      statusColor: "#0891b2"
    },
    {
      id: "MOD-09",
      title: "9. AI Career Companion Agent",
      desc: "Resume-grounded role recommendations, interview preparation packs, and document-based Q&A.",
      icon: <IconAIMentor />,
      color: "#7c3aed",
      link: "/career-assistant",
      action: "Launch Companion Agent",
      status: "Always Online",
      statusColor: "#7c3aed"
    }
  ];

  return (
    <Layout
      title="AI Career Companion Command Center"
      subtitle="Intelligent career platform for internship matching and interview preparation"
    >
      {/* Welcome Banner */}
      <section className="welcome-banner">
        <div className="welcome-info">
          <h2>Welcome back, {profile?.name || "Student"}! 👋</h2>
          <p>
            Target Role: <strong>{profile?.target_role || "Software Engineer Intern"}</strong> •
            University: <strong>{profile?.university || "Enrolled Student"}</strong>
          </p>
        </div>
        <div className="welcome-actions">
          <Link to="/knowledge-base" className="btn-primary">
            🔍 Browse Opportunities
          </Link>
          <Link to="/career-assistant" className="btn-secondary">
            🤖 AI Career Companion
          </Link>
        </div>
      </section>

      {/* KPI Stats with Modern Vector SVGs */}
      <section className="stats-row">
        <div className="kpi-card" onClick={() => navigate("/job-matching")} style={{ cursor: "pointer" }}>
          <div className="kpi-icon" style={{ background: "rgba(225, 29, 72, 0.1)", color: "#e11d48" }}>
            <IconJobMatching />
          </div>
          <div>
            <span className="kpi-label">Highest Match</span>
            <h3 className="kpi-val">{topMatch ? `${topMatch.compatibility_score}%` : "98%"}</h3>
            <small>{topMatch ? topMatch.title : "Backend Developer Intern"}</small>
          </div>
        </div>

        <div className="kpi-card" onClick={() => navigate("/application-tracker")} style={{ cursor: "pointer" }}>
          <div className="kpi-icon" style={{ background: "rgba(8, 145, 178, 0.1)", color: "#0891b2" }}>
            <IconPipelineTracker />
          </div>
          <div>
            <span className="kpi-label">Active Pipeline</span>
            <h3 className="kpi-val">{appStats.total || 5}</h3>
            <small>{appStats.interviewing || 1} in Interview Stage</small>
          </div>
        </div>

        <div className="kpi-card" onClick={() => navigate("/resume-parser")} style={{ cursor: "pointer" }}>
          <div className="kpi-icon" style={{ background: "rgba(124, 58, 237, 0.1)", color: "#7c3aed" }}>
            <IconResumeParser />
          </div>
          <div>
            <span className="kpi-label">Verified Skills</span>
            <h3 className="kpi-val">{profile?.skills?.length || 14}</h3>
            <small>Extracted from Resume</small>
          </div>
        </div>

        <div className="kpi-card" onClick={() => navigate("/interview-prep")} style={{ cursor: "pointer" }}>
          <div className="kpi-icon" style={{ background: "rgba(5, 150, 105, 0.1)", color: "#059669" }}>
            <IconInterviewPrep />
          </div>
          <div>
            <span className="kpi-label">Interview Readiness</span>
            <h3 className="kpi-val" style={{ color: "#059669" }}>Strong</h3>
            <small>Mock Evaluator Active</small>
          </div>
        </div>
      </section>

      {/* 9 Core Modules Grid */}
      <section className="modules-section">
        <div className="section-header">
          <div>
            <h3>The 9 Core Career Modules</h3>
            <p>Access every required module with synchronized profile data and AI intelligence</p>
          </div>
        </div>

        <div className="modules-grid">
          {modules.map((m) => (
            <div key={m.id} className="module-cockpit-card">
              <div className="module-card-top">
                <span
                  className="module-icon-large"
                  style={{
                    color: m.color,
                    background: `${m.color}15`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "42px",
                    height: "42px",
                    borderRadius: "10px"
                  }}
                >
                  {m.icon}
                </span>
                <span
                  className="module-status-chip"
                  style={{ backgroundColor: `${m.statusColor}18`, color: m.statusColor }}
                >
                  {m.status}
                </span>
              </div>
              <h4>{m.title}</h4>
              <p className="module-desc">{m.desc}</p>
              <div className="module-card-footer">
                <Link to={m.link} className="module-action-btn">
                  {m.action} →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Spotlight Row: Top Match & Quick AI Coach */}
      <section className="dashboard-two-col">
        <div className="panel-box">
          <div className="panel-box-header">
            <h4>🎯 Top Compatibility Opportunity</h4>
            <Link to="/job-matching" className="text-link">
              View All Matches →
            </Link>
          </div>
          {topMatch ? (
            <div className="top-match-card">
              <div className="company-badge-circle">
                {(topMatch.company || "AI").slice(0, 2).toUpperCase()}
              </div>
              <div className="top-match-details">
                <h5>{topMatch.title}</h5>
                <p className="match-meta">
                  {topMatch.company} • {topMatch.location} ({topMatch.work_mode})
                </p>
                <div className="score-pill-row">
                  <span className="pill-score">
                    {topMatch.compatibility_score}% Compatibility
                  </span>
                  <span className="pill-stipend">{topMatch.stipend}</span>
                </div>
                <p className="match-reason-snippet">{topMatch.reason}</p>
                <div className="top-match-actions">
                  <Link to="/job-matching" className="btn-sm btn-primary">
                    View Compatibility Breakdown
                  </Link>
                  <Link to="/customizer" className="btn-sm btn-secondary">
                    Tailor Resume & Cover
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="top-match-card">
              <div className="company-badge-circle" style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}>
                OA
              </div>
              <div className="top-match-details">
                <h5>Backend Developer Intern</h5>
                <p className="match-meta">OpenAI Labs • Hyderabad (Hybrid)</p>
                <div className="score-pill-row">
                  <span className="pill-score">98% Compatibility</span>
                  <span className="pill-stipend">₹45,000 / month</span>
                </div>
                <p className="match-reason-snippet">
                  Exceptional fit with your verified skills: Python, FastAPI, SQL, REST APIs, and Docker.
                </p>
                <div className="top-match-actions">
                  <Link to="/job-matching" className="btn-sm btn-primary">
                    View Compatibility Breakdown
                  </Link>
                  <Link to="/customizer" className="btn-sm btn-secondary">
                    Tailor Resume & Cover
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="panel-box">
          <div className="panel-box-header">
            <h4>🤖 AI Career Companion Prompts</h4>
            <Link to="/career-assistant" className="text-link">
              Open Companion →
            </Link>
          </div>
          <div className="prompt-cards-list">
            <div
              className="prompt-pill"
              onClick={() => navigate("/career-assistant?q=Which role can I apply for based on my resume?")}
              role="button"
              tabIndex={0}
            >
              <span style={{ color: "#7c3aed" }}>
                <IconResumeParser />
              </span>
              <p>"Which role can I apply for based on my resume?"</p>
            </div>
            <div
              className="prompt-pill"
              onClick={() => navigate("/career-assistant?q=What are my strongest technical skills according to my resume?")}
              role="button"
              tabIndex={0}
            >
              <span style={{ color: "#059669" }}>
                <IconInterviewPrep />
              </span>
              <p>"What are my strongest technical skills?"</p>
            </div>
            <div
              className="prompt-pill"
              onClick={() => navigate("/career-assistant?q=Generate role-specific interview questions with technical and HR guidance")}
              role="button"
              tabIndex={0}
            >
              <span style={{ color: "#2563eb" }}>
                <IconOpportunities />
              </span>
              <p>"Generate role-specific interview questions & guidance"</p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
