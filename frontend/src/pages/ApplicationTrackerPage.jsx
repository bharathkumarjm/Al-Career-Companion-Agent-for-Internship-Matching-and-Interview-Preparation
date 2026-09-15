import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import api from "../services/api";

const STAGES = ["Applied", "Screening", "Interviewing", "Offered", "Rejected"];

// Vector Icons for Stages
function IconPaperPlane() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function IconSearchDoc() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <path d="M11 8v6M8 11h6" />
    </svg>
  );
}

function IconMicrophone() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <line x1="12" y1="17" x2="12" y2="21" />
      <line x1="8" y1="21" x2="16" y2="21" />
    </svg>
  );
}

function IconTrophy() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.45 1-1 1H7v4h10v-4h-2c-.55 0-1-.45-1-1v-2.34" />
      <path d="M6 4h12v7a6 6 0 0 1-12 0V4z" />
    </svg>
  );
}

function IconRejected() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

function IconKanban() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="5" height="18" rx="1.5" />
      <rect x="10" y="3" width="5" height="12" rx="1.5" />
      <rect x="17" y="3" width="5" height="15" rx="1.5" />
    </svg>
  );
}

function IconTable() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9" y1="3" x2="9" y2="21" />
    </svg>
  );
}

const STAGE_CONFIG = {
  Applied: {
    name: "Applied",
    stepNum: "1",
    subtitle: "Resume Submitted",
    desc: "Application sent to company portal or recruiter.",
    color: "#2563eb",
    bg: "#eff6ff",
    border: "#bfdbfe",
    next: "Screening",
    nextLabel: "Move to Screening →",
    icon: <IconPaperPlane />
  },
  Screening: {
    name: "Screening",
    stepNum: "2",
    subtitle: "Resume Review & OA",
    desc: "Recruiter reviewing profile or online assessment pending.",
    color: "#d97706",
    bg: "#fffbeb",
    border: "#fde68a",
    next: "Interviewing",
    nextLabel: "Schedule Interview →",
    icon: <IconSearchDoc />
  },
  Interviewing: {
    name: "Interviewing",
    stepNum: "3",
    subtitle: "Tech & HR Rounds",
    desc: "Active coding rounds, system design, or behavioral interviews.",
    color: "#7c3aed",
    bg: "#f5f3ff",
    border: "#ddd6fe",
    next: "Offered",
    nextLabel: "Mark as Offered →",
    icon: <IconMicrophone />
  },
  Offered: {
    name: "Offered",
    stepNum: "4",
    subtitle: "Placement Ready! 🎉",
    desc: "Official internship offer letter extended!",
    color: "#059669",
    bg: "#ecfdf5",
    border: "#a7f3d0",
    next: null,
    nextLabel: "Accepted Offer",
    icon: <IconTrophy />
  },
  Rejected: {
    name: "Rejected",
    stepNum: "—",
    subtitle: "Archived / Closed",
    desc: "Position filled or application not selected.",
    color: "#dc2626",
    bg: "#fef2f2",
    border: "#fecaca",
    next: null,
    nextLabel: null,
    icon: <IconRejected />
  }
};

