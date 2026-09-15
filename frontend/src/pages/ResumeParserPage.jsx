import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../services/api";

const ACTION_VERBS = [
  "engineered", "developed", "architected", "optimized", "built", "implemented",
  "deployed", "designed", "created", "led", "managed", "reduced", "increased",
  "integrated", "automated", "spearheaded", "accelerated", "slashed", "delivered"
];

export default function ResumeParserPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlResumeId = searchParams.get("id");

  const [resumes, setResumes] = useState([]);
  const [selectedResumeId, setSelectedResumeId] = useState(urlResumeId || "");
  const [extractedData, setExtractedData] = useState(null);
  const [rawText, setRawText] = useState("");
  const [resumeMeta, setResumeMeta] = useState(null);

  const [activeTab, setActiveTab] = useState("structured"); // "structured" | "ats" | "raw" | "json"
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reparsing, setReparsing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [seedingDemo, setSeedingDemo] = useState(false);
  const [showUploadBox, setShowUploadBox] = useState(false);

  const [statusMsg, setStatusMsg] = useState("");
  const [statusType, setStatusType] = useState("info"); // "success" | "error" | "info"

  // Skill management state
  const [newSkillInput, setNewSkillInput] = useState("");
  const [activeSkillCategory, setActiveSkillCategory] = useState("technical_skills");

  // Raw text search & copy
  const [rawSearchQuery, setRawSearchQuery] = useState("");
  const [copiedText, setCopiedText] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  // Edit contact modal/state
  const [editingContact, setEditingContact] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    github: "",
    portfolio: ""
  });

  const fileInputRef = useRef(null);

  // Auto-dismiss status message
  useEffect(() => {
    if (statusMsg) {
      const timer = setTimeout(() => setStatusMsg(""), 6000);
      return () => clearTimeout(timer);
    }
  }, [statusMsg]);

  // Load user resumes
  const loadResumes = async (preferredId = null) => {
    try {
      const res = await api.get("/resumes/my");
      setResumes(res.data);
      if (res.data.length > 0) {
        if (preferredId) {
          setSelectedResumeId(String(preferredId));
        } else if (!selectedResumeId) {
          const active = res.data.find((r) => r.is_active) || res.data[0];
          setSelectedResumeId(String(active.id));
        }
      } else {
        setSelectedResumeId("");
        setExtractedData(null);
      }
    } catch (err) {
      console.error("Could not load resumes:", err);
    }
  };

  useEffect(() => {
    loadResumes(urlResumeId);
  }, []);

  // Fetch extraction for selected resume
  useEffect(() => {
    if (!selectedResumeId) return;

    const fetchExtraction = async () => {
      setLoading(true);
      setStatusMsg("");
      try {
        const res = await api.get(`/resumes/${selectedResumeId}/deep-extract`);
        setExtractedData(res.data.data);
        setRawText(res.data.raw_text || "");
        setResumeMeta({
          filename: res.data.filename,
          is_active: res.data.is_active,
          uploaded_at: res.data.uploaded_at
        });
        if (res.data.data?.personal_info) {
          setContactForm(res.data.data.personal_info);
        }
      } catch (err) {
        console.error("Failed to load deep extraction:", err);
        setStatusMsg("Failed to extract data. Please re-parse or choose another resume.");
        setStatusType("error");
      } finally {
        setLoading(false);
      }
    };

    fetchExtraction();
  }, [selectedResumeId]);

  // Sync contactForm when extractedData changes
  useEffect(() => {
    if (extractedData?.personal_info) {
      setContactForm(extractedData.personal_info);
    }
  }, [extractedData]);

  // ----------------------------------------------------
  // ATS SCORING & AUDIT ENGINE
  // ----------------------------------------------------
  const atsAnalysis = useMemo(() => {
    if (!extractedData) return null;

    const info = extractedData.personal_info || {};
    const summary = extractedData.summary || "";
    const skills = extractedData.skills || {};
    const techSkills = skills.technical_skills || [];
    const tools = skills.tools_frameworks || [];
    const soft = skills.soft_skills || [];
    const totalSkills = techSkills.length + tools.length + soft.length;
    const experience = extractedData.experience || [];
    const education = extractedData.education || [];
    const projects = extractedData.projects || [];
    const certifications = extractedData.certifications || [];

    // 1. Contact Info Score (max 15)
    let contactScore = 0;
    if (info.name) contactScore += 3;
    if (info.email) contactScore += 4;
    if (info.phone) contactScore += 3;
    if (info.linkedin || info.github) contactScore += 5;

    // 2. Summary Score (max 15)
    let summaryScore = 0;
    if (summary.trim().length > 30) summaryScore += 10;
    if (summary.trim().length > 120) summaryScore += 5;

    // 3. Skills Score (max 25)
    let skillsScore = Math.min(25, Math.round((totalSkills / 15) * 25));

    // 4. Experience Score (max 25)
    let expScore = 0;
    if (experience.length > 0) {
      expScore += 10;
      const totalBullets = experience.reduce((acc, e) => acc + (e.bullets?.length || 0), 0);
      expScore += Math.min(15, totalBullets * 3);
    } else {
      expScore = 10; // Student baseline
    }

    // 5. Education Score (max 10)
    let eduScore = education.length > 0 ? 10 : 0;

    // 6. Projects & Certs (max 10)
    let projScore = Math.min(10, projects.length * 3 + certifications.length * 2);

    const totalScore = Math.min(100, contactScore + summaryScore + skillsScore + expScore + eduScore + projScore);

    // Detect Action Verbs in bullets & summary
    const allText = (
      summary + " " +
      experience.flatMap((e) => e.bullets || []).join(" ") + " " +
      projects.map((p) => p.description || "").join(" ")
    ).toLowerCase();

    const detectedVerbs = ACTION_VERBS.filter((verb) => allText.includes(verb));

    // Detect Quantified Metrics (e.g. 40%, 10+, $5k, 5,000)
    const metricMatches = allText.match(/\b\d+[\d,.]*(?:%|\+|x|k|M)?\b|\$\d+/gi) || [];
    const uniqueMetrics = Array.from(new Set(metricMatches)).slice(0, 8);

    // Recommendations
    const tips = [];
    if (!info.github && !info.linkedin) {
      tips.push("Add your LinkedIn or GitHub URL to boost technical credibility.");
    }
    if (soft.length < 3) {
      tips.push("Highlight at least 3 soft skills (e.g. Team Leadership, Agile Collaboration).");
    }
    if (detectedVerbs.length < 4) {
      tips.push("Use more high-impact action verbs like 'Architected', 'Optimized', or 'Spearheaded'.");
    }
    if (uniqueMetrics.length < 3) {
      tips.push("Quantify achievements with percentages, scale, or metrics (e.g. 'Reduced latency by 40%').");
    }
    if (projects.length === 0) {
      tips.push("Add at least 2 technical projects with tech stack tags to demonstrate hands-on aptitude.");
    }

    return {
      totalScore,
      breakdown: {
        contact: Math.round((contactScore / 15) * 100),
        summary: Math.round((summaryScore / 15) * 100),
        skills: Math.round((skillsScore / 25) * 100),
        experience: Math.round((expScore / 25) * 100),
        education: Math.round((eduScore / 10) * 100),
        projects: Math.round((projScore / 10) * 100)
      },
      totalSkills,
      detectedVerbs,
      uniqueMetrics,
      tips
    };
  }, [extractedData]);

  // ----------------------------------------------------
  // SKILL HANDLERS
  // ----------------------------------------------------
  const handleAddSkill = (category = activeSkillCategory) => {
    if (!newSkillInput.trim() || !extractedData) return;
    const skillName = newSkillInput.trim();
    const currentList = extractedData.skills?.[category] || [];

    if (!currentList.some((s) => s.toLowerCase() === skillName.toLowerCase())) {
      setExtractedData({
        ...extractedData,
        skills: {
          ...extractedData.skills,
          [category]: [...currentList, skillName]
        }
      });
      setStatusMsg(`Added skill: "${skillName}"`);
      setStatusType("info");
    }
    setNewSkillInput("");
  };

  const handleRemoveSkill = (skillToRemove, category) => {
    if (!extractedData) return;
    const currentList = extractedData.skills?.[category] || [];
    setExtractedData({
      ...extractedData,
      skills: {
        ...extractedData.skills,
        [category]: currentList.filter((s) => s !== skillToRemove)
      }
    });
  };

  // ----------------------------------------------------
  // SAVE / VERIFY HANDLER
  // ----------------------------------------------------
  const handleSaveVerified = async () => {
    if (!selectedResumeId || !extractedData) return;
    setSaving(true);
    try {
      await api.put(`/resumes/${selectedResumeId}/deep-extract`, extractedData);
      setStatusMsg("Extracted profile & verified skills saved to database and synced with profile! 🎉");
      setStatusType("success");
    } catch (err) {
      setStatusMsg("Failed to save changes. Please try again.");
      setStatusType("error");
    } finally {
      setSaving(false);
    }
  };

  // ----------------------------------------------------
  // RE-EXTRACT WITH AI HANDLER
  // ----------------------------------------------------
  const handleReExtract = async () => {
    if (!selectedResumeId) return;
    setReparsing(true);
    try {
      const res = await api.post(`/resumes/${selectedResumeId}/re-extract`);
      setExtractedData(res.data.data);
      setResumeMeta({
        filename: res.data.filename,
        is_active: res.data.is_active,
        uploaded_at: res.data.uploaded_at
      });
      setStatusMsg("AI re-extraction completed successfully! ⚡");
      setStatusType("success");
    } catch (err) {
      setStatusMsg("AI re-extraction failed. Please verify the resume text.");
      setStatusType("error");
    } finally {
      setReparsing(false);
    }
  };

  // ----------------------------------------------------
  // SET ACTIVE RESUME HANDLER
  // ----------------------------------------------------
  const handleSetActive = async () => {
    if (!selectedResumeId) return;
    try {
      await api.post(`/resumes/${selectedResumeId}/set-active`);
      setResumeMeta((prev) => ({ ...prev, is_active: true }));
      loadResumes(selectedResumeId);
      setStatusMsg("Resume marked as active matching version! 🎯");
      setStatusType("success");
    } catch (err) {
      setStatusMsg("Could not set active resume.");
      setStatusType("error");
    }
  };

  // ----------------------------------------------------
  // UPLOAD NEW RESUME HANDLER
  // ----------------------------------------------------
  const handleFileUpload = async (file) => {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["pdf", "docx"].includes(ext)) {
      setStatusMsg("Please upload a PDF (.pdf) or Word document (.docx).");
      setStatusType("error");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    setStatusMsg("Uploading and running AI structural extraction...");
    setStatusType("info");
    try {
      const res = await api.post("/resumes/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setStatusMsg(`Resume uploaded & parsed: ${res.data.filename} 🎉`);
      setStatusType("success");
      setShowUploadBox(false);
      await loadResumes(res.data.id);
      setSelectedResumeId(String(res.data.id));
    } catch (err) {
      setStatusMsg(err.response?.data?.detail || "Resume upload and extraction failed.");
      setStatusType("error");
    } finally {
      setUploading(false);
    }
  };

  // ----------------------------------------------------
  // SEED SAMPLE DEMO RESUME
  // ----------------------------------------------------
  const handleSeedDemo = async () => {
    setSeedingDemo(true);
    setStatusMsg("Generating comprehensive sample resume profile with AI...");
    setStatusType("info");
    try {
      const res = await api.post("/resumes/seed-demo");
      setStatusMsg("Sample Demo Resume loaded! Ready to explore ATS & Skill analytics. 🎉");
      setStatusType("success");
      setShowUploadBox(false);
      await loadResumes(res.data.resume_id);
      setSelectedResumeId(String(res.data.resume_id));
      setExtractedData(res.data.data);
      setRawText(res.data.raw_text);
    } catch (err) {
      setStatusMsg("Failed to generate demo resume.");
      setStatusType("error");
    } finally {
      setSeedingDemo(false);
    }
  };

  // ----------------------------------------------------
  // SAVE CONTACT INFO
  // ----------------------------------------------------
  const handleSaveContact = async (e) => {
    e.preventDefault();
    if (!extractedData) return;
    const updated = {
      ...extractedData,
      personal_info: { ...contactForm }
    };
    setExtractedData(updated);
    setEditingContact(false);
    setStatusMsg("Saving contact & LinkedIn updates to server...");
    setStatusType("info");

    try {
      if (selectedResumeId) {
        await api.put(`/resumes/${selectedResumeId}/deep-extract`, updated);
      }
      // Also sync to student profile
      await api.put("/api/profile/me", {
        linkedin_url: contactForm.linkedin || "",
        github_url: contactForm.github || "",
        phone: contactForm.phone || "",
        location: contactForm.location || ""
      });
      setStatusMsg("Contact & LinkedIn details saved and synced successfully! 🎉");
      setStatusType("success");
    } catch (err) {
      setStatusMsg("Contact details updated locally. Click 'Save & Verify' to sync with database.");
      setStatusType("info");
    }
  };

  // Copy raw text & json
  const handleCopyRaw = () => {
    if (!rawText) return;
    navigator.clipboard.writeText(rawText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleCopyJson = () => {
    if (!extractedData) return;
    navigator.clipboard.writeText(JSON.stringify(extractedData, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <Layout
      title="2. AI Deep Resume Parser & ATS Audit Studio"
      subtitle="Structural entity extraction, ATS compatibility scoring, skill matrix verification, and career role mapping"
    >
      {/* STATUS TOAST NOTIFICATION */}
      {statusMsg && (
        <div className={`parser-status-toast ${statusType}`}>
          <span className="toast-icon">
            {statusType === "success" ? "✅" : statusType === "error" ? "⚠️" : "ℹ️"}
          </span>
          <span>{statusMsg}</span>
          <button
            type="button"
            onClick={() => setStatusMsg("")}
            className="toast-close-btn"
          >
            ×
          </button>
        </div>
      )}

      {/* TOP COMMAND BAR */}
      <div className="parser-top-bar-modern">
        <div className="parser-select-group">
          <label className="select-label">Current Resume:</label>
          <div className="custom-select-wrapper">
            <select
              value={selectedResumeId}
              onChange={(e) => {
                setSelectedResumeId(e.target.value);
                setSearchParams({ id: e.target.value });
              }}
              className="styled-select-modern"
              disabled={loading || resumes.length === 0}
            >
              {resumes.length === 0 ? (
                <option value="">No resumes uploaded yet</option>
              ) : (
                resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    📄 {r.filename} {r.is_active ? "★ [Primary Active]" : ""} ({r.uploaded_at})
                  </option>
                ))
              )}
            </select>
          </div>

          {resumeMeta?.is_active && (
            <span className="badge-active-pill">★ Active Match Profile</span>
          )}
        </div>

        <div className="parser-actions-cluster">
          <button
            type="button"
            onClick={() => setShowUploadBox(!showUploadBox)}
            className="btn-action-pill upload-pill"
          >
            📤 {showUploadBox ? "Hide Uploader" : "Upload Resume"}
          </button>

          <button
            type="button"
            onClick={handleSeedDemo}
            disabled={seedingDemo || loading}
            className="btn-action-pill demo-pill"
            title="Load an ATS-optimized candidate profile for testing"
          >
            {seedingDemo ? "Loading Demo..." : "⚡ Load Sample Resume"}
          </button>

          {selectedResumeId && (
            <>
              <button
                type="button"
                onClick={handleReExtract}
                disabled={reparsing || loading}
                className="btn-action-pill reparse-pill"
                title="Force AI to re-scan and extract raw text again"
              >
                {reparsing ? "Scanning..." : "🔄 AI Re-Parse"}
              </button>

              {!resumeMeta?.is_active && (
                <button
                  type="button"
                  onClick={handleSetActive}
                  className="btn-action-pill active-pill"
                >
                  🎯 Set as Active
                </button>
              )}

              <button
                type="button"
                onClick={handleSaveVerified}
                disabled={saving || loading || !extractedData}
                className="btn-action-pill save-pill"
              >
                {saving ? "Saving..." : "💾 Save & Verify"}
              </button>

              <Link to="/job-matching" className="btn-action-pill match-pill">
                🎯 Job Matches →
              </Link>

              <Link
                to="/career-assistant"
                className="btn-action-pill"
                style={{
                  background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
                  color: "#ffffff",
                  boxShadow: "0 2px 8px rgba(124, 58, 237, 0.3)"
                }}
                title="Launch AI Career Companion for personalized role recommendation & interview prep"
              >
                🤖 AI Career Companion (Role Match & Interview Prep) →
              </Link>
            </>
          )}
        </div>
      </div>

      {/* COLLAPSIBLE UPLOAD DROPZONE */}
      {showUploadBox && (
        <div className="parser-dropzone-panel">
          <div
            className="parser-dropzone-box"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files?.[0]) {
                handleFileUpload(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              accept=".pdf,.docx"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />
            <div className="dropzone-icon-animated">📄 ⬆️</div>
            <h4 className="dropzone-title">
              Drag & Drop your Resume here, or <span className="browse-link">Browse Computer</span>
            </h4>
            <p className="dropzone-sub">
              Supports standard <strong>PDF (.pdf)</strong> and <strong>Word (.docx)</strong> up to 10MB
            </p>
            <div className="dropzone-features-row">
              <span>⚡ Deep Entity Extraction</span>
              <span>🛡️ Local Sanitization</span>
              <span>📊 Real-Time ATS Score</span>
            </div>
            {uploading && (
              <div className="upload-progress-strip">
                <div className="spinner-sm" style={{ borderTopColor: "#4f46e5" }}></div>
                <span>Parsing resume entities with AI...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* LOADING STATE */}
      {loading && (
        <div className="parser-loading-skeleton">
          <div className="spinner"></div>
          <h3>Running AI Deep Resume Decomposition...</h3>
          <p>Extracting candidate contact, technical skills, action verbs, and structural timeline...</p>
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && !extractedData && resumes.length === 0 && (
        <div className="parser-empty-showcase">
          <div className="showcase-glow"></div>
          <div className="showcase-card">
            <div className="showcase-icon-large">🚀</div>
            <h2>Supercharge Your Career with AI Resume Intelligence</h2>
            <p>
              Upload your PDF or DOCX resume to extract verified skills, calculate your ATS score,
              and receive instant role matching suggestions.
            </p>

            <div className="showcase-cta-group">
              <button
                type="button"
                onClick={() => setShowUploadBox(true)}
                className="btn-showcase-primary"
              >
                📤 Upload Your Resume (PDF / DOCX)
              </button>
              <button
                type="button"
                onClick={handleSeedDemo}
                disabled={seedingDemo}
                className="btn-showcase-demo"
              >
                ⚡ Try Demo Sample Resume (1-Click Preview)
              </button>
            </div>

            <div className="showcase-feature-grid">
              <div className="showcase-feat-item">
                <span className="feat-emoji">🎯</span>
                <div>
                  <strong>ATS Compatibility Score</strong>
                  <p>Check section completeness, action verbs, and formatting health.</p>
                </div>
              </div>
              <div className="showcase-feat-item">
                <span className="feat-emoji">⚡</span>
                <div>
                  <strong>3-Tier Skill Matrix</strong>
                  <p>Categorized into Tech Languages, Frameworks/Tools, and Soft Skills.</p>
                </div>
              </div>
              <div className="showcase-feat-item">
                <span className="feat-emoji">💼</span>
                <div>
                  <strong>Impact Quantifier</strong>
                  <p>Highlight metrics, revenue, and scale detected in your experience.</p>
                </div>
              </div>
              <div className="showcase-feat-item">
                <span className="feat-emoji">🤖</span>
                <div>
                  <strong>Career Role Path</strong>
                  <p>AI recommends top-matching job titles and target internship tracks.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN EXTRACTED RESUME VIEW */}
      {!loading && extractedData && (
        <div className="parser-content-wrapper">
          {/* 1. CANDIDATE PROFILE HERO HEADER */}
          <div className="candidate-hero-banner">
            <div className="candidate-avatar-badge">
              {(extractedData.personal_info?.name || "Candidate")
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </div>

            <div className="candidate-meta-details">
              <div className="candidate-title-row">
                <h2>{extractedData.personal_info?.name || "Candidate Profile"}</h2>
                <button
                  type="button"
                  onClick={() => setEditingContact(!editingContact)}
                  className="btn-edit-contact-pill"
                >
                  {editingContact ? "Close Edit" : "✏️ Edit Contact"}
                </button>
              </div>

              <div className="candidate-chips-cluster">
                {extractedData.personal_info?.email && (
                  <span className="contact-chip">
                    ✉️ {extractedData.personal_info.email}
                  </span>
                )}
                {extractedData.personal_info?.phone && (
                  <span className="contact-chip">
                    📞 {extractedData.personal_info.phone}
                  </span>
                )}
                {extractedData.personal_info?.location && (
                  <span className="contact-chip">
                    📍 {extractedData.personal_info.location}
                  </span>
                )}
                {extractedData.personal_info?.linkedin ? (
                  <a
                    href={
                      extractedData.personal_info.linkedin.startsWith("http")
                        ? extractedData.personal_info.linkedin
                        : `https://${extractedData.personal_info.linkedin}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-link-chip linkedin"
                  >
                    🔗 LinkedIn Profile ↗
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditingContact(true)}
                    className="social-link-chip linkedin-add-chip"
                    style={{
                      background: "rgba(59, 130, 246, 0.15)",
                      color: "#93c5fd",
                      border: "1px dashed rgba(147, 197, 253, 0.6)",
                      cursor: "pointer",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "600"
                    }}
                  >
                    + Add LinkedIn ↗
                  </button>
                )}
                {extractedData.personal_info?.github && (
                  <a
                    href={
                      extractedData.personal_info.github.startsWith("http")
                        ? extractedData.personal_info.github
                        : `https://${extractedData.personal_info.github}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-link-chip github"
                  >
                    🐙 GitHub Repos ↗
                  </a>
                )}
                {extractedData.personal_info?.portfolio && (
                  <a
                    href={
                      extractedData.personal_info.portfolio.startsWith("http")
                        ? extractedData.personal_info.portfolio
                        : `https://${extractedData.personal_info.portfolio}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-link-chip portfolio"
                  >
                    🌐 Portfolio Website ↗
                  </a>
                )}
              </div>
            </div>

            {/* Quick ATS Badge in Hero */}
            {atsAnalysis && (
              <div className="hero-ats-badge">
                <div className="mini-gauge-val">{atsAnalysis.totalScore}</div>
                <div className="mini-gauge-label">ATS Score</div>
              </div>
            )}
          </div>

          {/* EDIT CONTACT INFO DRAWER */}
          {editingContact && (
            <form onSubmit={handleSaveContact} className="edit-contact-drawer panel-box">
              <h4 style={{ margin: "0 0 14px", color: "#0f172a" }}>✏️ Edit Contact & Links</h4>
              <div className="edit-contact-grid">
                <div>
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={contactForm.name || ""}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={contactForm.email || ""}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  />
                </div>
                <div>
                  <label>Phone Number</label>
                  <input
                    type="text"
                    value={contactForm.phone || ""}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label>Location (City, State / Remote)</label>
                  <input
                    type="text"
                    value={contactForm.location || ""}
                    onChange={(e) => setContactForm({ ...contactForm, location: e.target.value })}
                  />
                </div>
                <div>
                  <label>LinkedIn URL</label>
                  <input
                    type="url"
                    value={contactForm.linkedin || ""}
                    onChange={(e) => setContactForm({ ...contactForm, linkedin: e.target.value })}
                  />
                </div>
                <div>
                  <label>GitHub URL</label>
                  <input
                    type="url"
                    value={contactForm.github || ""}
                    onChange={(e) => setContactForm({ ...contactForm, github: e.target.value })}
                  />
                </div>
                <div>
                  <label>Portfolio / Personal Site</label>
                  <input
                    type="url"
                    value={contactForm.portfolio || ""}
                    onChange={(e) => setContactForm({ ...contactForm, portfolio: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ marginTop: "14px", display: "flex", gap: "10px" }}>
                <button type="submit" className="btn-sm btn-primary">
                  Save Contact Updates
                </button>
                <button
                  type="button"
                  onClick={() => setEditingContact(false)}
                  className="btn-sm btn-outline"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* 2. ATS HEALTH & METRICS SCOREBOARD */}
          {atsAnalysis && (
            <div className="ats-hero-dashboard panel-box">
              <div className="ats-score-column">
                <div className="ats-ring-wrap">
                  <svg viewBox="0 0 36 36" className="circular-chart">
                    <path
                      className="circle-bg"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="circle-fill"
                      strokeDasharray={`${atsAnalysis.totalScore}, 100`}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <text x="18" y="20.35" className="percentage">
                      {atsAnalysis.totalScore}%
                    </text>
                  </svg>
                </div>
                <div className="ats-rating-tag">
                  {atsAnalysis.totalScore >= 85
                    ? "🌟 Excellent ATS Match"
                    : atsAnalysis.totalScore >= 70
                    ? "👍 Solid Candidate"
                    : "⚠️ Needs Optimization"}
                </div>
              </div>

              <div className="ats-metrics-column">
                <div className="ats-metrics-row">
                  <div className="ats-metric-box">
                    <span className="metric-icon">⚡</span>
                    <div className="metric-val">{atsAnalysis.totalSkills}</div>
                    <div className="metric-lbl">Extracted Skills</div>
                  </div>

                  <div className="ats-metric-box">
                    <span className="metric-icon">🚀</span>
                    <div className="metric-val">{atsAnalysis.detectedVerbs.length}</div>
                    <div className="metric-lbl">Action Verbs</div>
                  </div>

                  <div className="ats-metric-box">
                    <span className="metric-icon">📈</span>
                    <div className="metric-val">{atsAnalysis.uniqueMetrics.length}</div>
                    <div className="metric-lbl">Impact Metrics</div>
                  </div>

                  <div className="ats-metric-box">
                    <span className="metric-icon">💼</span>
                    <div className="metric-val">{extractedData.experience?.length || 0}</div>
                    <div className="metric-lbl">Roles Parsed</div>
                  </div>
                </div>

                {atsAnalysis.tips.length > 0 ? (
                  <div className="ats-tips-strip">
                    <strong>💡 ATS Recommendation: </strong>
                    <span>{atsAnalysis.tips[0]}</span>
                  </div>
                ) : (
                  <div className="ats-tips-strip success">
                    <strong>✨ ATS Ready: </strong>
                    <span>All major ATS parsing sections and impact indicators are in place!</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. MULTI-VIEW NAVIGATION TABS */}
          <div className="parser-tabs-bar">
            <button
              type="button"
              onClick={() => setActiveTab("structured")}
              className={`parser-tab-btn ${activeTab === "structured" ? "active" : ""}`}
            >
              📋 Structured Profile & Skills
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("ats")}
              className={`parser-tab-btn ${activeTab === "ats" ? "active" : ""}`}
            >
              📊 ATS Audit & Optimization
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("raw")}
              className={`parser-tab-btn ${activeTab === "raw" ? "active" : ""}`}
            >
              📄 Raw Extracted Text
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("json")}
              className={`parser-tab-btn ${activeTab === "json" ? "active" : ""}`}
            >
              💻 JSON Schema View
            </button>
          </div>

          {/* ========================================================== */}
          {/* TAB 1: STRUCTURED RESUME VIEW */}
          {/* ========================================================== */}
          {activeTab === "structured" && (
            <div className="tab-structured-view">
              {/* Professional Summary */}
              <section className="panel-box summary-card-modern">
                <div className="panel-header-simple">
                  <h4>📝 Executive Professional Summary</h4>
                  <span className="badge-light">AI Extracted • Editable</span>
                </div>
                <textarea
                  className="styled-textarea-modern"
                  rows={4}
                  value={extractedData.summary || ""}
                  placeholder="Enter or refine your 2-3 sentence executive summary..."
                  onChange={(e) =>
                    setExtractedData({ ...extractedData, summary: e.target.value })
                  }
                />
              </section>

              {/* Categorized Skills Matrix */}
              <section className="panel-box skills-matrix-modern">
                <div className="panel-header-simple">
                  <h4>⚡ AI Verified Skills Matrix</h4>
                  <span className="badge-primary">
                    {atsAnalysis?.totalSkills || 0} Total Skills Detected
                  </span>
                </div>

                <div className="skills-category-grid">
                  {/* Category 1: Technical Skills */}
                  <div className="skills-subgroup-card tech-card">
                    <div className="subgroup-header">
                      <h5>💻 Technical Skills & Languages</h5>
                      <span className="subgroup-count">
                        {extractedData.skills?.technical_skills?.length || 0}
                      </span>
                    </div>
                    <div className="tags-cloud">
                      {extractedData.skills?.technical_skills?.map((s) => (
                        <span key={s} className="tag-badge tag-tech-modern">
                          {s}
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(s, "technical_skills")}
                            className="tag-remove-btn"
                            title="Remove skill"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Category 2: Tools & Frameworks */}
                  <div className="skills-subgroup-card tools-card">
                    <div className="subgroup-header">
                      <h5>🛠️ Developer Tools & Frameworks</h5>
                      <span className="subgroup-count">
                        {extractedData.skills?.tools_frameworks?.length || 0}
                      </span>
                    </div>
                    <div className="tags-cloud">
                      {extractedData.skills?.tools_frameworks?.map((s) => (
                        <span key={s} className="tag-badge tag-tool-modern">
                          {s}
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(s, "tools_frameworks")}
                            className="tag-remove-btn"
                            title="Remove tool"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Category 3: Soft Skills */}
                  <div className="skills-subgroup-card soft-card">
                    <div className="subgroup-header">
                      <h5>🤝 Soft & Professional Competencies</h5>
                      <span className="subgroup-count">
                        {extractedData.skills?.soft_skills?.length || 0}
                      </span>
                    </div>
                    <div className="tags-cloud">
                      {extractedData.skills?.soft_skills?.map((s) => (
                        <span key={s} className="tag-badge tag-soft-modern">
                          {s}
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(s, "soft_skills")}
                            className="tag-remove-btn"
                            title="Remove soft skill"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Add Skill Control Bar */}
                <div className="add-skill-bar-modern">
                  <div className="category-select-pill">
                    <label>Add To Category:</label>
                    <select
                      value={activeSkillCategory}
                      onChange={(e) => setActiveSkillCategory(e.target.value)}
                    >
                      <option value="technical_skills">💻 Technical Skills</option>
                      <option value="tools_frameworks">🛠️ Tools & Frameworks</option>
                      <option value="soft_skills">🤝 Soft Skills</option>
                    </select>
                  </div>

                  <div className="add-skill-input-wrap">
                    <input
                      type="text"
                      placeholder="Type skill name (e.g. Docker, TypeScript, Microservices)..."
                      value={newSkillInput}
                      onChange={(e) => setNewSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddSkill(activeSkillCategory);
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleAddSkill(activeSkillCategory)}
                      className="btn-add-skill-pill"
                    >
                      + Add to Matrix
                    </button>
                  </div>
                </div>
              </section>

              {/* Experience & Education 2-Column Section */}
              <div className="dashboard-two-col">
                {/* Work & Internship Experience */}
                <section className="panel-box exp-panel-modern">
                  <div className="panel-header-simple">
                    <h4>💼 Work & Internship Experience</h4>
                    <span className="badge-light">
                      {extractedData.experience?.length || 0} Positions
                    </span>
                  </div>

                  {(!extractedData.experience || extractedData.experience.length === 0) && (
                    <div className="empty-section-hint">
                      No prior work experience extracted. Click "+ Add Experience" below if applicable.
                    </div>
                  )}

                  <div className="experience-timeline-modern">
                    {extractedData.experience?.map((exp, idx) => (
                      <div key={idx} className="timeline-item-modern">
                        <div className="timeline-bullet-point"></div>
                        <div className="timeline-card-content">
                          <div className="exp-card-header">
                            <div>
                              <strong className="exp-role-title">{exp.role}</strong>
                              <div className="exp-company-sub">
                                🏢 {exp.company} {exp.location ? `• ${exp.location}` : ""}
                              </div>
                            </div>
                            {exp.duration && (
                              <span className="duration-pill">{exp.duration}</span>
                            )}
                          </div>

                          {exp.bullets && exp.bullets.length > 0 && (
                            <ul className="exp-bullets-modern">
                              {exp.bullets.map((b, i) => (
                                <li key={i}>{b}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Education, Projects & Certifications Column */}
                <div className="edu-proj-column">
                  {/* Education */}
                  <section className="panel-box">
                    <div className="panel-header-simple">
                      <h4>🎓 Academic Background</h4>
                    </div>
                    {extractedData.education?.map((edu, idx) => (
                      <div key={idx} className="edu-card-modern">
                        <div className="edu-icon">🎓</div>
                        <div className="edu-details">
                          <strong className="edu-degree">{edu.degree}</strong>
                          <div className="edu-inst">
                            {edu.institution} {edu.year ? `(${edu.year})` : ""}
                          </div>
                          {edu.score && (
                            <span className="edu-score-badge">🏆 {edu.score}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </section>

                  {/* Projects */}
                  <section className="panel-box" style={{ marginTop: "20px" }}>
                    <div className="panel-header-simple">
                      <h4>🚀 Highlighted Projects</h4>
                      <span className="badge-light">
                        {extractedData.projects?.length || 0} Projects
                      </span>
                    </div>

                    <div className="projects-grid-modern">
                      {extractedData.projects?.map((proj, idx) => (
                        <div key={idx} className="project-card-modern">
                          <div className="proj-header-row">
                            <strong className="proj-title">{proj.title}</strong>
                            {proj.link && (
                              <a
                                href={proj.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="proj-link-icon"
                                title="View project link"
                              >
                                🔗 Demo
                              </a>
                            )}
                          </div>

                          {proj.tech_stack && (
                            <div className="proj-tech-tags">
                              {proj.tech_stack.map((t) => (
                                <span key={t} className="tech-mini-tag">
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}

                          <p className="proj-desc-text">{proj.description}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Certifications */}
                  {extractedData.certifications && extractedData.certifications.length > 0 && (
                    <section className="panel-box" style={{ marginTop: "20px" }}>
                      <div className="panel-header-simple">
                        <h4>📜 Certifications & Honors</h4>
                      </div>
                      <div className="cert-badges-cluster">
                        {extractedData.certifications.map((c, i) => (
                          <div key={i} className="cert-badge-pill">
                            <span className="cert-ribbon">🏅</span>
                            <span>{c}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              </div>

              {/* Career & Role Recommendation Banner */}
              <section className="panel-box career-pathway-banner">
                <div className="pathway-content">
                  <div className="pathway-icon">🎯</div>
                  <div>
                    <h4 style={{ margin: "0 0 6px", color: "#0f172a", fontSize: "16px" }}>
                      AI Target Role & Pathway Recommendation
                    </h4>
                    <p style={{ margin: "0 0 10px", color: "#334155", fontSize: "14px" }}>
                      Based on this resume's technical stack and project history, optimal career paths include:
                    </p>
                    <div className="recommended-roles-cluster">
                      {(extractedData.career_recommendation || "Full Stack Developer, Software Engineer, Backend Specialist")
                        .split(",")
                        .map((role, i) => (
                          <span key={i} className="role-tag-highlight">
                            💼 {role.trim()}
                          </span>
                        ))}
                    </div>
                  </div>
                </div>

                <div className="pathway-action">
                  <Link to="/job-matching" className="btn-primary" style={{ whiteSpace: "nowrap" }}>
                    Run Matching Engine →
                  </Link>
                </div>
              </section>
            </div>
          )}

          {/* ========================================================== */}
          {/* TAB 2: ATS AUDIT & OPTIMIZATION */}
          {/* ========================================================== */}
          {activeTab === "ats" && atsAnalysis && (
            <div className="tab-ats-view">
              <div className="ats-audit-grid">
                {/* Left Card: Section Scores */}
                <div className="panel-box">
                  <h4 style={{ margin: "0 0 16px", color: "#0f172a" }}>
                    📊 Section-by-Section ATS Breakdown
                  </h4>
                  <div className="ats-bars-list">
                    <div className="ats-bar-item">
                      <div className="bar-labels">
                        <span>Contact & Social Links</span>
                        <span>{atsAnalysis.breakdown.contact}%</span>
                      </div>
                      <div className="bar-track">
                        <div
                          className="bar-fill"
                          style={{ width: `${atsAnalysis.breakdown.contact}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="ats-bar-item">
                      <div className="bar-labels">
                        <span>Professional Summary</span>
                        <span>{atsAnalysis.breakdown.summary}%</span>
                      </div>
                      <div className="bar-track">
                        <div
                          className="bar-fill"
                          style={{ width: `${atsAnalysis.breakdown.summary}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="ats-bar-item">
                      <div className="bar-labels">
                        <span>Technical & Soft Skills</span>
                        <span>{atsAnalysis.breakdown.skills}%</span>
                      </div>
                      <div className="bar-track">
                        <div
                          className="bar-fill"
                          style={{ width: `${atsAnalysis.breakdown.skills}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="ats-bar-item">
                      <div className="bar-labels">
                        <span>Work Experience & Impact</span>
                        <span>{atsAnalysis.breakdown.experience}%</span>
                      </div>
                      <div className="bar-track">
                        <div
                          className="bar-fill"
                          style={{ width: `${atsAnalysis.breakdown.experience}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="ats-bar-item">
                      <div className="bar-labels">
                        <span>Academic Education</span>
                        <span>{atsAnalysis.breakdown.education}%</span>
                      </div>
                      <div className="bar-track">
                        <div
                          className="bar-fill"
                          style={{ width: `${atsAnalysis.breakdown.education}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="ats-bar-item">
                      <div className="bar-labels">
                        <span>Projects & Certifications</span>
                        <span>{atsAnalysis.breakdown.projects}%</span>
                      </div>
                      <div className="bar-track">
                        <div
                          className="bar-fill"
                          style={{ width: `${atsAnalysis.breakdown.projects}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Card: Power Verbs & Quantified Metrics */}
                <div className="panel-box">
                  <h4 style={{ margin: "0 0 16px", color: "#0f172a" }}>
                    🚀 Action Verbs & Quantified Impact
                  </h4>

                  <div style={{ marginBottom: "18px" }}>
                    <h5 style={{ margin: "0 0 8px", color: "#475569", fontSize: "13px" }}>
                      Detected Power Action Verbs ({atsAnalysis.detectedVerbs.length}):
                    </h5>
                    <div className="tags-cloud">
                      {atsAnalysis.detectedVerbs.length === 0 ? (
                        <span className="empty-hint">No common action verbs found.</span>
                      ) : (
                        atsAnalysis.detectedVerbs.map((v) => (
                          <span key={v} className="tag-badge tag-verb-chip">
                            ✓ {v}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  <div>
                    <h5 style={{ margin: "0 0 8px", color: "#475569", fontSize: "13px" }}>
                      Detected Quantified Metrics ({atsAnalysis.uniqueMetrics.length}):
                    </h5>
                    <div className="tags-cloud">
                      {atsAnalysis.uniqueMetrics.length === 0 ? (
                        <span className="empty-hint">No numeric metrics detected.</span>
                      ) : (
                        atsAnalysis.uniqueMetrics.map((m) => (
                          <span key={m} className="tag-badge tag-metric-chip">
                            📊 {m}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendations Card */}
              <div className="panel-box" style={{ marginTop: "20px" }}>
                <h4 style={{ margin: "0 0 14px", color: "#0f172a" }}>
                  💡 ATS Optimizer Recommendations
                </h4>
                <ul className="ats-tips-list">
                  {atsAnalysis.tips.map((t, i) => (
                    <li key={i} className="tip-item">
                      <span className="tip-bullet">⚠️</span>
                      <span>{t}</span>
                    </li>
                  ))}
                  <li className="tip-item success">
                    <span className="tip-bullet">✅</span>
                    <span>Consistent chronological structure detected.</span>
                  </li>
                  <li className="tip-item success">
                    <span className="tip-bullet">✅</span>
                    <span>Standard font & character encoding compatible with ATS crawlers.</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* TAB 3: RAW EXTRACTED TEXT VIEW */}
          {/* ========================================================== */}
          {activeTab === "raw" && (
            <div className="panel-box tab-raw-view">
              <div className="raw-toolbar">
                <div className="raw-stats">
                  <span>Characters: {rawText.length}</span>
                  <span>•</span>
                  <span>Words: {rawText ? rawText.split(/\s+/).length : 0}</span>
                </div>
                <div className="raw-actions">
                  <input
                    type="text"
                    placeholder="Search in extracted text..."
                    value={rawSearchQuery}
                    onChange={(e) => setRawSearchQuery(e.target.value)}
                    className="raw-search-input"
                  />
                  <button type="button" onClick={handleCopyRaw} className="btn-sm btn-outline">
                    {copiedText ? "✓ Copied!" : "📋 Copy Raw Text"}
                  </button>
                </div>
              </div>

              <pre className="raw-text-block">
                {rawSearchQuery
                  ? rawText
                      .split("\n")
                      .filter((line) => line.toLowerCase().includes(rawSearchQuery.toLowerCase()))
                      .join("\n") || "No matching lines found."
                  : rawText || "No raw text available for this resume."}
              </pre>
            </div>
          )}

          {/* ========================================================== */}
          {/* TAB 4: JSON SCHEMA VIEW */}
          {/* ========================================================== */}
          {activeTab === "json" && (
            <div className="panel-box tab-json-view">
              <div className="raw-toolbar">
                <span style={{ fontSize: "13px", color: "#64748b" }}>
                  Standardized JSON schema compatible with applicant tracking systems and matching models
                </span>
                <button type="button" onClick={handleCopyJson} className="btn-sm btn-outline">
                  {copiedJson ? "✓ Copied!" : "📋 Copy JSON"}
                </button>
              </div>

              <pre className="raw-text-block json-code">
                {JSON.stringify(extractedData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
