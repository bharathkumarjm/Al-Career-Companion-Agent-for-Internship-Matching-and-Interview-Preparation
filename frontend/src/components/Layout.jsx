import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import FloatingAICopilot from "./FloatingAICopilot";

export default function Layout({ children, title, subtitle }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const userName = localStorage.getItem("user_name") || "Student";
  const userRole = localStorage.getItem("user_role") || "Intern";
  const avatar = userName.charAt(0).toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_role");
    navigate("/login", { replace: true });
  };

  return (
    <div className="app">
      {/* Mobile Backdrop when Sidebar Drawer is open */}
      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar with open/close handlers */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="main">
        {/* Modern Responsive In-App Header */}
        <header className="topbar">
          <div className="topbar-left-wrap">
            <button
              type="button"
              className="btn-hamburger"
              onClick={() => setSidebarOpen((prev) => !prev)}
              aria-label="Toggle Navigation Menu"
              title="Toggle Menu"
            >
              <span className="hamburger-bar"></span>
              <span className="hamburger-bar"></span>
              <span className="hamburger-bar"></span>
            </button>

            <div className="topbar-title-block">
              <div className="topbar-title-row">
                <h2>{title || "TalentSprint AI"}</h2>
                <span className="topbar-active-pill">🟢 Live</span>
              </div>
              <p>{subtitle || "Intelligent Career & Internship Accelerator"}</p>
            </div>
          </div>

          <div className="topbar-actions-block">
            <div className="ai-status-indicator" title="Groq LLaMA-3.3 Intelligence Engine Connected">
              <span className="ai-status-pulse"></span>
              <span className="ai-status-label">AI Engine Ready</span>
            </div>

            <Link to="/career-assistant" className="btn-quick-assistant" title="Open Conversational Career Assistant">
              💬 <span className="btn-quick-assistant-label">Ask AI Mentor</span>
            </Link>

            <div className="user-profile-widget">
              <div className="avatar">{avatar}</div>
              <div className="user-info-text">
                <strong>{userName}</strong>
                <small>{userRole}</small>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="btn-topbar-logout"
                title="Sign out of account"
              >
                Sign Out
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="page-content">{children}</div>

        {/* Modern Responsive In-App Footer */}
        <footer className="app-footer">
          <div className="app-footer-content">
            <div className="app-footer-left">
              <span className="app-footer-logo">
                Talent<span>Sprint AI</span>
              </span>
              <span className="footer-dot">•</span>
              <span className="app-footer-copy">© 2026 TalentSprint AI Platform.</span>
            </div>

            <div className="app-footer-center">
              <span className="footer-engine-tag">
                <span className="engine-dot"></span> 8 Core Modules Active
              </span>
            </div>

            <div className="app-footer-links">
              <Link to="/knowledge-base">Internship Opportunities</Link>
              <Link to="/job-matching">Matching</Link>
              <Link to="/skill-gap">Skill Gap</Link>
              <Link to="/customizer">CV Generator</Link>
              <Link to="/interview-prep">Interview Prep</Link>
              <Link to="/career-assistant">AI Career Companion</Link>
            </div>
          </div>
        </footer>
      </main>

      {/* Floating AI Assistant at Right Corner */}
      <FloatingAICopilot />
    </div>
  );
}

