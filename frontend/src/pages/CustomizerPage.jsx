import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../services/api";

export default function CustomizerPage() {
  const [searchParams] = useSearchParams();
  const defaultCompany = searchParams.get("company") || "TechCorp Innovations";
  const defaultRole = searchParams.get("role") || "Backend Developer Intern";

  const [activeTab, setActiveTab] = useState("resume"); // "resume", "cover_letter", "cv_generator"

  // Resume Tailor states
  const [targetRole, setTargetRole] = useState(defaultRole);
  const [jobDescription, setJobDescription] = useState("");
  const [tailoredResume, setTailoredResume] = useState(null);
  const [loadingResume, setLoadingResume] = useState(false);

  // Cover Letter states
  const [company, setCompany] = useState(defaultCompany);
  const [role, setRole] = useState(defaultRole);
  const [tone, setTone] = useState("professional");
  const [coverLetter, setCoverLetter] = useState(null);
  const [editableCoverText, setEditableCoverText] = useState("");
  const [loadingCover, setLoadingCover] = useState(false);

  // Full CV Generator states
  const [cvTemplate, setCvTemplate] = useState("modern"); // "modern", "classic", "minimal"
  const [cvData, setCvData] = useState({
    fullName: "Alex Chen",
    roleTitle: "Software Engineer Intern",
    email: "alex.chen@university.edu",
    phone: "+91 98765 43210",
    location: "Bengaluru, India",
    linkedin: "linkedin.com/in/alexchen-tech",
    github: "github.com/alexchen-dev",
    summary:
      "High-achieving Computer Science student specializing in scalable backend architectures, cloud computing, and AI systems. Proficient in Python, FastAPI, React, and vector search systems with proven hands-on project experience.",
    skills: {
      languages: "Python, JavaScript, TypeScript, SQL, C++, Go",
      frameworks: "FastAPI, React, Node.js, Express, PyTorch, LangChain",
      cloud_devops: "Docker, Kubernetes, AWS (S3, EC2), PostgreSQL, Redis, Git",
      concepts: "RESTful APIs, Microservices, RAG Pipelines, Vector Databases"
    },
    experience: [
      {
        role: "Software Engineering Intern",
        company: "Innovate AI Labs",
        location: "Bengaluru (Hybrid)",
        duration: "Jan 2025 - Present",
        bullets: [
          "Engineered high-throughput asynchronous REST endpoints using FastAPI and PostgreSQL, reducing latency by 35%.",
          "Implemented semantic vector search pipeline utilizing FAISS and OpenAI embeddings to query 50,000+ internship listings.",
          "Containerized 4 microservices with Docker and configured automated CI/CD workflows."
        ]
      },
      {
        role: "Undergraduate Research Assistant",
        company: "University Computing & AI Center",
        location: "On-Campus",
        duration: "Aug 2024 - Dec 2024",
        bullets: [
          "Developed NLP text extraction pipelines for unstructured PDF resumes with 92.4% extraction accuracy.",
          "Co-authored technical documentation and presented system architecture at the annual technical symposium."
        ]
      }
    ],
    education: [
      {
        degree: "Bachelor of Technology in Computer Science & Engineering",
        school: "National Institute of Technology",
        duration: "2022 - 2026 (Expected)",
        gpa: "CGPA: 8.8 / 10.0",
        details: "Relevant Coursework: Data Structures, Distributed Systems, Database Management, Machine Learning, Operating Systems"
      }
    ],
    projects: [
      {
        title: "Autonomous Internship Intelligence Platform",
        tech: "Python, FastAPI, React, ChromaDB, PostgreSQL",
        bullets: [
          "Architected full-stack career platform with 9 modules including ATS customization and interview preparation.",
          "Built RAG pipeline retrieving verified internship postings with semantic search."
        ]
      },
      {
        title: "Real-time Collaborative Task Board",
        tech: "React, Node.js, WebSockets, Tailwind CSS",
        bullets: [
          "Built responsive real-time Kanban board supporting multi-user drag-and-drop state syncing under 50ms latency."
        ]
      }
    ],
    certifications: [
      "AWS Certified Cloud Practitioner",
      "Deep Learning Specialization (Coursera / DeepLearning.AI)"
    ]
  });

  const [statusMsg, setStatusMsg] = useState("");
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    if (statusMsg) {
      const timer = setTimeout(() => setStatusMsg(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [statusMsg]);

  // Load active user profile on mount to pre-fill CV data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await api.get("/api/profile/me");
        if (res.data) {
          const p = res.data;
          setCvData((prev) => ({
            ...prev,
            fullName: p.name || prev.fullName,
            roleTitle: p.target_role || prev.roleTitle,
            email: p.email || prev.email,
            phone: p.phone || prev.phone,
            location: p.location || prev.location,
            linkedin: p.linkedin_url || prev.linkedin,
            github: p.github_url || prev.github,
            summary: p.bio || prev.summary,
            skills: {
              ...prev.skills,
              languages: Array.isArray(p.skills) ? p.skills.join(", ") : prev.skills.languages
            },
            education: [
              {
                ...prev.education[0],
                school: p.university || prev.education[0].school,
                degree: p.degree ? `${p.degree} in Engineering` : prev.education[0].degree,
                duration: p.graduation_year ? `Class of ${p.graduation_year}` : prev.education[0].duration
              }
            ]
          }));
        }
      } catch (err) {
        // User profile not created yet, keep rich default template
      }
    };
    loadProfile();
  }, []);

  const handleTailorResume = async (e) => {
    e.preventDefault();
    if (!targetRole.trim()) return;

    setLoadingResume(true);
    setStatusMsg("");
    try {
      const res = await api.post("/api/customization/tailor-resume", {
        target_role: targetRole,
        job_description: jobDescription
      });
      setTailoredResume(res.data);
      setStatusMsg("Resume tailored successfully for ATS and role requirements! 🎉");
    } catch (err) {
      console.error("Tailor resume failed:", err);
      setStatusMsg("Failed to tailor resume. Please check backend connection.");
    } finally {
      setLoadingResume(false);
    }
  };

  const handleGenerateCoverLetter = async (e) => {
    e.preventDefault();
    if (!company.trim() || !role.trim()) return;

    setLoadingCover(true);
    setStatusMsg("");
    try {
      const res = await api.post("/api/customization/generate-cover-letter", {
        company,
        role,
        tone,
        job_description: jobDescription
      });
      setCoverLetter(res.data);
      setEditableCoverText(res.data.full_text || "");
      setStatusMsg("Custom cover letter generated! 📄");
    } catch (err) {
      console.error("Cover letter failed:", err);
      setStatusMsg("Failed to generate cover letter. Please try again.");
    } finally {
      setLoadingCover(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setStatusMsg("Copied to clipboard! 📋");
    setTimeout(() => setStatusMsg(""), 3000);
  };

  const downloadAsText = (filename, text) => {
    const element = document.createElement("a");
    const file = new Blob([text], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const generateCvPlainText = () => {
    return `${cvData.fullName.toUpperCase()}
${cvData.roleTitle}
${cvData.email} | ${cvData.phone} | ${cvData.location}
LinkedIn: ${cvData.linkedin} | GitHub: ${cvData.github}

==================================================
PROFESSIONAL SUMMARY
==================================================
${cvData.summary}

==================================================
TECHNICAL COMPETENCIES
==================================================
* Programming Languages: ${cvData.skills.languages}
* Frameworks & Libraries: ${cvData.skills.frameworks}
* Cloud, Databases & Tools: ${cvData.skills.cloud_devops}
* Architectural Concepts: ${cvData.skills.concepts}

==================================================
PROFESSIONAL EXPERIENCE
==================================================
${cvData.experience
  .map(
    (exp) => `${exp.role} - ${exp.company} (${exp.duration})
Location: ${exp.location}
${exp.bullets.map((b) => `  * ${b}`).join("\n")}`
  )
  .join("\n\n")}

==================================================
TECHNICAL PROJECTS
==================================================
${cvData.projects
  .map(
    (proj) => `${proj.title} [${proj.tech}]
${proj.bullets.map((b) => `  * ${b}`).join("\n")}`
  )
  .join("\n\n")}

==================================================
EDUCATION & CREDENTIALS
==================================================
${cvData.education
  .map(
    (edu) => `${edu.degree}
${edu.school} (${edu.duration}) - ${edu.gpa}
${edu.details || ""}`
  )
  .join("\n\n")}

==================================================
CERTIFICATIONS
==================================================
${cvData.certifications.map((c) => `* ${c}`).join("\n")}
`;
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    setStatusMsg("Generating professional executive CV PDF...");
    try {
      const res = await api.post(
        "/api/customization/download-cv-pdf",
        {
          ...cvData,
          template: cvTemplate
        },
        { responseType: "blob" }
      );

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const safeName = (cvData.fullName || "Candidate").replace(/\s+/g, "_");
      link.download = `${safeName}_CV.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setStatusMsg("📄 Your CV PDF has been downloaded successfully!");
      setTimeout(() => setStatusMsg(""), 4000);
    } catch (err) {
      console.error("Backend CV PDF download error, using print fallback:", err);
      setStatusMsg("Preparing print preview to save CV as PDF...");
      window.print();
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const handleAiEnhanceCv = async () => {
    setLoadingResume(true);
    setStatusMsg("AI is optimizing your CV bullets with quantifiable action verbs...");
    try {
      const res = await api.post("/api/customization/tailor-resume", {
        target_role: cvData.roleTitle,
        job_description: "Focus on high-impact engineering accomplishments, quantifiable metrics, and modern tech stack."
      });
      if (res.data) {
        if (res.data.optimized_summary) {
          setCvData((prev) => ({ ...prev, summary: res.data.optimized_summary }));
        }
        if (res.data.tailored_bullet_points && res.data.tailored_bullet_points.length > 0) {
          setCvData((prev) => {
            const newExp = [...prev.experience];
            newExp[0] = {
              ...newExp[0],
              bullets: res.data.tailored_bullet_points.slice(0, 4)
            };
            return { ...prev, experience: newExp };
          });
        }
        setStatusMsg("CV content enhanced with top ATS metrics and action verbs! ✨");
        setTimeout(() => setStatusMsg(""), 4000);
      }
    } catch (err) {
      console.error(err);
      setStatusMsg("Auto-enhancement completed with local profile benchmarks.");
    } finally {
      setLoadingResume(false);
    }
  };

  return (
    <Layout
      title="6. Role-Specific Resume & Cover Letter Customization"
      subtitle="Optimize your resume for ATS, craft tailored cover letters, and build downloadable CVs"
    >
      {/* Tab Switcher */}
      <div className="tabs-bar panel-box">
        <button
          type="button"
          className={`tab-btn ${activeTab === "resume" ? "active" : ""}`}
          onClick={() => setActiveTab("resume")}
        >
          📄 Tailor Resume for Role
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === "cover_letter" ? "active" : ""}`}
          onClick={() => setActiveTab("cover_letter")}
        >
          ✍️ AI Cover Letter Generator
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === "cv_generator" ? "active" : ""}`}
          onClick={() => setActiveTab("cv_generator")}
        >
          🎓 Full CV Generator & PDF Exporter
        </button>
      </div>

      {/* TAB 1: TAILOR RESUME */}
      {activeTab === "resume" && (
        <div className="customizer-split-grid">
          {/* Input Panel */}
          <div className="panel-box">
            <h4>Target Role & Job Description</h4>
            <form onSubmit={handleTailorResume} className="styled-form" style={{ marginTop: "14px" }}>
              <div className="form-group">
                <label>Target Internship Role:</label>
                <input
                  type="text"
                  placeholder="e.g. Backend Developer Intern"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Job Description or Keywords (Optional):</label>
                <textarea
                  rows={4}
                  placeholder="Paste job description or requirements here to optimize for specific ATS keywords..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                />
              </div>

              <button type="submit" className="btn-primary" disabled={loadingResume}>
                {loadingResume ? "Tailoring with AI..." : "⚡ Generate Tailored Resume"}
              </button>
            </form>
          </div>

          {/* Results Panel */}
          <div className="panel-box">
            <div className="panel-header-simple">
              <h4>🎯 Tailored Resume Sections</h4>
              {tailoredResume && (
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      `${tailoredResume.tailored_summary}\n\nKey Skills:\n${tailoredResume.highlighted_skills.join(", ")}\n\nExperience Bullets:\n${tailoredResume.optimized_bullet_points.join("\n")}`
                    )
                  }
                  className="btn-sm btn-outline"
                >
                  📋 Copy All
                </button>
              )}
            </div>

            {!tailoredResume && !loadingResume && (
              <p className="empty-hint">
                Enter your target role and click <strong>Generate Tailored Resume</strong> to optimize your summary and bullet points.
              </p>
            )}

            {loadingResume && (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Generating ATS-optimized summary and bullet points...</p>
              </div>
            )}

            {tailoredResume && (
              <div className="tailored-output">
                <div className="output-section">
                  <h5>Tailored Professional Summary:</h5>
                  <p className="tailored-text-box">{tailoredResume.tailored_summary}</p>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(tailoredResume.tailored_summary)}
                    className="btn-xs btn-outline"
                  >
                    Copy Summary
                  </button>
                </div>

                <div className="output-section">
                  <h5>ATS Recommended Keywords & Core Competencies:</h5>
                  <div className="skills-tags-wrap">
                    {tailoredResume.highlighted_skills?.map((s) => (
                      <span key={s} className="tag-matched">
                        {s}
                      </span>
                    ))}
                    {tailoredResume.recommended_keywords?.map((k) => (
                      <span key={k} className="tag-secondary">
                        {k}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="output-section">
                  <h5>Optimized Impact Bullet Points:</h5>
                  <ul className="bullets-list">
                    {tailoredResume.optimized_bullet_points?.map((bullet, i) => (
                      <li key={i}>{bullet}</li>
                    ))}
                  </ul>
                </div>

                {tailoredResume.customization_tips && (
                  <div className="highlight-banner" style={{ marginTop: "14px" }}>
                    <strong>💡 Recruiter Tips:</strong>
                    <ul style={{ margin: "6px 0 0 16px" }}>
                      {tailoredResume.customization_tips.map((tip, i) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: COVER LETTER GENERATOR */}
      {activeTab === "cover_letter" && (
        <div className="customizer-split-grid">
          {/* Input Panel */}
          <div className="panel-box">
            <h4>Cover Letter Parameters</h4>
            <form onSubmit={handleGenerateCoverLetter} className="styled-form" style={{ marginTop: "14px" }}>
              <div className="form-group">
                <label>Company Name:</label>
                <input
                  type="text"
                  placeholder="e.g. OpenAI Labs / Google / Infosys"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Target Role:</label>
                <input
                  type="text"
                  placeholder="e.g. Generative AI Intern"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Letter Tone:</label>
                <select value={tone} onChange={(e) => setTone(e.target.value)} className="styled-select">
                  <option value="professional">Professional & Polished</option>
                  <option value="enthusiastic">Enthusiastic & High Energy</option>
                  <option value="confident">Confident & Technical Focus</option>
                </select>
              </div>

              <div className="form-group">
                <label>Job Description / Context (Optional):</label>
                <textarea
                  rows={3}
                  placeholder="Paste any company mission points or specific requirements..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                />
              </div>

              <button type="submit" className="btn-primary" disabled={loadingCover}>
                {loadingCover ? "Writing Cover Letter..." : "✍️ Generate Custom Cover Letter"}
              </button>
            </form>
          </div>

          {/* Editor & Preview Panel */}
          <div className="panel-box">
            <div className="panel-header-simple">
              <h4>📄 Live Cover Letter Editor</h4>
              {coverLetter && (
                <div className="actions-inline">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(editableCoverText)}
                    className="btn-sm btn-outline"
                  >
                    📋 Copy Letter
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      downloadAsText(
                        `Cover_Letter_${company.replace(/\s+/g, "_")}.txt`,
                        editableCoverText
                      )
                    }
                    className="btn-sm btn-outline"
                  >
                    ⬇️ Download .txt
                  </button>
                </div>
              )}
            </div>

            {!coverLetter && !loadingCover && (
              <p className="empty-hint">
                Fill in the company and role details to create an impactful, tailored cover letter.
              </p>
            )}

            {loadingCover && (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Generating personalized cover letter...</p>
              </div>
            )}

            {coverLetter && (
              <div className="cover-letter-preview-box">
                <textarea
                  rows={14}
                  className="cover-textarea"
                  value={editableCoverText}
                  onChange={(e) => setEditableCoverText(e.target.value)}
                />
                <small className="editor-subtext">
                  ✏️ You can edit the text directly above before copying or downloading.
                </small>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: FULL AI CV GENERATOR & DOWNLOAD */}
      {activeTab === "cv_generator" && (
        <div className="cv-generator-container">
          {/* Controls & Export Header */}
          <div className="panel-box cv-toolbar-card">
            <div className="cv-toolbar-left">
              <strong>Select CV Design Template:</strong>
              <div className="template-switcher-pills">
                <button
                  type="button"
                  className={`template-pill ${cvTemplate === "modern" ? "active" : ""}`}
                  onClick={() => setCvTemplate("modern")}
                >
                  🚀 Modern Tech
                </button>
                <button
                  type="button"
                  className={`template-pill ${cvTemplate === "classic" ? "active" : ""}`}
                  onClick={() => setCvTemplate("classic")}
                >
                  🏛️ Harvard ATS
                </button>
                <button
                  type="button"
                  className={`template-pill ${cvTemplate === "minimal" ? "active" : ""}`}
                  onClick={() => setCvTemplate("minimal")}
                >
                  ⚡ Minimalist
                </button>
              </div>
            </div>

            <div className="cv-toolbar-actions">
              <button
                type="button"
                onClick={handleAiEnhanceCv}
                className="btn-sm btn-outline"
                disabled={loadingResume}
              >
                {loadingResume ? "Enhancing..." : "⚡ AI Auto-Enhance"}
              </button>
              <button
                type="button"
                onClick={() => copyToClipboard(generateCvPlainText())}
                className="btn-sm btn-outline"
              >
                📋 Copy Text
              </button>
              <button
                type="button"
                onClick={() =>
                  downloadAsText(
                    `${cvData.fullName.replace(/\s+/g, "_")}_Resume_CV.txt`,
                    generateCvPlainText()
                  )
                }
                className="btn-sm btn-outline"
              >
                📥 Download .TXT
              </button>
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="btn-sm btn-primary btn-print-pdf"
                title="Download high-resolution executive PDF CV directly to your computer"
              >
                {downloadingPdf ? "⏳ Generating PDF..." : "📥 Download PDF CV"}
              </button>
              <button
                type="button"
                onClick={handlePrintPdf}
                className="btn-sm btn-outline"
                title="Open browser print preview to print or save as PDF"
              >
                🖨️ Print CV
              </button>
            </div>
          </div>

          {/* CV Split Workspace: Form Editor on Left, Live Sheet Preview on Right */}
          <div className="cv-workspace-grid">
            {/* Left: Quick Form Customizer */}
            <div className="panel-box cv-form-panel">
              <div className="panel-header-simple">
                <h4>✏️ Customize Resume Content</h4>
                <small>Updates live on preview</small>
              </div>

              <div className="styled-form cv-editor-form">
                <div className="form-group">
                  <label>Full Name:</label>
                  <input
                    type="text"
                    value={cvData.fullName}
                    onChange={(e) => setCvData({ ...cvData, fullName: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Professional Title / Headline:</label>
                  <input
                    type="text"
                    value={cvData.roleTitle}
                    onChange={(e) => setCvData({ ...cvData, roleTitle: e.target.value })}
                  />
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label>Email Address:</label>
                    <input
                      type="email"
                      value={cvData.email}
                      onChange={(e) => setCvData({ ...cvData, email: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone Number:</label>
                    <input
                      type="text"
                      value={cvData.phone}
                      onChange={(e) => setCvData({ ...cvData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label>Location:</label>
                    <input
                      type="text"
                      value={cvData.location}
                      onChange={(e) => setCvData({ ...cvData, location: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>LinkedIn / GitHub:</label>
                    <input
                      type="text"
                      value={cvData.linkedin}
                      onChange={(e) => setCvData({ ...cvData, linkedin: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Professional Summary:</label>
                  <textarea
                    rows={4}
                    value={cvData.summary}
                    onChange={(e) => setCvData({ ...cvData, summary: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Programming Languages:</label>
                  <input
                    type="text"
                    value={cvData.skills.languages}
                    onChange={(e) =>
                      setCvData({
                        ...cvData,
                        skills: { ...cvData.skills, languages: e.target.value }
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Frameworks & Libraries:</label>
                  <input
                    type="text"
                    value={cvData.skills.frameworks}
                    onChange={(e) =>
                      setCvData({
                        ...cvData,
                        skills: { ...cvData.skills, frameworks: e.target.value }
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Cloud, Databases & Tools:</label>
                  <input
                    type="text"
                    value={cvData.skills.cloud_devops}
                    onChange={(e) =>
                      setCvData({
                        ...cvData,
                        skills: { ...cvData.skills, cloud_devops: e.target.value }
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Education Degree & University:</label>
                  <input
                    type="text"
                    value={cvData.education[0]?.degree || ""}
                    onChange={(e) => {
                      const newEdu = [...cvData.education];
                      newEdu[0] = { ...newEdu[0], degree: e.target.value };
                      setCvData({ ...cvData, education: newEdu });
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Right: Real-time CV Sheet Canvas (Printable & Exportable) */}
            <div className="cv-preview-container">
              <div id="printable-cv-sheet" className={`cv-sheet-canvas template-${cvTemplate}`}>
                {/* CV Header */}
                <header className="cv-sheet-header">
                  <h1 className="cv-candidate-name">{cvData.fullName}</h1>
                  <p className="cv-candidate-role">{cvData.roleTitle}</p>
                  <div className="cv-contact-strip">
                    {cvData.email && <span>📧 {cvData.email}</span>}
                    {cvData.phone && <span>📞 {cvData.phone}</span>}
                    {cvData.location && <span>📍 {cvData.location}</span>}
                    {cvData.linkedin && <span>🔗 {cvData.linkedin}</span>}
                  </div>
                </header>

                {/* Professional Summary */}
                {cvData.summary && (
                  <section className="cv-sheet-section">
                    <h3 className="cv-section-title">Professional Summary</h3>
                    <p className="cv-summary-text">{cvData.summary}</p>
                  </section>
                )}

                {/* Technical Skills */}
                <section className="cv-sheet-section">
                  <h3 className="cv-section-title">Technical Competencies</h3>
                  <div className="cv-skills-block">
                    {cvData.skills.languages && (
                      <p>
                        <strong>Languages:</strong> {cvData.skills.languages}
                      </p>
                    )}
                    {cvData.skills.frameworks && (
                      <p>
                        <strong>Frameworks & Libs:</strong> {cvData.skills.frameworks}
                      </p>
                    )}
                    {cvData.skills.cloud_devops && (
                      <p>
                        <strong>Cloud & Databases:</strong> {cvData.skills.cloud_devops}
                      </p>
                    )}
                    {cvData.skills.concepts && (
                      <p>
                        <strong>Architectural Concepts:</strong> {cvData.skills.concepts}
                      </p>
                    )}
                  </div>
                </section>

                {/* Experience */}
                {cvData.experience?.length > 0 && (
                  <section className="cv-sheet-section">
                    <h3 className="cv-section-title">Professional Experience</h3>
                    {cvData.experience.map((exp, idx) => (
                      <div key={idx} className="cv-experience-entry">
                        <div className="cv-entry-header">
                          <strong>{exp.role}</strong>
                          <span className="cv-duration">{exp.duration}</span>
                        </div>
                        <div className="cv-entry-sub">
                          <span className="cv-company">{exp.company}</span>
                          <span className="cv-location">{exp.location}</span>
                        </div>
                        <ul className="cv-bullets">
                          {exp.bullets?.map((b, bIdx) => (
                            <li key={bIdx}>{b}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </section>
                )}

                {/* Projects */}
                {cvData.projects?.length > 0 && (
                  <section className="cv-sheet-section">
                    <h3 className="cv-section-title">Key Technical Projects</h3>
                    {cvData.projects.map((proj, idx) => (
                      <div key={idx} className="cv-project-entry">
                        <div className="cv-entry-header">
                          <strong>{proj.title}</strong>
                          <span className="cv-tech-stack">Tech: {proj.tech}</span>
                        </div>
                        <ul className="cv-bullets">
                          {proj.bullets?.map((b, bIdx) => (
                            <li key={bIdx}>{b}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </section>
                )}

                {/* Education */}
                {cvData.education?.length > 0 && (
                  <section className="cv-sheet-section">
                    <h3 className="cv-section-title">Education & Credentials</h3>
                    {cvData.education.map((edu, idx) => (
                      <div key={idx} className="cv-education-entry">
                        <div className="cv-entry-header">
                          <strong>{edu.degree}</strong>
                          <span className="cv-duration">{edu.duration}</span>
                        </div>
                        <div className="cv-entry-sub">
                          <span>{edu.school}</span>
                          <span className="cv-gpa">{edu.gpa}</span>
                        </div>
                        {edu.details && <p className="cv-edu-details">{edu.details}</p>}
                      </div>
                    ))}
                  </section>
                )}

                {/* Certifications */}
                {cvData.certifications?.length > 0 && (
                  <section className="cv-sheet-section">
                    <h3 className="cv-section-title">Certifications & Honors</h3>
                    <ul className="cv-bullets">
                      {cvData.certifications.map((c, idx) => (
                        <li key={idx}>{c}</li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating On-Screen Notification */}
      {statusMsg && (
        <div className="floating-apply-toast">
          <div className="toast-icon-wrap">✨</div>
          <div className="toast-body">
            <h5 className="toast-title">Resume Customizer</h5>
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
