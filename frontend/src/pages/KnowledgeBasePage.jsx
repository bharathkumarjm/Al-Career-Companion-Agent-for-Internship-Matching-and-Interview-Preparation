import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../services/api";

export default function KnowledgeBasePage() {
  const navigate = useNavigate();
  const [internships, setInternships] = useState([]);
  const [domains, setDomains] = useState([]);
  const [selectedDomain, setSelectedDomain] = useState("All Domains");
  const [workMode, setWorkMode] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // RAG Query states
  const [ragQuery, setRagQuery] = useState("");
  const [ragResponse, setRagResponse] = useState(null);
  const [ragLoading, setRagLoading] = useState(false);

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
    nextSet.add(String(applyModalJob.id));
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

  // Voice Speech Recognition
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // Text-to-Speech Output
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          setRagQuery(transcript);
        }
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Brave.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setRagQuery("");
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const speakAnswer = (text) => {
    if (!("speechSynthesis" in window) || !text) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();

    const clean = text.replace(/[*_#`|-]/g, " ").replace(/\s+/g, " ").trim();
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const fetchKnowledgeBase = async () => {
    setLoading(true);
    try {
      const [jobsRes, domsRes] = await Promise.all([
        api.get("/api/knowledge-base/internships", {
          params: {
            domain: selectedDomain === "All Domains" ? null : selectedDomain,
            work_mode: workMode === "All" ? null : workMode,
            search: searchTerm || null
          }
        }),
        api.get("/api/knowledge-base/domains")
      ]);

      setInternships(jobsRes.data.internships || []);
      setDomains(domsRes.data || []);
    } catch (err) {
      console.error("Error fetching knowledge base:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKnowledgeBase();
  }, [selectedDomain, workMode]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchKnowledgeBase();
  };

  const handleRagSearch = async (queryToRun) => {
    const q = queryToRun || ragQuery;
    if (!q.trim()) return;

    setRagLoading(true);
    try {
      const res = await api.post("/api/knowledge-base/rag-query", {
        query: q.trim(),
        top_k: 4
      });
      setRagResponse(res.data);
    } catch (err) {
      console.error("RAG Query failed:", err);
      alert("RAG query failed. Please check backend connection.");
    } finally {
      setRagLoading(false);
    }
  };

  return (
    <Layout
      title="3. Internship & Job Opportunities"
      subtitle="Discover verified opportunities across leading companies and query role requirements with AI"
    >
      {/* Opportunities Query Assistant Section */}
      <section className="panel-box rag-container">
        <div className="rag-header">
          <div className="rag-title-row">
            <span className="rag-icon">💼</span>
            <div>
              <h3>Opportunities AI Assistant</h3>
              <p>Ask natural questions grounded in real internship openings, stipends, and interview processes</p>
            </div>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleRagSearch();
          }}
          className="rag-input-form"
        >
          <input
            type="text"
            placeholder={isListening ? "Listening... speak your question..." : "e.g. Which internships require Python and offer remote work with high stipends?"}
            value={ragQuery}
            onChange={(e) => setRagQuery(e.target.value)}
            className="rag-text-input"
          />
          <button
            type="button"
            onClick={toggleListening}
            className={`btn-action-pill ${isListening ? "demo-pill" : "upload-pill"}`}
            title="Ask by speaking into microphone"
            style={{ padding: "0 14px", height: "42px" }}
          >
            🎙️ {isListening ? "Listening..." : "Speak"}
          </button>
          <button type="submit" className="btn-primary" disabled={ragLoading}>
            {ragLoading ? "Searching..." : "🔍 Query Opportunities"}
          </button>
        </form>

        <div className="rag-quick-chips">
          <span className="chips-label">Quick Prompts:</span>
          {[
            "Which internships require Python & FastAPI?",
            "Show high-stipend remote roles",
            "What are the requirements for Generative AI interns?",
            "What is the interview process for Cloud DevOps?"
          ].map((prompt) => (
            <button
              key={prompt}
              type="button"
              className="chip-btn"
              onClick={() => {
                setRagQuery(prompt);
                handleRagSearch(prompt);
              }}
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* RAG Answer Display */}
        {ragResponse && (
          <div className="rag-answer-box">
            <div className="rag-answer-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h4 style={{ margin: 0 }}>💡 Grounded AI Answer:</h4>
                <button
                  type="button"
                  onClick={() => speakAnswer(ragResponse.answer)}
                  className="btn-action-pill upload-pill"
                  style={{ fontSize: "12px", padding: "3px 10px" }}
                  title="Listen to AI answer spoken aloud"
                >
                  {isSpeaking ? "⏹️ Stop Audio" : "🔊 Listen Aloud"}
                </button>
              </div>
              <small>Query: "{ragResponse.query}"</small>
            </div>
            <div className="rag-answer-text">
              {ragResponse.answer.split("\n").map((line, idx) => (
                <p key={idx}>{line}</p>
              ))}
            </div>

            {ragResponse.key_takeaways?.length > 0 && (
              <div className="rag-takeaways">
                <strong>Key Takeaways:</strong>
                <ul>
                  {ragResponse.key_takeaways.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Directory & Filter Section */}
      <section className="directory-section">
        <div className="directory-controls panel-box">
          <div className="controls-row">
            {/* Domain Pills */}
            <div className="domain-filters-row">
              {domains.map((dom) => (
                <button
                  key={dom.name}
                  type="button"
                  className={`filter-pill ${selectedDomain === dom.name ? "active" : ""}`}
                  onClick={() => setSelectedDomain(dom.name)}
                >
                  {dom.name} ({dom.count})
                </button>
              ))}
            </div>

            {/* Work Mode & Search */}
            <div className="search-and-mode">
              <select
                value={workMode}
                onChange={(e) => setWorkMode(e.target.value)}
                className="styled-select-sm"
              >
                <option value="All">All Modes</option>
                <option value="Remote">Remote Only</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Onsite">Onsite</option>
              </select>

              <form onSubmit={handleSearchSubmit} className="search-inline-form">
                <input
                  type="text"
                  placeholder="Keyword search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input-sm"
                />
                <button type="submit" className="btn-sm btn-outline">
                  Search
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Internship Cards Grid */}
        <div className="internship-cards-grid">
          {loading && (
            <div className="loading-state panel-box">
              <p>Loading internship knowledge records...</p>
            </div>
          )}

          {!loading && internships.length === 0 && (
            <div className="panel-box empty-hint">
              No internships match your current filters. Try resetting filters.
            </div>
          )}

          {!loading &&
            internships.map((job) => (
              <div key={job.id} className="kb-internship-card panel-box">
                <div className="kb-card-header">
                  <div>
                    <span className="domain-tag-sm">{job.domain}</span>
                    <h4 className="job-card-title">{job.title}</h4>
                    <p className="job-card-company">{job.company}</p>
                  </div>
                  <div className="stipend-badge">{job.stipend}</div>
                </div>

                <div className="job-meta-row">
                  <span>📍 {job.location}</span>
                  <span>🏢 {job.work_mode}</span>
                  <span>⏱️ {job.duration}</span>
                </div>

                <p className="job-desc-snippet">{job.description}</p>

                <div className="job-skills-section">
                  <small>Required Skills:</small>
                  <div className="skills-tags-wrap">
                    {job.required_skills.split(",").map((s) => (
                      <span key={s} className="skill-bubble">
                        {s.trim()}
                      </span>
                    ))}
                  </div>
                </div>

                {job.interview_process && (
                  <div className="interview-process-preview">
                    <small>Interview Stages:</small>
                    <p>{job.interview_process}</p>
                  </div>
                )}

                <div className="job-card-actions">
                  <Link
                    to={`/customizer?company=${encodeURIComponent(job.company)}&role=${encodeURIComponent(job.title)}&tab=cover_letter`}
                    className="btn-sm btn-outline"
                  >
                    ✍️ Tailor Cover Letter
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleOpenApplyModal(job)}
                    className={`btn-sm ${
                      appliedJobs.has(`${job.company.trim().toLowerCase()}_${job.title.trim().toLowerCase()}`) ||
                      appliedJobs.has(String(job.id))
                        ? "btn-applied-success"
                        : "btn-primary"
                    }`}
                  >
                    {appliedJobs.has(`${job.company.trim().toLowerCase()}_${job.title.trim().toLowerCase()}`) ||
                    appliedJobs.has(String(job.id))
                      ? "✅ Applied"
                      : "🚀 Apply"}
                  </button>
                </div>
              </div>
            ))}
        </div>
      </section>

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