export default function ApplicationTrackerPage() {
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    applied: 0,
    screening: 0,
    interviewing: 0,
    offered: 0,
    rejected: 0
  });
  const [viewMode, setViewMode] = useState("kanban"); // "kanban" or "table"
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showInfoBanner, setShowInfoBanner] = useState(true);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [formData, setFormData] = useState({
    company: "",
    role: "",
    location: "Remote",
    stipend: "₹35,000 / month",
    status: "Applied",
    applied_date: new Date().toISOString().split("T")[0],
    interview_date: "",
    notes: "",
    job_link: "",
    match_score: "92"
  });

  const [statusMsg, setStatusMsg] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [appsRes, statsRes] = await Promise.all([
        api.get("/api/applications/"),
        api.get("/api/applications/stats")
      ]);
      setApplications(appsRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error("Failed to load applications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (statusMsg) {
      const timer = setTimeout(() => setStatusMsg(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [statusMsg]);

  const handleOpenAdd = () => {
    setEditingApp(null);
    setFormData({
      company: "",
      role: "",
      location: "Remote",
      stipend: "₹35,000 / month",
      status: "Applied",
      applied_date: new Date().toISOString().split("T")[0],
      interview_date: "",
      notes: "",
      job_link: "",
      match_score: "92"
    });
    setShowModal(true);
  };

  const handleOpenEdit = (app) => {
    setEditingApp(app);
    setFormData({
      company: app.company,
      role: app.role,
      location: app.location || "Remote",
      stipend: app.stipend || "Competitive",
      status: app.status || "Applied",
      applied_date: app.applied_date || "",
      interview_date: app.interview_date || "",
      notes: app.notes || "",
      job_link: app.job_link || "",
      match_score: app.match_score || ""
    });
    setShowModal(true);
  };

  const handleSaveApp = async (e) => {
    e.preventDefault();
    if (!formData.company.trim() || !formData.role.trim()) return;

    try {
      const payload = {
        ...formData,
        match_score: formData.match_score ? Number(formData.match_score) : null
      };

      if (editingApp) {
        await api.put(`/api/applications/${editingApp.id}`, payload);
        setStatusMsg("Application updated! ✅");
      } else {
        await api.post("/api/applications/", payload);
        setStatusMsg("New application added to pipeline! 🎉");
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      alert("Failed to save application.");
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await api.put(`/api/applications/${id}`, { status: newStatus });
      setStatusMsg(`Moved application to ${newStatus}! 🚀`);
      loadData();
    } catch (err) {
      alert("Failed to update status.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this application from your tracker?")) return;
    try {
      await api.delete(`/api/applications/${id}`);
      loadData();
      setStatusMsg("Application removed.");
    } catch (err) {
      alert("Failed to delete application.");
    }
  };

  const handleCleanDuplicates = async () => {
    try {
      const res = await api.post("/api/applications/clean-duplicates");
      setStatusMsg(res.data.message || "Duplicates cleaned! 🧹");
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSeedDemo = async () => {
    if (!window.confirm("Populate a balanced multi-stage demo pipeline? This will arrange sample applications across all 5 recruitment stages so you can explore the workflow.")) return;
    try {
      const res = await api.post("/api/applications/seed-demo");
      setStatusMsg(res.data.message || "Balanced demo pipeline ready! 🌟");
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const getCompanyAvatar = (companyName) => {
    const initials = companyName
      ? companyName
          .split(" ")
          .map((w) => w[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()
      : "CO";
    const colors = [
      "linear-gradient(135deg, #4f46e5, #6366f1)",
      "linear-gradient(135deg, #0284c7, #06b6d4)",
      "linear-gradient(135deg, #059669, #10b981)",
      "linear-gradient(135deg, #d97706, #f59e0b)",
      "linear-gradient(135deg, #7c3aed, #a855f7)"
    ];
    const code = (companyName || "").charCodeAt(0) || 0;
    const gradient = colors[code % colors.length];
    return { initials, gradient };
  };

  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      (app.company || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.role || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStage =
      stageFilter === "all" ||
      (app.status || "").toLowerCase() === stageFilter.toLowerCase();
    return matchesSearch && matchesStage;
  });

  return (
    <Layout
      title="8. Job Application Pipeline Tracker"
      subtitle="Track, organize, and advance your internship applications from initial submission to final job offer"
    >
      {/* 🌟 1. Interactive Recruitment Pipeline Flow Banner */}
      <div className="pipeline-journey-banner">
        <div className="journey-top-row">
          <div className="journey-header-left">
            <span className="journey-eyebrow">RECRUITMENT JOURNEY STAGES</span>
            <h4 className="journey-heading">How Your Application Moves to an Offer</h4>
          </div>
          <div className="journey-header-right">
            <button
              type="button"
              className="btn-text-action"
              onClick={() => setShowInfoBanner(!showInfoBanner)}
            >
              {showInfoBanner ? "Hide Guide ▲" : "Show Guide ▼"}
            </button>
          </div>
        </div>

        {showInfoBanner && (
          <p className="journey-description">
            Internship applications advance through 4 key milestones. Click any stage below to inspect its applications, or use the <strong>Move to Next Stage →</strong> action on any card as companies reply!
          </p>
        )}

        {/* 4-Step Visual Recruitment Funnel */}
        <div className="pipeline-funnel-grid">
          {/* Step 1: Applied */}
          <div
            className={`funnel-step-card ${stageFilter === "Applied" ? "active-filter" : ""}`}
            onClick={() => setStageFilter(stageFilter === "Applied" ? "all" : "Applied")}
            role="button"
            tabIndex={0}
            title="Click to filter by Applied"
          >
            <div className="funnel-step-indicator step-blue">
              <span className="funnel-num">1</span>
              <IconPaperPlane />
            </div>
            <div className="funnel-step-text">
              <div className="step-title-row">
                <strong className="step-label">Applied</strong>
                <span className="step-badge badge-blue">{stats.applied || 0}</span>
              </div>
              <small className="step-desc">Application & Resume Sent</small>
            </div>
          </div>

          <div className="funnel-connector-arrow">➔</div>

          {/* Step 2: Screening */}
          <div
            className={`funnel-step-card ${stageFilter === "Screening" ? "active-filter" : ""}`}
            onClick={() => setStageFilter(stageFilter === "Screening" ? "all" : "Screening")}
            role="button"
            tabIndex={0}
            title="Click to filter by Screening"
          >
            <div className="funnel-step-indicator step-amber">
              <span className="funnel-num">2</span>
              <IconSearchDoc />
            </div>
            <div className="funnel-step-text">
              <div className="step-title-row">
                <strong className="step-label">Screening</strong>
                <span className="step-badge badge-amber">{stats.screening || 0}</span>
              </div>
              <small className="step-desc">Resume Review & OA Test</small>
            </div>
          </div>

          <div className="funnel-connector-arrow">➔</div>

          {/* Step 3: Interviewing */}
          <div
            className={`funnel-step-card ${stageFilter === "Interviewing" ? "active-filter" : ""}`}
            onClick={() => setStageFilter(stageFilter === "Interviewing" ? "all" : "Interviewing")}
            role="button"
            tabIndex={0}
            title="Click to filter by Interviewing"
          >
            <div className="funnel-step-indicator step-purple">
              <span className="funnel-num">3</span>
              <IconMicrophone />
            </div>
            <div className="funnel-step-text">
              <div className="step-title-row">
                <strong className="step-label">Interviewing</strong>
                <span className="step-badge badge-purple">{stats.interviewing || 0}</span>
              </div>
              <small className="step-desc">Tech & HR Rounds</small>
            </div>
          </div>

          <div className="funnel-connector-arrow">➔</div>

          {/* Step 4: Offered */}
          <div
            className={`funnel-step-card ${stageFilter === "Offered" ? "active-filter" : ""}`}
            onClick={() => setStageFilter(stageFilter === "Offered" ? "all" : "Offered")}
            role="button"
            tabIndex={0}
            title="Click to filter by Offered"
          >
            <div className="funnel-step-indicator step-emerald">
              <span className="funnel-num">4</span>
              <IconTrophy />
            </div>
            <div className="funnel-step-text">
              <div className="step-title-row">
                <strong className="step-label">Offered</strong>
                <span className="step-badge badge-emerald">{stats.offered || 0}</span>
              </div>
              <small className="step-desc">Offer Extended! 🎉</small>
            </div>
          </div>
        </div>
      </div>

      {/* 📊 2. Interactive KPI Overview Cards */}
      <section className="tracker-kpi-grid">
        {/* Total Active */}
        <div
          className={`pipeline-kpi-card ${stageFilter === "all" ? "kpi-card-selected" : ""}`}
          onClick={() => setStageFilter("all")}
          role="button"
          tabIndex={0}
        >
          <div className="kpi-icon-box kpi-box-indigo">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2.5" />
              <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
            </svg>
          </div>
          <div className="kpi-content">
            <span className="kpi-meta-tag">ACTIVE APPLICATIONS</span>
            <div className="kpi-number-row">
              <h3 className="kpi-huge-val">{stats.total}</h3>
              <span className="kpi-pill-action">
                {stageFilter === "all" ? "Active View ✓" : "View All →"}
              </span>
            </div>
            <small className="kpi-subtext">Total tracked across pipeline</small>
          </div>
        </div>

        {/* In Screening */}
        <div
          className={`pipeline-kpi-card ${stageFilter === "Screening" ? "kpi-card-selected" : ""}`}
          onClick={() => setStageFilter(stageFilter === "Screening" ? "all" : "Screening")}
          role="button"
          tabIndex={0}
        >
          <div className="kpi-icon-box kpi-box-amber">
            <IconSearchDoc />
          </div>
          <div className="kpi-content">
            <span className="kpi-meta-tag" style={{ color: "#d97706" }}>IN SCREENING</span>
            <div className="kpi-number-row">
              <h3 className="kpi-huge-val" style={{ color: "#d97706" }}>
                {stats.screening}
              </h3>
              <span className="kpi-pill-action">
                {stageFilter === "Screening" ? "Filtered ✓" : "Filter →"}
              </span>
            </div>
            <small className="kpi-subtext">Resume & assessments in progress</small>
          </div>
        </div>

        {/* Interviews */}
        <div
          className={`pipeline-kpi-card ${stageFilter === "Interviewing" ? "kpi-card-selected" : ""}`}
          onClick={() => setStageFilter(stageFilter === "Interviewing" ? "all" : "Interviewing")}
          role="button"
          tabIndex={0}
        >
          <div className="kpi-icon-box kpi-box-purple">
            <IconMicrophone />
          </div>
          <div className="kpi-content">
            <span className="kpi-meta-tag" style={{ color: "#7c3aed" }}>INTERVIEWS SCHEDULED</span>
            <div className="kpi-number-row">
              <h3 className="kpi-huge-val" style={{ color: "#7c3aed" }}>
                {stats.interviewing}
              </h3>
              <span className="kpi-pill-action">
                {stageFilter === "Interviewing" ? "Filtered ✓" : "Filter →"}
              </span>
            </div>
            <small className="kpi-subtext">Technical, system & HR rounds</small>
          </div>
        </div>

        {/* Offers Extended */}
        <div
          className={`pipeline-kpi-card ${stageFilter === "Offered" ? "kpi-card-selected" : ""}`}
          onClick={() => setStageFilter(stageFilter === "Offered" ? "all" : "Offered")}
          role="button"
          tabIndex={0}
        >
          <div className="kpi-icon-box kpi-box-emerald">
            <IconTrophy />
          </div>
          <div className="kpi-content">
            <span className="kpi-meta-tag" style={{ color: "#059669" }}>OFFERS EXTENDED</span>
            <div className="kpi-number-row">
              <h3 className="kpi-huge-val" style={{ color: "#059669" }}>
                {stats.offered}
              </h3>
              <span className="kpi-pill-action">
                {stageFilter === "Offered" ? "Filtered ✓" : "Filter →"}
              </span>
            </div>
            <small className="kpi-subtext">Placement Ready 🚀</small>
          </div>
        </div>
      </section>

      {/* 🛠️ 3. Modern Control & Filter Toolbar */}
      <div className="panel-box tracker-controls-bar">
        <div className="tracker-controls-left">
          {/* Segmented View Switcher (Fixed unstyled buttons) */}
          <div className="view-mode-segmented">
            <button
              type="button"
              className={`segment-btn ${viewMode === "kanban" ? "active" : ""}`}
              onClick={() => setViewMode("kanban")}
            >
              <IconKanban />
              <span>Kanban Board</span>
            </button>
            <button
              type="button"
              className={`segment-btn ${viewMode === "table" ? "active" : ""}`}
              onClick={() => setViewMode("table")}
            >
              <IconTable />
              <span>Table View</span>
            </button>
          </div>

          {/* Quick Stage Filter Chips */}
          <div className="stage-filter-chips">
            <button
              type="button"
              className={`filter-chip ${stageFilter === "all" ? "active" : ""}`}
              onClick={() => setStageFilter("all")}
            >
              All ({applications.length})
            </button>
            <button
              type="button"
              className={`filter-chip ${stageFilter === "Applied" ? "active" : ""}`}
              onClick={() => setStageFilter("Applied")}
            >
              Applied ({stats.applied || 0})
            </button>
            <button
              type="button"
              className={`filter-chip ${stageFilter === "Screening" ? "active" : ""}`}
              onClick={() => setStageFilter("Screening")}
            >
              Screening ({stats.screening || 0})
            </button>
            <button
              type="button"
              className={`filter-chip ${stageFilter === "Interviewing" ? "active" : ""}`}
              onClick={() => setStageFilter("Interviewing")}
            >
              Interviewing ({stats.interviewing || 0})
            </button>
            <button
              type="button"
              className={`filter-chip ${stageFilter === "Offered" ? "active" : ""}`}
              onClick={() => setStageFilter("Offered")}
            >
              Offered ({stats.offered || 0})
            </button>
          </div>

          {/* Search Box */}
          <div className="search-box-tracker">
            <input
              type="text"
              placeholder="Search company or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="tracker-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="btn-clear-search"
                onClick={() => setSearchQuery("")}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="tracker-controls-right">
          <button
            type="button"
            onClick={handleSeedDemo}
            className="btn-action-outline"
            title="Populate a multi-stage demo pipeline to test and explore the recruitment workflow"
          >
            ⚡ Demo Stages
          </button>
          <button
            type="button"
            onClick={handleCleanDuplicates}
            className="btn-action-outline"
            title="Clean redundant duplicate applications"
          >
            🧹 Clean Dups
          </button>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="btn-primary btn-add-app"
          >
            + Add Application
          </button>
        </div>
      </div>

      {loading && (
        <div className="loading-state panel-box">
          <div className="spinner"></div>
          <p>Loading application pipeline and stage metrics...</p>
        </div>
      )}

      {/* 📋 VIEW 1: KANBAN BOARD */}
      {!loading && viewMode === "kanban" && (
        <div className="kanban-board-container">
          {STAGES.map((stage) => {
            const config = STAGE_CONFIG[stage] || STAGE_CONFIG.Applied;
            const columnApps = filteredApplications.filter(
              (a) => (a.status || "applied").toLowerCase() === stage.toLowerCase()
            );

            // If a specific stage filter is active and not "all", dim or hide non-matching columns
            const isDimmed = stageFilter !== "all" && stageFilter.toLowerCase() !== stage.toLowerCase();

            return (
              <div
                key={stage}
                className={`kanban-column ${isDimmed ? "col-dimmed" : ""}`}
                style={{ borderTop: `4px solid ${config.color}` }}
              >
                <div className="kanban-col-header">
                  <div className="col-header-title-flex">
                    <span className="col-stage-icon" style={{ color: config.color }}>
                      {config.icon}
                    </span>
                    <div>
                      <strong className="col-title-text">{stage}</strong>
                      <small className="col-subtitle-text">{config.subtitle}</small>
                    </div>
                  </div>
                  <span
                    className="col-counter"
                    style={{
                      background: config.bg,
                      color: config.color,
                      border: `1px solid ${config.border}`
                    }}
                  >
                    {columnApps.length}
                  </span>
                </div>

                <div className="kanban-cards-wrapper">
                  {columnApps.map((app) => {
                    const avatar = getCompanyAvatar(app.company);
                    return (
                      <div key={app.id} className="kanban-card">
                        {/* Stage Progress Indicator on Card */}
                        <div className="card-stage-strip">
                          <span className="card-stage-pill" style={{ color: config.color, backgroundColor: config.bg }}>
                            Stage {config.stepNum} • {stage}
                          </span>
                        </div>

                        {/* Card Header with Company Avatar & Match Tag */}
                        <div className="kanban-card-top-flex">
                          <div className="company-badge-wrap">
                            <div
                              className="company-avatar-circle"
                              style={{ background: avatar.gradient }}
                            >
                              {avatar.initials}
                            </div>
                            <div className="company-text-meta">
                              <h5 className="app-role-title">{app.role}</h5>
                              <span className="app-company-name">{app.company}</span>
                            </div>
                          </div>

                          {app.match_score && (
                            <span
                              className={`match-tag-sm ${
                                app.match_score >= 90 ? "match-high" : "match-good"
                              }`}
                            >
                              {app.match_score}%
                            </span>
                          )}
                        </div>

                        {/* Location & Stipend Pills */}
                        <div className="app-meta-chips">
                          <span className="meta-chip">📍 {app.location || "Remote"}</span>
                          <span className="meta-chip">💰 {app.stipend || "Competitive"}</span>
                        </div>

                        {/* Interview Date Pill */}
                        {app.interview_date && (
                          <div className="interview-pill">
                            <span className="interview-icon">📅</span>
                            <span>{app.interview_date}</span>
                          </div>
                        )}

                        {/* Notes Preview */}
                        {app.notes && <p className="k-notes">"{app.notes}"</p>}

                        {/* Card Footer: Fast Stage Advancer and Actions */}
                        <div className="kanban-card-footer">
                          {config.next ? (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(app.id, config.next)}
                              className="btn-xs btn-advance-stage"
                              title={`Advance to ${config.next}`}
                            >
                              {config.nextLabel}
                            </button>
                          ) : (
                            <select
                              value={app.status}
                              onChange={(e) => handleUpdateStatus(app.id, e.target.value)}
                              className="status-dropdown-sm"
                            >
                              {STAGES.map((st) => (
                                <option key={st} value={st}>
                                  {st}
                                </option>
                              ))}
                            </select>
                          )}

                          <div className="k-btn-group">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(app)}
                              className="btn-xs btn-outline"
                              title="Edit Details"
                            >
                              ✏️
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(app.id)}
                              className="btn-xs btn-danger"
                              title="Delete"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {columnApps.length === 0 && (
                    <div className="empty-col-dropzone">
                      <small>No applications in {stage}</small>
                      {stage === "Applied" && (
                        <button
                          type="button"
                          onClick={handleOpenAdd}
                          className="btn-link-empty"
                        >
                          + Add First Application
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 📊 VIEW 2: TABLE LIST */}
      {!loading && viewMode === "table" && (
        <div className="panel-box table-container">
          <table className="styled-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Role</th>
                <th>Location</th>
                <th>Stipend</th>
                <th>Match</th>
                <th>Stage</th>
                <th>Applied Date</th>
                <th>Interview / Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.map((app) => {
                const avatar = getCompanyAvatar(app.company);
                const config = STAGE_CONFIG[app.status] || STAGE_CONFIG.Applied;
                return (
                  <tr key={app.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                          className="company-avatar-circle"
                          style={{
                            background: avatar.gradient,
                            width: "32px",
                            height: "32px",
                            fontSize: "12px"
                          }}
                        >
                          {avatar.initials}
                        </div>
                        <strong>{app.company}</strong>
                      </div>
                    </td>
                    <td>{app.role}</td>
                    <td>{app.location}</td>
                    <td>{app.stipend}</td>
                    <td>
                      {app.match_score ? (
                        <span className="match-tag-sm">{app.match_score}%</span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>
                      <span
                        className="status-pill-table"
                        style={{
                          background: config.bg,
                          color: config.color,
                          border: `1px solid ${config.border}`
                        }}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td>{app.applied_date || "-"}</td>
                    <td>
                      <small>
                        {app.interview_date ? `📅 ${app.interview_date}` : app.notes || "-"}
                      </small>
                    </td>
                    <td>
                      <div className="actions-inline">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(app)}
                          className="btn-xs btn-outline"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(app.id)}
                          className="btn-xs btn-danger"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-dialog panel-box">
            <div className="panel-header-simple">
              <h4>{editingApp ? "✏️ Edit Application Details" : "➕ Track New Internship Application"}</h4>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="btn-close-modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveApp} className="styled-form" style={{ marginTop: "16px" }}>
              <div className="form-row-2">
                <div className="form-group">
                  <label>Company Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Google, Microsoft, OpenAI Labs"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Role Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Backend Developer Intern"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row-3">
                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Bengaluru / Remote"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Stipend</label>
                  <input
                    type="text"
                    placeholder="e.g. ₹40,000 / mo"
                    value={formData.stipend}
                    onChange={(e) => setFormData({ ...formData, stipend: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Pipeline Stage</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="styled-select"
                  >
                    {STAGES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Applied Date</label>
                  <input
                    type="date"
                    value={formData.applied_date}
                    onChange={(e) => setFormData({ ...formData, applied_date: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Interview Date / Milestone</label>
                  <input
                    type="text"
                    placeholder="e.g. Thursday, 2:30 PM (System Design)"
                    value={formData.interview_date}
                    onChange={(e) => setFormData({ ...formData, interview_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Notes & Key Preparation Points</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Passed coding test with 100%. Next round focuses on FastAPI & PostgreSQL..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div className="modal-actions-footer">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingApp ? "Save Changes" : "Save Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating On-Screen Notification */}
      {statusMsg && (
        <div className="floating-apply-toast">
          <div className="toast-icon-wrap">📋</div>
          <div className="toast-body">
            <h5 className="toast-title">Application Pipeline</h5>
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
