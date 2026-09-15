import { Link, useLocation, useNavigate } from "react-router-dom";

// Unique Modern Vector Icons for Each Module
function IconDashboard() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  );
}

function IconProfile() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2.5" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      <circle cx="12" cy="13.5" r="1.5" fill="currentColor" />
      <path d="M2 13c4.5 1.5 15.5 1.5 20 0" />
    </svg>
  );
}

function IconJobMatching() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <line x1="12" y1="17" x2="12" y2="21" />
      <line x1="8" y1="21" x2="16" y2="21" />
    </svg>
  );
}

function IconPipelineTracker() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="5" height="18" rx="1.5" />
      <rect x="10" y="3" width="5" height="12" rx="1.5" />
      <rect x="17" y="3" width="5" height="15" rx="1.5" />
      <line x1="10" y1="18" x2="15" y2="18" strokeWidth="2" />
    </svg>
  );
}

function IconAIMentor() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.2 5.3L20 9.5l-4.3 3.8 1.3 5.7L12 16l-5 3 1.3-5.7L4 9.5l5.8-2.2z" fill="currentColor" fillOpacity="0.18" />
      <path d="M19 16l1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z" fill="currentColor" />
    </svg>
  );
}

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();

  const userName = localStorage.getItem("user_name") || "Student";
  const userRole = localStorage.getItem("user_role") || "Intern";
  const avatar = userName.charAt(0).toUpperCase();

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_role");
    if (onClose) onClose();
    navigate("/login", { replace: true });
  };

  const navItems = [
    {
      path: "/dashboard",
      label: "Dashboard",
      id: "MOD-00",
      color: "#4f46e5",
      icon: <IconDashboard />,
    },
    {
      path: "/profile",
      label: "Profile & Resumes",
      id: "MOD-01",
      color: "#0284c7",
      icon: <IconProfile />,
    },
    {
      path: "/resume-parser",
      label: "Resume Parser",
      id: "MOD-02",
      color: "#7c3aed",
      icon: <IconResumeParser />,
    },
    {
      path: "/knowledge-base",
      label: "Internship Opportunities",
      id: "MOD-03",
      color: "#2563eb",
      icon: <IconOpportunities />,
    },
    {
      path: "/job-matching",
      label: "Job Matching",
      id: "MOD-04",
      color: "#e11d48",
      icon: <IconJobMatching />,
    },
    {
      path: "/skill-gap",
      label: "Skill Gap Analysis",
      id: "MOD-05",
      color: "#d97706",
      icon: <IconSkillGap />,
    },
    {
      path: "/customizer",
      label: "Resume & CV Builder",
      id: "MOD-06",
      color: "#db2777",
      icon: <IconCVBuilder />,
    },
    {
      path: "/interview-prep",
      label: "Interview Prep",
      id: "MOD-07",
      color: "#059669",
      icon: <IconInterviewPrep />,
    },
    {
      path: "/application-tracker",
      label: "Application Pipeline Tracker",
      id: "MOD-08",
      color: "#0891b2",
      icon: <IconPipelineTracker />,
    },
    {
      path: "/career-assistant",
      label: "AI Career Companion",
      id: "MOD-09",
      color: "#7c3aed",
      icon: <IconAIMentor />,
    },
  ];

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  return (
    <aside className={`sidebar sidebar-modern ${isOpen ? "sidebar-open" : ""}`}>
      {/* Brand Header */}
      <div className="logo-section">
        <div className="logo-header-row">
          <div className="brand-logo-wrap">
            <div className="brand-emblem">⚡</div>
            <div className="logo" style={{ fontSize: "16px" }}>
              Career Companion <span className="logo-ai-pill">Agent</span>
            </div>
          </div>
          {onClose && (
            <button
              type="button"
              className="btn-sidebar-close"
              onClick={onClose}
              aria-label="Close Sidebar"
            >
              ✕
            </button>
          )}
        </div>

        <div className="sidebar-live-tag">
          <span className="live-dot-pulse"></span>
          <span>Internship Matching & Interview Prep</span>
        </div>
      </div>

      {/* Clean, Unified Nav Menu with Unique Identifiers & Custom Icons */}
      <nav className="sidebar-nav">
        <div className="nav-items-list">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const isMentor = item.id === "MOD-09";
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleNavClick}
                className={`nav-link ${isActive ? "active" : ""} ${
                  isMentor ? "nav-link-mentor" : ""
                }`}
              >
                <span
                  className="nav-unique-icon-box"
                  style={{
                    color: item.color,
                    backgroundColor: isActive ? `${item.color}20` : `${item.color}12`,
                    borderColor: isActive ? `${item.color}44` : `${item.color}22`,
                  }}
                  aria-hidden="true"
                >
                  {item.icon}
                </span>
                <span className="nav-label">{item.label}</span>
                <span className={`nav-uid-badge ${isMentor ? "nav-uid-badge-mentor" : ""}`}>
                  {item.id}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Compact User Bar - Zero Overlap with Menu Items */}
      <div className="sidebar-bottom">
        <div className="sidebar-user-card">
          <div className="s-user-avatar">{avatar}</div>
          <div className="s-user-meta">
            <strong className="s-user-name">{userName}</strong>
            <small className="s-user-role">{userRole}</small>
          </div>
          <button
            type="button"
            onClick={logout}
            className="btn-sidebar-logout-icon"
            title="Sign out"
            aria-label="Sign out"
          >
            🚪
          </button>
        </div>
      </div>
    </aside>
  );
}
