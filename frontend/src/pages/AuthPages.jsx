import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";

export function LandingPage() {
  const navigate = useNavigate();

  const modules = [
    {
      id: 1,
      title: "1. Profile & Resume Mgmt",
      desc: "Maintain your student academic profile and manage active resume versions seamlessly.",
      icon: "👤",
      path: "/profile"
    },
    {
      id: 2,
      title: "2. Deep Resume Parsing",
      desc: "Extract technical and soft skills, projects, and work history with AI verification.",
      icon: "📄",
      path: "/resume-parser"
    },
    {
      id: 3,
      title: "3. Internship Opportunities",
      desc: "Explore verified internship openings across leading tech companies with AI-assisted querying.",
      icon: "💼",
      path: "/knowledge-base"
    },
    {
      id: 4,
      title: "4. Job-Resume Matching",
      desc: "Multi-factor compatibility scoring comparing skills, experience, and domain fit.",
      icon: "🎯",
      path: "/job-matching"
    },
    {
      id: 5,
      title: "5. Skill Gap Analysis",
      desc: "Identify missing skills with customized learning roadmaps, courses, and project ideas.",
      icon: "📈",
      path: "/skill-gap"
    },
    {
      id: 6,
      title: "6. Resume & Cover Letter",
      desc: "AI tailor your resume bullets and generate company-specific cover letters.",
      icon: "✍️",
      path: "/customizer"
    },
    {
      id: 7,
      title: "7. Interview Preparation",
      desc: "Role-specific technical and STAR behavioral questions with AI answer grading.",
      icon: "🎙️",
      path: "/interview-prep"
    },
    {
      id: 8,
      title: "8. Ask AI Mentor",
      desc: "Continuous conversational AI mentorship loaded with your personal profile, resume, and skills context.",
      icon: "💬",
      path: "/career-assistant"
    }
  ];

  const handleModuleClick = (path) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      navigate(path);
    } else {
      navigate(`/login?redirect=${encodeURIComponent(path)}`);
    }
  };

  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <Link to="/" className="landing-logo-link">
          <div className="logo">
            Talent<span>Sprint AI</span>
          </div>
        </Link>

        <div className="landing-nav-center">
          <a href="#modules" className="nav-menu-link">8 Modules</a>
          <button type="button" onClick={() => handleModuleClick("/resume-parser")} className="nav-menu-link-btn">Resume Parser</button>
          <button type="button" onClick={() => handleModuleClick("/job-matching")} className="nav-menu-link-btn">Job Match</button>
          <button type="button" onClick={() => handleModuleClick("/skill-gap")} className="nav-menu-link-btn">Skill Gap</button>
          <button type="button" onClick={() => handleModuleClick("/customizer")} className="nav-menu-link-btn">CV Builder</button>
          <button type="button" onClick={() => handleModuleClick("/interview-prep")} className="nav-menu-link-btn">Interview Prep</button>
          <button type="button" onClick={() => handleModuleClick("/career-assistant")} className="nav-menu-link-btn">AI Copilot</button>
        </div>

        <div className="landing-nav-links">
          <Link to="/login" className="nav-login">
            Sign In
          </Link>
          <Link to="/register" className="nav-register">
            Get Started Free →
          </Link>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">⚡ Career & Internship Acceleration Engine</div>
          <h1>
            Accelerate Your Career with <span>TalentSprint AI</span>
          </h1>
          <p>
            An integrated AI system covering Student Profile Management, Deep Resume
            Parsing, RAG Knowledge Retrieval, Precision Job Matching, Skill Gap Roadmaps,
            Customized Resumes & Cover Letters, Mock Interview Practice, and Application Tracking.
          </p>

          <div className="hero-buttons">
            <Link to="/register" className="hero-primary">
              Get Started Free
            </Link>
            <Link to="/login" className="hero-secondary">
              Login to Portal
            </Link>
          </div>
        </div>

        <div className="hero-dashboard">
          <div className="mockup-window">
            {/* Window title bar */}
            <div className="mockup-window-header">
              <div className="window-dots">
                <span className="dot dot-red"></span>
                <span className="dot dot-yellow"></span>
                <span className="dot dot-green"></span>
              </div>
              <div className="window-title">TalentSprint AI Cockpit</div>
              <span className="live-status-pill">
                <span className="live-dot"></span> Online
              </span>
            </div>

            {/* Window Content */}
            <div className="mockup-window-body">
              {/* Candidate Info Card */}
              <div className="mockup-candidate-strip">
                <div className="candidate-avatar">AC</div>
                <div className="candidate-info">
                  <strong>Alex Chen</strong>
                  <span>Target: AI & Full-Stack Intern • Bengaluru</span>
                </div>
                <div className="candidate-match-gauge">
                  <span className="gauge-number">96%</span>
                  <small>Match</small>
                </div>
              </div>

              {/* Opportunity Spotlight */}
              <div className="mockup-job-card">
                <div className="job-card-top-row">
                  <div>
                    <h5>Generative AI & LLM Intern</h5>
                    <p className="company-text">TechCorp Innovations • Remote / Hybrid</p>
                  </div>
                  <span className="stipend-pill">₹35,000 / mo</span>
                </div>

                <div className="mini-skills-row">
                  <span className="m-tag m-matched">✓ Python</span>
                  <span className="m-tag m-matched">✓ FastAPI</span>
                  <span className="m-tag m-matched">✓ PyTorch</span>
                  <span className="m-tag m-matched">✓ RAG / Vector</span>
                  <span className="m-tag m-gap">+ Redis Caching</span>
                </div>
              </div>

              {/* Intelligence Module Feeds */}
              <div className="mockup-feeds-grid">
                <div className="m-feed-item">
                  <span className="feed-icon">🎙️</span>
                  <div>
                    <strong>Mock Interview Evaluator</strong>
                    <p>Scored 9.2/10 • "Strong STAR framing & async trade-offs"</p>
                  </div>
                </div>

                <div className="m-feed-item">
                  <span className="feed-icon">✍️</span>
                  <div>
                    <strong>ATS Resume Customizer</strong>
                    <p>Tailored 4 impact bullets with verified tech keywords</p>
                  </div>
                </div>

                <div className="m-feed-item">
                  <span className="feed-icon">🤖</span>
                  <div>
                    <strong>AI Career Companion</strong>
                    <p>Generated personalized interview preparation roadmap</p>
                  </div>
                </div>
              </div>

              {/* Readiness Progress Bar */}
              <div className="mockup-progress-box">
                <div className="progress-labels">
                  <span>Candidate Placement Readiness</span>
                  <strong>94% Ready</strong>
                </div>
                <div className="mockup-progress-bar">
                  <div className="mockup-progress-fill" style={{ width: "94%" }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="modules" className="features-section">
        <div className="features-section-header">
          <h2>The 9 Core Intelligence Modules</h2>
          <p>Click any module below to jump directly into the workspace or log in to continue</p>
        </div>

        <div className="features-grid">
          {modules.map((m) => (
            <div
              key={m.id}
              className="feature-card feature-card-interactive"
              onClick={() => handleModuleClick(m.path)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleModuleClick(m.path);
                }
              }}
            >
              <div className="feature-icon">{m.icon}</div>
              <h3>{m.title}</h3>
              <p>{m.desc}</p>
              <div className="feature-action-row">
                <span className="feature-action-link">Open Module {m.id} →</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Comprehensive Landing Page Footer */}
      <footer className="landing-footer-modern">
        <div className="footer-top-grid">
          {/* Col 1: Brand & Mission */}
          <div className="footer-col footer-col-brand">
            <div className="logo">
              Talent<span>Sprint AI</span>
            </div>
            <p className="footer-brand-mission">
              Empowering the next generation of engineers with an integrated, autonomous career accelerator: semantic RAG job matching, real-time resume ATS optimization, mock interviews, and personalized AI career mentorship.
            </p>
            <div className="footer-status-pill">
              <span className="status-indicator-dot"></span>
              <span>All 8 Intelligence Modules Live</span>
            </div>
          </div>

          {/* Col 2: Intelligence Suite */}
          <div className="footer-col">
            <h4>Intelligence Suite</h4>
            <ul>
              <li><button type="button" onClick={() => handleModuleClick("/profile")} className="footer-nav-btn">1. Student Profile & Resumes</button></li>
              <li><button type="button" onClick={() => handleModuleClick("/resume-parser")} className="footer-nav-btn">2. Deep Resume Parser</button></li>
              <li><button type="button" onClick={() => handleModuleClick("/knowledge-base")} className="footer-nav-btn">3. Internship Opportunities</button></li>
              <li><button type="button" onClick={() => handleModuleClick("/job-matching")} className="footer-nav-btn">4. Compatibility Scoring</button></li>
              <li><button type="button" onClick={() => handleModuleClick("/skill-gap")} className="footer-nav-btn">5. Skill Gap Analysis</button></li>
            </ul>
          </div>

          {/* Col 3: Career Tools */}
          <div className="footer-col">
            <h4>Career Acceleration</h4>
            <ul>
              <li><button type="button" onClick={() => handleModuleClick("/customizer")} className="footer-nav-btn">6. Role-Specific ATS CV</button></li>
              <li><button type="button" onClick={() => handleModuleClick("/interview-prep")} className="footer-nav-btn">7. Mock Interview Practice</button></li>
              <li><button type="button" onClick={() => handleModuleClick("/career-assistant")} className="footer-nav-btn">8. Conversational AI Mentor</button></li>
              <li><button type="button" onClick={() => handleModuleClick("/customizer")} className="footer-nav-btn">📄 1-Click PDF CV Exporter</button></li>
            </ul>
          </div>

          {/* Col 4: Platform & Access */}
          <div className="footer-col">
            <h4>Platform & Access</h4>
            <ul>
              <li><a href="http://127.0.0.1:8001/docs" target="_blank" rel="noreferrer">FastAPI REST Docs ↗</a></li>
              <li><Link to="/login">Student Portal Sign In</Link></li>
              <li><Link to="/register">Create Free Account</Link></li>
              <li><a href="#modules">System Architecture</a></li>
              <li><Link to="/login?redirect=%2Fcareer-assistant">Contact AI Mentor Desk</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Legal Bar */}
        <div className="footer-bottom-bar">
          <p>© 2026 TalentSprint AI Platform. Built for ambitious students seeking top tech internships.</p>
          <div className="footer-bottom-links">
            <span className="footer-mini-link">Terms of Service</span>
            <span className="dot-sep">•</span>
            <span className="footer-mini-link">Privacy Policy</span>
            <span className="dot-sep">•</span>
            <span className="footer-mini-link">Academic License</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setSuccessMsg("🎉 Account created successfully! Please enter your password to sign in.");
      const emailParam = searchParams.get("email");
      if (emailParam) {
        setEmail(emailParam);
      }
    }
  }, [searchParams]);

  const getModuleTitle = (path) => {
    switch (path) {
      case "/profile": return "Module 1: Student Profile & Resumes";
      case "/resume-parser": return "Module 2: Deep Resume Parsing";
      case "/knowledge-base": return "Module 3: Internship Opportunities";
      case "/job-matching": return "Module 4: Job-Resume Matching";
      case "/skill-gap": return "Module 5: Skill Gap Analysis";
      case "/customizer": return "Module 6: Resume & Cover Customization";
      case "/interview-prep": return "Module 7: Interview Preparation";
      case "/career-assistant": return "Module 8: AI Career Assistant";
      default: return null;
    }
  };

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!email.trim() || !password) return;

    setLoading(true);
    setErrorMsg("");
    try {
      const formData = new URLSearchParams();
      formData.append("username", email.trim());
      formData.append("password", password);

      const response = await api.post("/auth/login", formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      const user = response.data.user ?? response.data;
      const token = response.data.access_token;

      if (!token) throw new Error("No token received.");

      localStorage.setItem("access_token", token);
      if (user?.id != null) localStorage.setItem("user_id", String(user.id));
      if (user?.name) localStorage.setItem("user_name", user.name);
      if (user?.email) localStorage.setItem("user_email", user.email);
      if (user?.role) localStorage.setItem("user_role", user.role);

      navigate(redirectPath, { replace: true });
    } catch (error) {
      const message =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        "Invalid email or password. Please try again.";
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = () => {
    setEmail("alex.student@example.com");
    setPassword("Student123!");
    setErrorMsg("");
  };

  return (
    <div className="auth-split-wrapper">
      {/* LEFT SHOWCASE HERO */}
      <div className="auth-hero-pane">
        <div className="hero-pane-glow"></div>
        <div className="hero-pane-content">
          <Link to="/" className="hero-brand-link">
            <div className="hero-brand-badge">⚡ TalentSprint AI</div>
          </Link>

          <h1 className="hero-pane-title">
            Land Your Dream Internship with <span>Autonomous AI</span>.
          </h1>

          <p className="hero-pane-desc">
            Your personalized career launchpad: semantic RAG job matching, real-time resume ATS optimization, STAR behavioral interview coaching, and continuous AI mentorship.
          </p>

          {/* Floating UI Feature Cards */}
          <div className="hero-feature-cards">
            <div className="h-card">
              <div className="h-card-icon">🎯</div>
              <div className="h-card-body">
                <div className="h-card-header">
                  <strong>Compatibility Score: 94%</strong>
                  <span className="badge-match-h">Top Match</span>
                </div>
                <small>Matched: Python, FastAPI, Docker, SQL, Git</small>
              </div>
            </div>

            <div className="h-card">
              <div className="h-card-icon">🎙️</div>
              <div className="h-card-body">
                <div className="h-card-header">
                  <strong>Mock Interview Evaluator</strong>
                  <span className="badge-score-h">Score: 9/10</span>
                </div>
                <small>"Strong non-blocking I/O explanation with async loop metrics."</small>
              </div>
            </div>

            <div className="h-card">
              <div className="h-card-icon">💼</div>
              <div className="h-card-body">
                <div className="h-card-header">
                  <strong>Internship Opportunities</strong>
                  <span className="badge-tech-h">Verified</span>
                </div>
                <small>12+ verified tech tracks with grounded domain intelligence</small>
              </div>
            </div>
          </div>

          <div className="hero-stats-strip">
            <div className="stat-pill">
              <strong>9</strong>
              <span>Core Modules</span>
            </div>
            <div className="stat-pill">
              <strong>12+</strong>
              <span>Job Domains</span>
            </div>
            <div className="stat-pill">
              <strong>24/7</strong>
              <span>AI Mentorship</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT AUTH CARD PANE */}
      <div className="auth-form-pane">
        <div className="auth-card-modern">
          <div className="auth-card-top-nav">
            <Link to="/" className="auth-back-pill">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Home
            </Link>
            <span className="auth-secure-tag">🔒 Secure Portal</span>
          </div>

          <div className="auth-header-block">
            <h2>Welcome Back</h2>
            <p>Enter your credentials or test with one-click demo access</p>
          </div>

          {getModuleTitle(redirectPath) && (
            <div className="auth-target-banner">
              <span className="target-badge-icon">👉</span>
              <div>
                Please sign in to open: <strong>{getModuleTitle(redirectPath)}</strong>
              </div>
            </div>
          )}

          {successMsg && <div className="auth-alert-success">{successMsg}</div>}
          {errorMsg && <div className="auth-alert-error">{errorMsg}</div>}

          {/* Quick Demo Login Option */}
          <button
            type="button"
            onClick={fillDemoAccount}
            className="btn-demo-quickfill"
          >
            ⚡ Click to Fill Demo Student Credentials
          </button>

          <div className="auth-divider">
            <span>or sign in with email</span>
          </div>

          <form onSubmit={handleLogin} className="auth-form-clean">
            <div className="input-group-modern">
              <label htmlFor="login-email">Email Address</label>
              <div className="input-with-icon">
                <span className="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                </span>
                <input
                  id="login-email"
                  type="email"
                  placeholder="name@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="input-group-modern">
              <div className="label-row-between">
                <label htmlFor="login-password">Password</label>
                <Link to="/forgot-password" className="link-forgot">
                  Forgot password?
                </Link>
              </div>
              <div className="input-with-icon">
                <span className="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </span>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="btn-toggle-eye"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-auth-gradient" disabled={loading}>
              {loading ? (
                <span className="btn-loading-flex">
                  <span className="spinner-sm"></span> Signing In...
                </span>
              ) : (
                "Sign In to Portal →"
              )}
            </button>
          </form>

          <div className="auth-footer-block">
            <p>
              Don't have an account?{" "}
              <Link
                to={`/register${redirectPath !== "/dashboard" ? `?redirect=${encodeURIComponent(redirectPath)}` : ""}`}
                className="auth-link-bold"
              >
                Create Free Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


// Reusable Enterprise Password Criteria & Strength Checklist
function PasswordCriteriaChecklist({ password = "", confirmPassword = null, showConfirm = false }) {
  const criteria = [
    {
      id: "length",
      label: "At least 8 characters",
      met: password.length >= 8,
      sublabel: password.length > 0 ? `${password.length}/8` : ""
    },
    {
      id: "upper",
      label: "At least 1 uppercase letter (A-Z)",
      met: /[A-Z]/.test(password)
    },
    {
      id: "lower",
      label: "At least 1 lowercase letter (a-z)",
      met: /[a-z]/.test(password)
    },
    {
      id: "number",
      label: "At least 1 numeric digit (0-9)",
      met: /[0-9]/.test(password)
    },
    {
      id: "special",
      label: "At least 1 special symbol (!@#$%^&*...)",
      met: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?~`"'/\\]/.test(password)
    },
    {
      id: "no_space",
      label: "No spaces allowed",
      met: !/\s/.test(password) && password.length > 0
    }
  ];

  if (showConfirm && confirmPassword !== null) {
    criteria.push({
      id: "match",
      label: "Passwords match exactly",
      met: password.length > 0 && password === confirmPassword
    });
  }

  const metCount = criteria.filter((c) => c.met).length;
  const totalCount = criteria.length;
  const percent = Math.round((metCount / totalCount) * 100);

  let strengthLabel = "Too Weak";
  let strengthColor = "#ef4444";
  if (metCount <= 2) {
    strengthLabel = "Weak";
    strengthColor = "#ef4444";
  } else if (metCount <= 4) {
    strengthLabel = "Fair";
    strengthColor = "#f59e0b";
  } else if (metCount < totalCount) {
    strengthLabel = "Good";
    strengthColor = "#3b82f6";
  } else {
    strengthLabel = "Strong & Compliant ✓";
    strengthColor = "#10b981";
  }

  return (
    <div className="pwd-criteria-card">
      <div className="pwd-strength-header">
        <span className="pwd-strength-title">Security Criteria Checklist:</span>
        <span className="pwd-strength-status" style={{ color: strengthColor, fontWeight: "700" }}>
          {strengthLabel} ({metCount}/{totalCount})
        </span>
      </div>

      <div className="pwd-meter-track">
        <div
          className="pwd-meter-fill"
          style={{ width: `${percent}%`, backgroundColor: strengthColor }}
        ></div>
      </div>

      <div className="pwd-criteria-grid">
        {criteria.map((c) => (
          <div
            key={c.id}
            className={`pwd-criterion-item ${c.met ? "criterion-met" : "criterion-unmet"}`}
          >
            <span className="criterion-icon">{c.met ? "✓" : "✕"}</span>
            <span className="criterion-text">{c.label}</span>
            {c.sublabel && <small className="criterion-sub">({c.sublabel})</small>}
          </div>
        ))}
      </div>
    </div>
  );
}


export function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/dashboard";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Real-time criteria validation
  const isLengthValid = password.length >= 8 && password.length <= 128;
  const isUpperValid = /[A-Z]/.test(password);
  const isLowerValid = /[a-z]/.test(password);
  const isNumberValid = /[0-9]/.test(password);
  const isSpecialValid = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?~`"'/\\]/.test(password);
  const isNoSpaceValid = !/\s/.test(password) && password.length > 0;
  const isAllPasswordCriteriaMet =
    isLengthValid &&
    isUpperValid &&
    isLowerValid &&
    isNumberValid &&
    isSpecialValid &&
    isNoSpaceValid;

  const isGmail = email.trim().toLowerCase().endsWith("@gmail.com") || email.trim().toLowerCase().endsWith("@googlemail.com");

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!isAllPasswordCriteriaMet) {
      setErrorMsg("Password does not meet all required security criteria. Please check the requirements below.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/register", {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password
      });

      // Redirect back to login page
      navigate(`/login?registered=true&email=${encodeURIComponent(email.trim().toLowerCase())}`, { replace: true });
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || "Registration failed. Please verify your details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split-wrapper">
      {/* LEFT HERO BRAND PANE */}
      <div className="auth-hero-pane">
        <div className="hero-pane-glow"></div>
        <div className="hero-pane-content">
          <Link to="/" className="hero-brand-link">
            <div className="hero-brand-badge">⚡ TalentSprint AI</div>
          </Link>

          <h1 className="hero-pane-title">
            Unlock 9 Intelligent Modules for <span>Student Success</span>.
          </h1>

          <p className="hero-pane-desc">
            Create your free student account to parse your resume, diagnose skill gaps, auto-tailor application materials, and practice role-specific technical interviews.
          </p>

          <div className="hero-feature-cards">
            <div className="h-card">
              <div className="h-card-icon">🚀</div>
              <div className="h-card-body">
                <div className="h-card-header">
                  <strong>Zero Cost for Students</strong>
                  <span className="badge-match-h">100% Free</span>
                </div>
                <small>Full access to AI Mock Interviews & RAG Matching</small>
              </div>
            </div>

            <div className="h-card">
              <div className="h-card-icon">⚡</div>
              <div className="h-card-body">
                <div className="h-card-header">
                  <strong>ATS Resume Customizer</strong>
                  <span className="badge-score-h">High Impact</span>
                </div>
                <small>Keyword enrichment & quantified bullet generation</small>
              </div>
            </div>

            <div className="h-card">
              <div className="h-card-icon">📋</div>
              <div className="h-card-body">
                <div className="h-card-header">
                  <strong>Kanban Tracking Board</strong>
                  <span className="badge-tech-h">Organized</span>
                </div>
                <small>Never miss an interview round or application deadline</small>
              </div>
            </div>
          </div>

          <div className="hero-stats-strip">
            <div className="stat-pill">
              <strong>12+</strong>
              <span>Tracks</span>
            </div>
            <div className="stat-pill">
              <strong>100%</strong>
              <span>Automated</span>
            </div>
            <div className="stat-pill">
              <strong>9</strong>
              <span>Modules</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT AUTH CARD PANE */}
      <div className="auth-form-pane">
        <div className="auth-card-modern">
          <div className="auth-card-top-nav">
            <Link to="/" className="auth-back-pill">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Home
            </Link>
            <span className="auth-secure-tag">✨ Instant Setup</span>
          </div>

          <div className="auth-header-block">
            <h2>Create Account</h2>
            <p>Join the next generation AI internship acceleration platform</p>
          </div>

          {errorMsg && <div className="auth-alert-error">⚠️ {errorMsg}</div>}

          <form onSubmit={handleRegister} className="auth-form-clean">
            <div className="input-group-modern">
              <label htmlFor="reg-name">Full Name</label>
              <div className="input-with-icon">
                <span className="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </span>
                <input
                  id="reg-name"
                  type="text"
                  placeholder="e.g. Bharath Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="input-group-modern">
              <div className="label-row-between">
                <label htmlFor="reg-email">Gmail Address</label>
                {email && (
                  <span className={`email-format-badge ${isGmail ? "badge-valid" : "badge-warn"}`}>
                    {isGmail ? "✓ Valid Gmail" : "⚠️ Use @gmail.com"}
                  </span>
                )}
              </div>
              <div className="input-with-icon">
                <span className="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                </span>
                <input
                  id="reg-email"
                  type="email"
                  placeholder="e.g. student@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="input-group-modern">
              <label htmlFor="reg-password">Password (Security Standard)</label>
              <div className="input-with-icon">
                <span className="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </span>
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter strong password (e.g. Strong@2026!)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="btn-toggle-eye"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Real-time Interactive Password Criteria Checklist */}
              {password.length > 0 && (
                <PasswordCriteriaChecklist password={password} />
              )}
            </div>

            <button
              type="submit"
              className="btn-auth-gradient"
              disabled={loading || !isAllPasswordCriteriaMet}
              title={!isAllPasswordCriteriaMet ? "Please satisfy all password criteria above" : "Create Account"}
            >
              {loading ? (
                <span className="btn-loading-flex">
                  <span className="spinner-sm"></span> Creating Account...
                </span>
              ) : isAllPasswordCriteriaMet ? (
                "Create Free Account →"
              ) : (
                "Complete Password Criteria to Proceed →"
              )}
            </button>
          </form>

          <div className="auth-footer-block">
            <p>
              Already registered?{" "}
              <Link
                to={`/login${redirectPath !== "/dashboard" ? `?redirect=${encodeURIComponent(redirectPath)}` : ""}`}
                className="auth-link-bold"
              >
                Sign In to Portal
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // OTP State
  const [otpStep, setOtpStep] = useState(1); // 1 = enter email, 2 = enter otp & new pwd
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [enteredOtp, setEnteredOtp] = useState("");

  // Password fields
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const cleanEmail = email.trim().toLowerCase();
  const isGmail = cleanEmail.endsWith("@gmail.com") || cleanEmail.endsWith("@googlemail.com");

  // Real-time criteria validation
  const isLengthValid = newPassword.length >= 8 && newPassword.length <= 128;
  const isUpperValid = /[A-Z]/.test(newPassword);
  const isLowerValid = /[a-z]/.test(newPassword);
  const isNumberValid = /[0-9]/.test(newPassword);
  const isSpecialValid = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?~`"'/\\]/.test(newPassword);
  const isNoSpaceValid = !/\s/.test(newPassword) && newPassword.length > 0;
  const isMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const isAllCriteriaMet =
    isLengthValid &&
    isUpperValid &&
    isLowerValid &&
    isNumberValid &&
    isSpecialValid &&
    isNoSpaceValid &&
    isMatch;

  // Handle Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError("");
    if (!cleanEmail) return;
    if (!isGmail) {
      setError("Password reset is strictly available ONLY for registered Gmail accounts (@gmail.com).");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/auth/send-otp", { email: cleanEmail });
      setGeneratedOtp(res.data.otp_code || "");
      setEnteredOtp(res.data.otp_code || ""); // auto-fill for instant convenience
      setOtpStep(2);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to generate verification code. Please check your registered Gmail address.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Verify OTP & Reset
  const handleVerifyOTPAndReset = async (e) => {
    e.preventDefault();
    setError("");
    if (!enteredOtp || enteredOtp.length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }
    if (!isAllCriteriaMet) {
      setError(!isMatch ? "Passwords do not match." : "Password does not meet all security criteria.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/auth/verify-otp-reset", {
        email: cleanEmail,
        otp: enteredOtp.trim(),
        new_password: newPassword
      });
      setSuccessMsg(res.data.message || "Password updated successfully!");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.detail || "Verification failed. Please check the code and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split-wrapper">
      <div className="auth-hero-pane">
        <div className="hero-pane-glow"></div>
        <div className="hero-pane-content">
          <Link to="/" className="hero-brand-link">
            <div className="hero-brand-badge">⚡ TalentSprint AI</div>
          </Link>
          <h1 className="hero-pane-title">
            6-Digit Code <span>Reset</span>.
          </h1>
          <p className="hero-pane-desc">
            Enter your registered Gmail account to generate a secure 6-digit verification code and reset your password instantly.
          </p>
          <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "rgba(255,255,255,0.85)" }}>
              <span>⚡</span> <span><strong>Instant Verification</strong>: 6-digit code for instant verification</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "rgba(255,255,255,0.85)" }}>
              <span>🛡️</span> <span><strong>Registered Gmail Only</strong>: Verified accounts only (@gmail.com)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "rgba(255,255,255,0.85)" }}>
              <span>🔒</span> <span><strong>Enterprise Criteria</strong>: Uppercase, lowercase, numbers & symbols</span>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-form-pane">
        <div className="auth-card-modern">
          <div className="auth-card-top-nav">
            <Link to="/login" className="auth-back-pill">
              ← Back to Sign In
            </Link>
            <span className="auth-secure-tag">🛡️ Registered Gmail Only</span>
          </div>

          <div className="auth-header-block">
            <h2>Reset Your Password</h2>
            <p>
              {otpStep === 1
                ? "Enter your registered Gmail account to receive your 6-digit verification code"
                : `Enter the 6-digit code generated for ${cleanEmail}`}
            </p>
          </div>

          {error && (
            <div className="alert-banner alert-error" style={{ marginBottom: "16px" }}>
              ⚠️ {error}
            </div>
          )}

          {successMsg && (
            <div style={{
              background: "#ecfdf5",
              border: "1px solid #6ee7b7",
              color: "#065f46",
              padding: "16px",
              borderRadius: "10px",
              textAlign: "center",
              marginBottom: "16px"
            }}>
              <div style={{ fontSize: "24px", marginBottom: "6px" }}>🎉</div>
              <strong style={{ fontSize: "15px" }}>{successMsg}</strong>
              <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#047857" }}>
                Redirecting you to sign in...
              </p>
            </div>
          )}

          {!successMsg && (
            <div>
              {otpStep === 1 ? (
                <form onSubmit={handleSendOTP} className="auth-form-clean">
                  <div className="input-group-modern">
                    <div className="label-row-between">
                      <label htmlFor="otp-email">Registered Gmail Address *</label>
                      <span className="auth-hint-pill">🔒 @gmail.com only</span>
                    </div>
                    <div className="input-with-icon">
                      <span className="input-icon">✉️</span>
                      <input
                        id="otp-email"
                        type="email"
                        placeholder="e.g. bharathkumarjm16@gmail.com"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(""); }}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn-auth-gradient"
                    disabled={loading || (email.length > 0 && !isGmail)}
                  >
                    {loading ? "Generating Code..." : "Generate 6-Digit Code →"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOTPAndReset} className="auth-form-clean">
                  <div style={{
                    background: "#fef3c7",
                    border: "1px solid #fcd34d",
                    borderRadius: "8px",
                    padding: "12px 14px",
                    marginBottom: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                  }}>
                    <div>
                      <div style={{ fontSize: "11px", color: "#92400e", fontWeight: "700", textTransform: "uppercase" }}>Your 6-Digit Code</div>
                      <div style={{ fontSize: "20px", fontWeight: "900", letterSpacing: "4px", color: "#78350f" }}>
                        {generatedOtp}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEnteredOtp(generatedOtp)}
                      style={{
                        background: "#f59e0b",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "6px",
                        padding: "6px 12px",
                        fontSize: "12px",
                        fontWeight: "700",
                        cursor: "pointer"
                      }}
                    >
                      ⚡ Auto-Fill
                    </button>
                  </div>

                  <div className="input-group-modern">
                    <label htmlFor="otp-input">Enter 6-Digit Verification Code *</label>
                    <input
                      id="otp-input"
                      type="text"
                      maxLength="6"
                      placeholder="e.g. 482910"
                      value={enteredOtp}
                      onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ""))}
                      style={{
                        letterSpacing: "6px",
                        fontSize: "18px",
                        fontWeight: "800",
                        textAlign: "center"
                      }}
                      required
                    />
                  </div>

                  <div className="input-group-modern">
                    <div className="label-row-between">
                      <label htmlFor="otp-pwd">New Password *</label>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ background: "none", border: "none", color: "#4f46e5", fontSize: "12px", cursor: "pointer", fontWeight: "600" }}
                      >
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                    <input
                      id="otp-pwd"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter strong new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="input-group-modern">
                    <label htmlFor="otp-confirm-pwd">Confirm New Password *</label>
                    <input
                      id="otp-confirm-pwd"
                      type={showPassword ? "text" : "password"}
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>

                  {newPassword.length > 0 && (
                    <PasswordCriteriaChecklist
                      password={newPassword}
                      confirmPassword={confirmPassword}
                      showConfirm={true}
                    />
                  )}

                  <button
                    type="submit"
                    className="btn-auth-gradient"
                    disabled={loading || !isAllCriteriaMet || enteredOtp.length !== 6}
                  >
                    {loading ? "Verifying & Updating..." : "Verify Code & Reset Password →"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setOtpStep(1)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#64748b",
                      fontSize: "12px",
                      marginTop: "10px",
                      width: "100%",
                      cursor: "pointer"
                    }}
                  >
                    ← Change email or request new code
                  </button>
                </form>
              )}
            </div>
          )}

          <div className="auth-footer-block" style={{ marginTop: "20px" }}>
            <p>
              Remembered your password?{" "}
              <Link to="/login" className="auth-link-bold">
                Back to Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [verifyError, setVerifyError] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Real-time criteria validation
  const isLengthValid = newPassword.length >= 8 && newPassword.length <= 128;
  const isUpperValid = /[A-Z]/.test(newPassword);
  const isLowerValid = /[a-z]/.test(newPassword);
  const isNumberValid = /[0-9]/.test(newPassword);
  const isSpecialValid = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?~`"'/\\]/.test(newPassword);
  const isNoSpaceValid = !/\s/.test(newPassword) && newPassword.length > 0;
  const isMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const isAllPasswordCriteriaMet =
    isLengthValid &&
    isUpperValid &&
    isLowerValid &&
    isNumberValid &&
    isSpecialValid &&
    isNoSpaceValid &&
    isMatch;

  useEffect(() => {
    if (!token) {
      setVerifying(false);
      setTokenValid(false);
      setVerifyError("No reset token provided. Please request a new password reset link from your registered Gmail.");
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await api.post("/auth/verify-reset-token", { token });
        setUserInfo(res.data);
        setTokenValid(true);
      } catch (err) {
        setTokenValid(false);
        setVerifyError(err.response?.data?.detail || "Invalid or expired password reset link. Please request a new one.");
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleReset = async (e) => {
    e.preventDefault();
    setSubmitError("");

    if (!isAllPasswordCriteriaMet) {
      if (!isMatch) {
        setSubmitError("Passwords do not match. Please ensure both fields are identical.");
      } else {
        setSubmitError("Password does not satisfy all required security criteria.");
      }
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/auth/reset-password", {
        token,
        new_password: newPassword
      });
      setSubmitSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 2500);
    } catch (err) {
      setSubmitError(err.response?.data?.detail || "Failed to update password. The reset link may have expired.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-split-wrapper">
      <div className="auth-hero-pane">
        <div className="hero-pane-glow"></div>
        <div className="hero-pane-content">
          <Link to="/" className="hero-brand-link">
            <div className="hero-brand-badge">⚡ TalentSprint AI</div>
          </Link>
          <h1 className="hero-pane-title">
            Choose a New <span>Password</span>.
          </h1>
          <p className="hero-pane-desc">
            Keep your account secure with enterprise-grade password criteria. Your new password will grant immediate access to your candidate profile and all 8 modules.
          </p>
        </div>
      </div>

      <div className="auth-form-pane">
        <div className="auth-card-modern">
          <div className="auth-card-top-nav">
            <Link to="/login" className="auth-back-pill">
              ← Back to Sign In
            </Link>
            <span className="auth-secure-tag">🛡️ Verified Session</span>
          </div>

          <div className="auth-header-block">
            <h2>Set New Password</h2>
            {userInfo?.email ? (
              <p>
                Updating credentials for registered Gmail: <strong>{userInfo.email}</strong>
              </p>
            ) : (
              <p>Enter your new compliant password below</p>
            )}
          </div>

          {verifying ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div className="auth-spinner" style={{ margin: "0 auto 16px" }}></div>
              <p style={{ color: "#64748b", fontSize: "14px" }}>Verifying reset security token...</p>
            </div>
          ) : !tokenValid ? (
            <div className="direct-reset-card" style={{ textAlign: "center" }}>
              <div style={{ fontSize: "36px", marginBottom: "12px" }}>⚠️</div>
              <h3 style={{ margin: "0 0 8px", color: "#0f172a", fontSize: "18px" }}>Reset Link Expired or Invalid</h3>
              <p style={{ color: "#ef4444", fontSize: "13.5px", margin: "0 0 20px" }}>{verifyError}</p>
              <Link to="/forgot-password" className="btn-auth-gradient" style={{ display: "inline-block", textDecoration: "none" }}>
                Request New Reset Link →
              </Link>
            </div>
          ) : submitSuccess ? (
            <div className="direct-reset-card" style={{ textAlign: "center" }}>
              <div style={{ fontSize: "36px", marginBottom: "12px" }}>🎉</div>
              <h3 style={{ margin: "0 0 8px", color: "#0f172a", fontSize: "18px" }}>Password Reset Complete!</h3>
              <p style={{ color: "#10b981", fontSize: "13.5px", margin: "0 0 20px" }}>
                Your account password has been updated securely. Redirecting you to sign in...
              </p>
              <Link to="/login" className="btn-auth-gradient" style={{ display: "inline-block", textDecoration: "none" }}>
                Sign In Now →
              </Link>
            </div>
          ) : (
            <form onSubmit={handleReset} className="auth-form-clean">
              {submitError && (
                <div className="alert-banner alert-error" style={{ marginBottom: "16px" }}>
                  ⚠️ {submitError}
                </div>
              )}

              <div className="input-group-modern">
                <label htmlFor="new-password">New Password</label>
                <div className="input-with-icon">
                  <span className="input-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                  </span>
                  <input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password (min 8 chars)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={submitting}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>

                {/* Real-time Checklist for New Password */}
                {newPassword.length > 0 && (
                  <PasswordCriteriaChecklist
                    password={newPassword}
                    confirmPassword={confirmPassword}
                    showConfirm={confirmPassword.length > 0}
                  />
                )}
              </div>

              <div className="input-group-modern">
                <div className="label-row-between">
                  <label htmlFor="confirm-password">Confirm New Password</label>
                  {confirmPassword.length > 0 && (
                    <span className={`pwd-match-badge ${isMatch ? "match-yes" : "match-no"}`}>
                      {isMatch ? "✓ Passwords Match" : "✕ Do Not Match"}
                    </span>
                  )}
                </div>
                <div className="input-with-icon">
                  <span className="input-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    </svg>
                  </span>
                  <input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Repeat your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={submitting}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn-auth-gradient"
                disabled={submitting || !isAllPasswordCriteriaMet}
                title={!isAllPasswordCriteriaMet ? "Please satisfy all password criteria above" : "Update Password"}
              >
                {submitting ? (
                  <span className="btn-loading-flex">
                    <span className="spinner-sm"></span> Updating Password...
                  </span>
                ) : isAllPasswordCriteriaMet ? (
                  "Update Password & Sign In →"
                ) : (
                  "Complete Password Criteria to Proceed →"
                )}
              </button>
            </form>
          )}

          <div className="auth-footer-block">
            <p>
              Remembered your credentials?{" "}
              <Link to="/login" className="auth-link-bold">
                Back to Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
