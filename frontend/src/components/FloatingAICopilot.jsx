import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import api from "../services/api";

const STORAGE_KEY = "talentsprint_floating_ai_history";

export default function FloatingAICopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [activeComponent, setActiveComponent] = useState(null);

  // Resume components state
  const [resumeComponents, setResumeComponents] = useState({
    filename: "",
    targetRole: "",
    skills: [],
    experience: [],
    projects: [],
    education: [],
    summary: "",
    atsScore: 85
  });
  const [loadingResume, setLoadingResume] = useState(false);

  // Load chat history from localStorage on initial render
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn("Could not load floating AI history:", e);
    }
    return [
      {
        role: "assistant",
        content:
          "👋 **Hi! I'm your AI Career Copilot.**\n\nYour **Auto Resume Components** are loaded below. Click any component (*Skills, Experience, Projects, ATS Score*) to ask targeted questions about your actual resume, or type any query!"
      }
    ];
  });

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {
      console.warn("Could not save floating AI history:", e);
    }
  }, [messages]);

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && !showHistory) {
      scrollToBottom();
    }
  }, [messages, isOpen, showHistory]);

  // Fetch Auto Resume Components on Mount
  useEffect(() => {
    const fetchResumeComponents = async () => {
      setLoadingResume(true);
      try {
        // 1. Fetch user profile
        const profileRes = await api.get("/api/profile/me");
        const profile = profileRes.data || {};

        let extractedSkills = Array.isArray(profile.skills) ? profile.skills : [];
        let activeRole = profile.target_role || "Software Engineer Intern";
        let activeFilename = profile.active_resume_filename || "";

        // 2. Fetch resumes list
        const resumesRes = await api.get("/resumes/my");
        const resumes = resumesRes.data || [];
        const activeResume = resumes.find((r) => r.is_active) || resumes[0];

        let expList = [];
        let projList = [];
        let eduList = [];
        let resumeSummary = profile.bio || "";
        let atsVal = 88;

        if (activeResume) {
          activeFilename = activeResume.filename || activeFilename;
          try {
            const extractRes = await api.get(`/resumes/${activeResume.id}/deep-extract`);
            const extData = extractRes.data?.data;
            if (extData) {
              if (extData.summary) resumeSummary = extData.summary;
              if (extData.career_recommendation) activeRole = extData.career_recommendation;

              // Skills extraction
              if (extData.skills) {
                if (Array.isArray(extData.skills)) {
                  extractedSkills = extData.skills;
                } else if (typeof extData.skills === "object") {
                  const tech = extData.skills.technical_skills || [];
                  const tools = extData.skills.tools_frameworks || extData.skills.frameworks_and_libraries || [];
                  const soft = extData.skills.soft_skills || [];
                  extractedSkills = [...new Set([...tech, ...tools, ...soft])];
                }
              }

              if (Array.isArray(extData.experience)) expList = extData.experience;
              if (Array.isArray(extData.projects)) projList = extData.projects;
              if (Array.isArray(extData.education)) eduList = extData.education;
              if (extData.ats_score) atsVal = extData.ats_score;
            }
          } catch (e) {
            console.warn("Could not load deep extraction for resume:", e);
          }
        }

        // Fallback default sample data if resume not uploaded yet
        if (extractedSkills.length === 0) {
          extractedSkills = ["Python", "FastAPI", "React", "Docker", "PostgreSQL", "Git", "REST APIs", "Vector Search"];
        }
        if (expList.length === 0) {
          expList = [
            {
              role: "Software Engineering Intern",
              company: "Innovate AI Labs",
              bullets: [
                "Built asynchronous REST endpoints using FastAPI and PostgreSQL.",
                "Integrated semantic search using FAISS vector embeddings."
              ]
            }
          ];
        }
        if (projList.length === 0) {
          projList = [
            {
              title: "AI ATS Resume Matcher",
              tech: "Python, FastAPI, React",
              description: "Engineered multi-factor resume parsing with 92% semantic accuracy."
            },
            {
              title: "Cloud Microservices Pipeline",
              tech: "Docker, AWS, PostgreSQL",
              description: "Deployed automated containerized CI/CD workflows."
            }
          ];
        }

        setResumeComponents({
          filename: activeFilename || "Active Student Resume",
          targetRole: activeRole,
          skills: extractedSkills,
          experience: expList,
          projects: projList,
          education: eduList.length > 0 ? eduList : [{ degree: "B.Tech in Computer Science", university: profile.university || "Engineering University" }],
          summary: resumeSummary || "Aspiring Software Engineer specializing in backend development, distributed systems, and AI applications.",
          atsScore: atsVal
        });
      } catch (err) {
        console.warn("Could not load auto resume components:", err);
      } finally {
        setLoadingResume(false);
      }
    };

    fetchResumeComponents();
  }, []);

  // Setup Speech-to-Text Recognition
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setQuery(transcript);
          handleSend(transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error("Mic start error:", err);
      }
    }
  };

  // Text-to-speech: ONLY speaks when user explicitly clicks "Listen"
  const handleSpeak = (text, idx) => {
    if (!window.speechSynthesis) return;

    if (speakingIdx === idx) {
      window.speechSynthesis.cancel();
      setSpeakingIdx(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text
      .replace(/[*_#`[\]()]/g, "")
      .replace(/https?:\/\/\S+/g, "")
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.onend = () => setSpeakingIdx(null);
    utterance.onerror = () => setSpeakingIdx(null);

    setSpeakingIdx(idx);
    window.speechSynthesis.speak(utterance);
  };

  // Send query to AI backend (Never auto-speaks!)
  const handleSend = async (customPrompt) => {
    const textToSend = (typeof customPrompt === "string" ? customPrompt : query).trim();
    if (!textToSend || loading) return;

    const userMsg = { role: "user", content: textToSend };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setQuery("");
    setActiveComponent(null);
    setShowHistory(false);
    setLoading(true);

    try {
      const payload = {
        messages: nextMessages.map((m) => ({
          role: m.role,
          content: m.content
        }))
      };

      const res = await api.post("/api/assistant/chat", payload);
      const aiContent =
        res.data?.response || "I analyzed your request. How else can I assist your career preparation?";

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: aiContent,
          nlp_insights: res.data?.nlp_insights,
          suggested_actions: res.data?.suggested_actions
        }
      ]);
    } catch (err) {
      console.error("AI copilot chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "⚠️ I could not connect to the career AI engine right now. Please verify that your backend server is online at port 8001."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Clear Chat History & Start Fresh
  const handleClearHistory = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setSpeakingIdx(null);
    const fresh = [
      {
        role: "assistant",
        content:
          "✨ **New chat session started.**\n\nYour active resume components are loaded below. Click any component or ask me any career, interview, or internship question!"
      }
    ];
    setMessages(fresh);
    localStorage.removeItem(STORAGE_KEY);
    setShowHistory(false);
    setActiveComponent(null);
  };

  // Smart action prompts for Auto Resume Components
  const componentActions = {
    skills: [
      {
        label: "🎯 Analyze Skill Gaps",
        prompt: `Analyze my verified resume skills (${resumeComponents.skills.slice(0, 10).join(", ")}) for the target role "${resumeComponents.targetRole}". What critical skills are missing that I must learn?`
      },
      {
        label: "🔑 Suggest ATS Keywords",
        prompt: `Based on my current skills (${resumeComponents.skills.slice(0, 8).join(", ")}), what high-frequency ATS keywords should I add to my resume to pass company screening algorithms?`
      },
      {
        label: "💡 Recommend Next Tech Stack",
        prompt: `Given my proficiency in ${resumeComponents.skills.slice(0, 5).join(", ")}, recommend 2 modern frameworks or tools I should build my next project with.`
      }
    ],
    experience: [
      {
        label: "✍️ Rewrite Experience for ATS",
        prompt: `Please review my work experience from my resume (${resumeComponents.experience.map((e) => `${e.role} at ${e.company}`).join(", ")}). Rewrite the bullet points with strong action verbs and quantified impact metrics.`
      },
      {
        label: "❓ Interview Questions on Experience",
        prompt: `What behavioral STAR questions and technical questions will recruiters ask about my work experience (${resumeComponents.experience[0]?.role || "Software Engineering Intern"})?`
      }
    ],
    projects: [
      {
        label: "🚀 Audit Resume Projects",
        prompt: `Critique my resume projects (${resumeComponents.projects.map((p) => p.title || p.name).join(", ")}). How can I describe their architecture to sound impressive to tech leads and recruiters?`
      },
      {
        label: "🎙️ Project Defense Q&A",
        prompt: `Generate 3 difficult technical interview questions recruiters will ask when grilling me on my project "${resumeComponents.projects[0]?.title || "AI ATS Resume Matcher"}".`
      }
    ],
    atsScore: [
      {
        label: "📈 Step-by-Step 95+ ATS Plan",
        prompt: `My resume current ATS score is ${resumeComponents.atsScore}/100. Give me a concrete checklist of edits to elevate it to 95+ for top tech companies.`
      },
      {
        label: "⚠️ Audit Weak Words & Passive Voice",
        prompt: `Audit my resume for passive verbs and weak phrasing. What power verbs should I substitute to maximize ATS score?`
      }
    ],
    targetRole: [
      {
        label: "💼 Top Tech Hiring Requirements",
        prompt: `What are top tech companies looking for in a "${resumeComponents.targetRole}" intern in 2026? Detail mandatory skills, interview rounds, and portfolio expectations.`
      },
      {
        label: "📋 Mock Technical Round Prep",
        prompt: `Generate a 5-question technical screening quiz for a "${resumeComponents.targetRole}" position with ideal sample answers.`
      }
    ],
    summary: [
      {
        label: "✨ Polish Executive Summary",
        prompt: `Here is my current resume summary: "${resumeComponents.summary}". Please rewrite it into a punchy, executive-level 3-line summary tailored for ${resumeComponents.targetRole}.`
      }
    ]
  };

  return (
    <>
      {/* 1. Floating Action Launcher Button (Fixed at Bottom-Right Screen Corner) */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="floating-ai-launcher"
          title="Click to query AI Career Copilot"
          aria-label="Open AI Assistant"
        >
          <div className="ai-launcher-glow"></div>
          <div className="ai-launcher-icon">✨</div>
          <span className="ai-launcher-label">Ask AI</span>
          <span className="ai-launcher-pulse"></span>
        </button>
      )}

      {/* 2. Floating AI Query Drawer (Anchored at Right Corner) */}
      {isOpen && (
        <div className="floating-ai-card">
          {/* Header */}
          <div className="floating-ai-header">
            <div className="floating-ai-title-wrap">
              <div className="floating-ai-avatar">⚡</div>
              <div>
                <h4 className="floating-ai-title">AI Career Companion Agent</h4>
                <div className="floating-ai-status">
                  <span className="live-dot-pulse"></span>
                  <span>Internship Matching & Interview Prep</span>
                </div>
              </div>
            </div>

            <div className="floating-ai-header-actions">
              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                className={`btn-floating-history-toggle ${showHistory ? "active" : ""}`}
                title="View Conversation History"
                aria-label="Chat History"
              >
                📜
              </button>
              <button
                type="button"
                onClick={handleClearHistory}
                className="btn-floating-new"
                title="Start New Chat Session"
                aria-label="New Chat"
              >
                +
              </button>
              <Link
                to="/career-assistant"
                className="btn-floating-expand"
                title="Open Full Mentor Studio"
                onClick={() => setIsOpen(false)}
              >
                ↗
              </Link>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  if (window.speechSynthesis) window.speechSynthesis.cancel();
                  setSpeakingIdx(null);
                }}
                className="btn-floating-close"
                title="Close AI Assistant"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
          </div>

          {/* ============================================================
              AUTO RESUME COMPONENTS STRIP (Interactive Query Launcher)
              ============================================================ */}
          <div className="auto-resume-strip">
            <div className="auto-resume-strip-header">
              <span className="auto-resume-tag">📄 AUTO RESUME COMPONENTS</span>
              <span className="auto-resume-hint">Click to query AI by component:</span>
            </div>

            <div className="auto-resume-pills-row">
              <button
                type="button"
                className={`resume-pill-btn ${activeComponent === "skills" ? "active" : ""}`}
                onClick={() =>
                  setActiveComponent(activeComponent === "skills" ? null : "skills")
                }
                title="Query AI regarding your verified skills"
              >
                ⚡ Skills ({resumeComponents.skills.length})
              </button>

              <button
                type="button"
                className={`resume-pill-btn ${activeComponent === "experience" ? "active" : ""}`}
                onClick={() =>
                  setActiveComponent(activeComponent === "experience" ? null : "experience")
                }
                title="Query AI regarding your work experience"
              >
                💼 Experience
              </button>

              <button
                type="button"
                className={`resume-pill-btn ${activeComponent === "projects" ? "active" : ""}`}
                onClick={() =>
                  setActiveComponent(activeComponent === "projects" ? null : "projects")
                }
                title="Query AI regarding your projects"
              >
                🛠️ Projects ({resumeComponents.projects.length})
              </button>

              <button
                type="button"
                className={`resume-pill-btn ${activeComponent === "atsScore" ? "active" : ""}`}
                onClick={() =>
                  setActiveComponent(activeComponent === "atsScore" ? null : "atsScore")
                }
                title="Query AI regarding your ATS score"
              >
                📊 ATS: {resumeComponents.atsScore}%
              </button>

              <button
                type="button"
                className={`resume-pill-btn ${activeComponent === "targetRole" ? "active" : ""}`}
                onClick={() =>
                  setActiveComponent(activeComponent === "targetRole" ? null : "targetRole")
                }
                title="Query AI regarding your target role"
              >
                🎯 {resumeComponents.targetRole.split(" ")[0]} Role
              </button>

              <button
                type="button"
                className={`resume-pill-btn ${activeComponent === "summary" ? "active" : ""}`}
                onClick={() =>
                  setActiveComponent(activeComponent === "summary" ? null : "summary")
                }
                title="Query AI regarding your summary"
              >
                📝 Summary
              </button>
            </div>

            {/* Active Component Query Popover */}
            {activeComponent && componentActions[activeComponent] && (
              <div className="component-actions-tray">
                <div className="tray-header">
                  <strong>Query by {activeComponent.toUpperCase()}:</strong>
                  <button
                    type="button"
                    className="btn-tray-close"
                    onClick={() => setActiveComponent(null)}
                  >
                    ✕
                  </button>
                </div>
                <div className="tray-actions-list">
                  {componentActions[activeComponent].map((act, aIdx) => (
                    <button
                      key={aIdx}
                      type="button"
                      className="tray-action-btn"
                      onClick={() => handleSend(act.prompt)}
                      disabled={loading}
                    >
                      <span>{act.label}</span>
                      <small className="arrow">➔</small>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* CHAT HISTORY VIEW (Toggleable) */}
          {showHistory ? (
            <div className="floating-ai-history-pane">
              <div className="history-pane-header">
                <strong>📜 Chat History ({messages.filter((m) => m.role === "user").length} Queries)</strong>
                <button
                  type="button"
                  onClick={() => setShowHistory(false)}
                  className="btn-sm btn-secondary"
                >
                  Back to Chat
                </button>
              </div>

              <div className="history-items-list">
                {messages
                  .filter((m) => m.role === "user")
                  .map((m, hIdx) => (
                    <div
                      key={hIdx}
                      className="history-item-row"
                      onClick={() => {
                        setShowHistory(false);
                      }}
                    >
                      <span className="history-item-num">Q{hIdx + 1}</span>
                      <p className="history-item-text">{m.content}</p>
                    </div>
                  ))}

                {messages.filter((m) => m.role === "user").length === 0 && (
                  <p className="history-empty">No past queries yet. Ask a question below!</p>
                )}
              </div>

              <div className="history-pane-footer">
                <button
                  type="button"
                  onClick={handleClearHistory}
                  className="btn-clear-history"
                >
                  🗑️ Clear All Chat History
                </button>
              </div>
            </div>
          ) : (
            /* MESSAGES BODY */
            <div className="floating-ai-body">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`floating-msg-row ${
                    m.role === "user" ? "msg-row-user" : "msg-row-ai"
                  }`}
                >
                  {m.role === "assistant" && (
                    <div className="floating-msg-avatar">⚡</div>
                  )}
                  <div
                    className={`floating-msg-bubble ${
                      m.role === "user" ? "bubble-user" : "bubble-ai"
                    }`}
                  >
                    <div className="markdown-content">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {m.content}
                      </ReactMarkdown>
                    </div>

                    {/* ONLY speaks when user clicks Listen Aloud! No automatic speech! */}
                    {m.role === "assistant" && (
                      <div className="msg-bubble-footer">
                        <button
                          type="button"
                          onClick={() => handleSpeak(m.content, idx)}
                          className={`btn-msg-listen ${
                            speakingIdx === idx ? "is-speaking" : ""
                          }`}
                          title="Click to listen to response aloud"
                        >
                          {speakingIdx === idx ? "⏹ Stop Audio" : "🔊 Listen"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="floating-msg-row msg-row-ai">
                  <div className="floating-msg-avatar">⚡</div>
                  <div className="floating-msg-bubble bubble-ai loading-bubble">
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                    <span className="typing-text">AI is thinking...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Quick Prompt Chips (when not showing history) */}
          {!showHistory && !activeComponent && (
            <div className="floating-ai-chips">
              <button
                type="button"
                className="quick-chip-btn"
                onClick={() =>
                  handleSend(
                    `Analyze my verified skills (${resumeComponents.skills.slice(0, 8).join(", ")}) for ${resumeComponents.targetRole} internships.`
                  )
                }
                disabled={loading}
              >
                🎯 Audit My Skills
              </button>
              <button
                type="button"
                className="quick-chip-btn"
                onClick={() =>
                  handleSend(
                    `What technical questions will top companies ask about my projects (${resumeComponents.projects.map((p) => p.title || p.name).join(", ")})?`
                  )
                }
                disabled={loading}
              >
                🎙️ Project Interview Qs
              </button>
              <button
                type="button"
                className="quick-chip-btn"
                onClick={() =>
                  handleSend(
                    `How can I elevate my current resume ATS score (${resumeComponents.atsScore}%) to 95%+?`
                  )
                }
                disabled={loading}
              >
                📈 Boost ATS to 95+
              </button>
              <button
                type="button"
                className="quick-chip-btn"
                onClick={() =>
                  handleSend(
                    `Rewrite my experience bullets for ${resumeComponents.targetRole} using high-impact action verbs.`
                  )
                }
                disabled={loading}
              >
                ✍️ Rewrite Bullets
              </button>
            </div>
          )}

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="floating-ai-footer"
          >
            <input
              type="text"
              placeholder={
                isListening
                  ? "🎙️ Listening... speak your query..."
                  : "Ask anything, or click resume components above..."
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="floating-ai-input"
              disabled={loading}
            />

            <button
              type="button"
              onClick={toggleListening}
              className={`btn-floating-mic ${isListening ? "mic-active" : ""}`}
              title={isListening ? "Stop listening" : "Click to speak query"}
              aria-label="Voice input"
            >
              🎙️
            </button>

            <button
              type="submit"
              disabled={!query.trim() || loading}
              className="btn-floating-send"
              title="Send Query"
              aria-label="Send"
            >
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  );
}
