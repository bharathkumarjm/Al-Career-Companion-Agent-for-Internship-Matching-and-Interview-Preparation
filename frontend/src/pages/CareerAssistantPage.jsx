import html2canvas from "html2canvas";
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../services/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Clean markdown syntax for natural spoken text-to-speech output
function cleanMarkdownForSpeech(markdown) {
  if (!markdown) return "";
  let text = markdown;
  text = text.replace(/```[\s\S]*?```/g, " code block omitted. ");
  text = text.replace(/`([^`]+)`/g, "$1");
  text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1");
  text = text.replace(/\|/g, " ");
  text = text.replace(/#{1,6}\s*/g, "");
  text = text.replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, "$1");
  text = text.replace(/^\s*[-*+]\s+/gm, "");
  text = text.replace(/^\s*\d+\.\s+/gm, "");
  text = text.replace(/https?:\/\/\S+/g, "");
  text = text.replace(/[\u{1F300}-\u{1F9FF}]/gu, "");
  text = text.replace(/\s+/g, " ").trim();
  return text;
}

// Format and enrich assistant markdown for clean visual rendering
function formatAssistantMarkdown(markdown) {
  if (!markdown) return "";
  let text = markdown;

  // 1. Unwrap code blocks that enclose resume templates or markdown sections
  // This prevents raw #### and - ** from rendering inside a cramped monospace code box with horizontal scrollbars
  text = text.replace(/```(?:markdown|md|text)?\s*\n?([\s\S]*?####[\s\S]*?)```/g, "$1");
  text = text.replace(/```(?:markdown|md|text)?\s*\n?([\s\S]*?-\s+\*\*[\s\S]*?)```/g, "$1");
  text = text.replace(/```(?:markdown|md|text)?\s*\n?(\s*-\s+[\s\S]*?)```/g, "$1");

  // 2. Convert bulleted task items: • [ ] or * [ ] or [ ] to standard GFM checklist - [ ]
  text = text.replace(/^[ \t]*[•*]?[ \t]*\[([ xX])\]/gm, "- [$1]");
  
  // 3. Convert unicode bullets • to markdown list item -
  text = text.replace(/^[ \t]*[•●][ \t]*/gm, "- ");

  // 4. Enhance STAR Framework labels with distinct visual indicator emojis
  text = text.replace(/(?:^|[ \t]+)Situation:\s*/gm, "\n- **📍 Situation:** ");
  text = text.replace(/(?:^|[ \t]+)Task:\s*/gm, "\n- **🎯 Task:** ");
  text = text.replace(/(?:^|[ \t]+)Action:\s*/gm, "\n- **⚡ Action:** ");
  text = text.replace(/(?:^|[ \t]+)Result:\s*/gm, "\n- **🏆 Result:** ");

  // 5. Clean up potential duplicate newlines introduced
  text = text.replace(/\n{3,}/g, "\n\n");

  // 6. Format key section headers if sent without markdown heading symbols
  text = text.replace(/^[ \t]*Behavioural \(STAR method\)[ \t]*$/gmi, "### 👥 Behavioral Interview (STAR Method)");

  // 7. Enhance resume role heading with badge icon if formatted like #### Role | Company (Dates)
  text = text.replace(/^[ \t]*####\s*([^\n]*?\|[^\n]*?)$/gm, "#### 💼 $1");

  return text;
}

export default function CareerAssistantPage() {
  const [searchParams] = useSearchParams();
  const initialPrompt = searchParams.get("q") || searchParams.get("topic");

  // View state: "chat", "prep_studio", "role_recs", or "workbench"
  const [activeView, setActiveView] = useState("chat");
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [copiedFullChat, setCopiedFullChat] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportToast, setExportToast] = useState(null);
  const [responseMode, setResponseMode] = useState("minimal"); // "minimal" (default) or "detailed"
  const chatContainerRef = useRef(null);
  const [activeResumeComponent, setActiveResumeComponent] = useState(null);

  // Resume components state
  const [resumeComponents, setResumeComponents] = useState({
    filename: "",
    targetRole: "Software Engineer Intern",
    skills: ["Python", "FastAPI", "React", "Docker", "PostgreSQL", "Git", "REST APIs", "Vector Search"],
    experience: [
      {
        role: "Software Engineering Intern",
        company: "Innovate AI Labs",
        bullets: [
          "Built asynchronous REST endpoints using FastAPI and PostgreSQL.",
          "Integrated semantic search using FAISS vector embeddings."
        ]
      }
    ],
    projects: [
      {
        title: "AI ATS Resume Matcher",
        tech: "Python, FastAPI, React",
        description: "Engineered multi-factor resume parsing with 92% semantic accuracy."
      }
    ],
    education: [{ degree: "B.Tech Computer Science", university: "Engineering University" }],
    summary: "Aspiring Software Engineer specializing in backend systems, distributed architectures, and AI applications.",
    atsScore: 88
  });

  // Feature 1: Role Recommendations State
  const [roleRecsData, setRoleRecsData] = useState(null);
  const [loadingRoleRecs, setLoadingRoleRecs] = useState(false);

  // Feature 2: Interview Prep Studio State
  const [interviewPrepData, setInterviewPrepData] = useState(null);
  const [loadingPrep, setLoadingPrep] = useState(false);
  const [targetPrepRole, setTargetPrepRole] = useState("Backend Engineering Intern");
  const [prepActiveTab, setPrepActiveTab] = useState("technical"); // "technical", "hr", "roadmap", "topics"

  // Feature 3: Document Q&A State
  const [docQAData, setDocQAData] = useState(null);
  const [loadingDocQA, setLoadingDocQA] = useState(false);
  const [expandedDocQAId, setExpandedDocQAId] = useState(1);

  // Load chat history from localStorage or default welcome message
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem("talentsprint_career_ai_history");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn("Could not load career AI history:", e);
    }
    return [
      {
        role: "assistant",
        content:
          "👋 **Hi! I'm your AI Career Companion.**\n\nI provide **minimal, direct, and focused** career answers grounded in your resume. Ask me about roles, interview preparation, technical concepts, or upload a document for Q&A.",
        nlp_insights: {
          intent: "WELCOME_GUIDANCE",
          intent_display: "🤖 AI Career Companion Session Active",
          confidence: 0.99,
          tone: "Encouraging & Expert",
          sentiment: "Positive",
          entities: {
            skills: ["Resume Parsing", "Role Matching", "Interview Preparation"],
            institutions: [],
            companies: [],
            roles: ["Software Engineer Intern"],
            locations: []
          }
        }
      }
    ];
  });

  // Save chat history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("talentsprint_career_ai_history", JSON.stringify(messages));
    } catch (e) {
      console.warn("Could not save career AI history:", e);
    }
  }, [messages]);

  // Fetch Auto Resume Components on Mount
  useEffect(() => {
    const loadResumeData = async () => {
      try {
        const profileRes = await api.get("/api/profile/me");
        const profile = profileRes.data || {};
        let skills = Array.isArray(profile.skills) ? profile.skills : [];
        let role = profile.target_role || "Software Engineer Intern";
        let filename = profile.active_resume_filename || "";

        const resumesRes = await api.get("/resumes/my");
        const resumes = resumesRes.data || [];
        const activeResume = resumes.find((r) => r.is_active) || resumes[0];

        let exp = [];
        let proj = [];
        let edu = [];
        let summary = profile.bio || "";
        let ats = 88;

        if (activeResume) {
          filename = activeResume.filename || filename;
          try {
            const extRes = await api.get(`/resumes/${activeResume.id}/deep-extract`);
            const ext = extRes.data?.data;
            if (ext) {
              if (ext.summary) summary = ext.summary;
              if (ext.career_recommendation) role = ext.career_recommendation;
              if (ext.skills) {
                if (Array.isArray(ext.skills)) skills = ext.skills;
                else if (typeof ext.skills === "object") {
                  const tech = ext.skills.technical_skills || [];
                  const tools = ext.skills.tools_frameworks || ext.skills.frameworks_and_libraries || [];
                  const soft = ext.skills.soft_skills || [];
                  skills = [...new Set([...tech, ...tools, ...soft])];
                }
              }
              if (Array.isArray(ext.experience)) exp = ext.experience;
              if (Array.isArray(ext.projects)) proj = ext.projects;
              if (Array.isArray(ext.education)) edu = ext.education;
              if (ext.ats_score) ats = ext.ats_score;
            }
          } catch (e) {
            console.warn("Could not load deep extract:", e);
          }
        }

        if (skills.length === 0) {
          skills = ["Python", "FastAPI", "React", "Docker", "PostgreSQL", "Git", "REST APIs", "Vector Search"];
        }

        const compData = {
          filename: filename || "Active Candidate Resume",
          targetRole: role,
          skills,
          experience: exp.length > 0 ? exp : [
            {
              role: "Software Engineering Intern",
              company: "Innovate AI Labs",
              bullets: ["Built asynchronous REST endpoints using FastAPI.", "Integrated semantic search using FAISS vector embeddings."]
            }
          ],
          projects: proj.length > 0 ? proj : [
            { title: "AI ATS Resume Matcher", tech: "Python, FastAPI, React", description: "Engineered multi-factor resume parsing." }
          ],
          education: edu.length > 0 ? edu : [{ degree: "B.Tech Computer Science", university: profile.university || "Engineering University" }],
          summary: summary || "Aspiring Software Engineer specializing in backend systems and AI.",
          atsScore: ats
        };

        setResumeComponents(compData);
        setTargetPrepRole(role);
      } catch (err) {
        console.warn("Could not load resume components:", err);
      }
    };
    loadResumeData();
  }, []);

  const [inputMessage, setInputMessage] = useState(initialPrompt || "");
  const [loading, setLoading] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [attachedDoc, setAttachedDoc] = useState(null);
  const [showNlpInspector, setShowNlpInspector] = useState(true);
  const [expandedNlpIds, setExpandedNlpIds] = useState({ 0: true });

  // Voice Interaction State (autoSpeakEnabled defaults to FALSE to keep silent by default!)
  const [isListening, setIsListening] = useState(false);
  const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentlySpeakingIdx, setCurrentlySpeakingIdx] = useState(null);
  const [autoSpeakEnabled, setAutoSpeakEnabled] = useState(false);

  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const [quickPrompts, setQuickPrompts] = useState([
    "Which role can I apply for?",
    "Which internship is suitable for my skills?",
    "What are my strongest technical skills?",
    "Prepare me for a Backend Developer interview",
    "Generate 5 technical questions with answer guidance"
  ]);

  // Live NLP Workbench State
  const [workbenchText, setWorkbenchText] = useState(
    "Engineered scalable REST APIs in FastAPI and deployed on AWS ECS with Docker and PostgreSQL, reducing latency by 35%."
  );
  const [workbenchData, setWorkbenchData] = useState(null);
  const [workbenchLoading, setWorkbenchLoading] = useState(false);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechRecognitionSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        let finalTrans = "";
        let interimTrans = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript;
          if (event.results[i].isFinal) finalTrans += t;
          else interimTrans += t;
        }
        const combined = (finalTrans || interimTrans).trim();
        setSpeechTranscript(combined);
        if (combined) setInputMessage(combined);
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error !== "no-speech") setIsListening(false);
      };

      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
    };
  }, []);

  const stopSpeaking = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setCurrentlySpeakingIdx(null);
  };

  const speakText = (text, idx) => {
    if (!("speechSynthesis" in window)) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }
    stopSpeaking();
    const clean = cleanMarkdownForSpeech(text);
    if (!clean) return;

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.lang = "en-US";

    utterance.onstart = () => {
      setIsSpeaking(true);
      setCurrentlySpeakingIdx(idx);
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      setCurrentlySpeakingIdx(null);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setCurrentlySpeakingIdx(null);
    };
    window.speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    if (!speechRecognitionSupported) {
      alert("Voice input is not supported in this browser. Please use Chrome, Brave, or Edge.");
      return;
    }
    if (isListening) {
      try { recognitionRef.current?.stop(); } catch (e) {}
      setIsListening(false);
    } else {
      stopSpeaking();
      setSpeechTranscript("");
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.warn("Recognition start error:", err);
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (activeView === "chat") scrollToBottom();
  }, [messages, loading, activeView]);

  // Copy Complete Conversation to Clipboard
  const handleCopyCompleteConversation = () => {
    if (!messages || messages.length === 0) {
      alert("No messages to copy.");
      return;
    }

    const separator = "=".repeat(64);
    const header = [
      separator,
      "TALENTSPRINT AI — CAREER COMPANION TRANSCRIPT",
      `Candidate:   ${resumeComponents.filename || "Candidate"}`,
      `Target Role: ${resumeComponents.targetRole}`,
      `Date:        ${new Date().toLocaleString()}`,
      `Exchanges:   ${messages.length} messages`,
      separator,
      ""
    ].join("\n");

    const body = messages
      .map((m, idx) => {
        const speaker = m.role === "user" ? "🧑 Candidate (You)" : "🤖 AI Career Companion Agent";
        return `[${idx + 1}] ${speaker}:\n${m.content.trim()}\n`;
      })
      .join("\n" + "-".repeat(44) + "\n\n");

    const fullText = header + "\n" + body;

    navigator.clipboard.writeText(fullText).then(() => {
      setCopiedFullChat(true);
      setExportToast("✓ Complete conversation copied to clipboard!");
      setTimeout(() => {
        setCopiedFullChat(false);
        setExportToast(null);
      }, 3000);
    }).catch((err) => {
      console.error("Clipboard copy failed:", err);
      alert("Failed to copy conversation to clipboard.");
    });
  };

  // Export Conversation as High-Resolution Image (PNG)
  const handleExportImage = async () => {
    if (!chatContainerRef.current) return;
    setExporting(true);
    setShowExportDropdown(false);
    try {
      const container = chatContainerRef.current;
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#f8fafc",
        logging: false
      });
      const imgData = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = imgData;
      link.download = `Career_Companion_Chat_${new Date().toISOString().slice(0, 10)}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setExportToast("🖼️ Conversation successfully exported as Image (PNG)!");
      setTimeout(() => setExportToast(null), 3500);
    } catch (err) {
      console.error("Failed to export image:", err);
      alert("Failed to export chat as image. You can use Export as PDF or Document instead.");
    } finally {
      setExporting(false);
    }
  };

  // Export Conversation as Document (PDF, DOCX, Markdown, Text)
  const handleExportDocument = async (format) => {
    if (!messages || messages.length === 0) {
      alert("No messages to export.");
      return;
    }
    setExporting(true);
    setShowExportDropdown(false);
    try {
      const res = await api.post(
        "/api/assistant/export-conversation",
        {
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          format: format,
          target_role: resumeComponents.targetRole
        },
        { responseType: "blob" }
      );

      const mimeTypes = {
        pdf: "application/pdf",
        docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        md: "text/markdown",
        txt: "text/plain"
      };

      const blob = new Blob([res.data], { type: mimeTypes[format] || "application/octet-stream" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Career_Companion_Transcript_${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setExportToast(`📄 Conversation exported as ${format.toUpperCase()} successfully!`);
      setTimeout(() => setExportToast(null), 3500);
    } catch (err) {
      console.error(`Export ${format} failed:`, err);
      alert(`Failed to export ${format.toUpperCase()}. Please check backend connectivity.`);
    } finally {
      setExporting(false);
    }
  };

  // Print Conversation
  const handlePrintConversation = () => {
    setShowExportDropdown(false);
    window.print();
  };

  const handleClearChat = () => {
    stopSpeaking();
    setMessages([
      {
        role: "assistant",
        content: "Chat session refreshed. Ask me about role recommendations, interview preparation, or upload a document for Q&A!"
      }
    ]);
    setAttachedDoc(null);
    setDocQAData(null);
    setExpandedNlpIds({});
  };

  // Upload Document Handler (PDF, DOCX, TXT)
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDoc(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("/api/assistant/upload-doc", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setAttachedDoc(res.data);
      setDocQAData(null);
    } catch (err) {
      console.error("File upload failed:", err);
      alert(err.response?.data?.detail || "Failed to parse document. Please upload a PDF or DOCX file.");
    } finally {
      setUploadingDoc(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Feature 3: Generate Document Q&A Handler
  const handleGenerateDocQA = async () => {
    if (!attachedDoc?.extracted_text) {
      alert("Please upload a PDF or DOCX document first.");
      return;
    }
    setLoadingDocQA(true);
    try {
      const res = await api.post("/api/assistant/generate-doc-qa", {
        text: attachedDoc.extracted_text,
        filename: attachedDoc.filename,
        num_questions: 6
      });
      setDocQAData(res.data);
      setExpandedDocQAId(1);
    } catch (err) {
      console.error("Generate Doc Q&A error:", err);
      alert("Failed to generate document Q&A. Please check backend server.");
    } finally {
      setLoadingDocQA(false);
    }
  };

  // Feature 1: Fetch Role Recommendations
  const handleFetchRoleRecs = async () => {
    setLoadingRoleRecs(true);
    try {
      const res = await api.post("/api/assistant/role-recommendations");
      setRoleRecsData(res.data);
    } catch (err) {
      console.error("Role recommendations error:", err);
      alert("Failed to load role recommendations.");
    } finally {
      setLoadingRoleRecs(false);
    }
  };

  // Feature 2: Fetch Interview Preparation Pack
  const handleFetchInterviewPrep = async (roleToPrep) => {
    const role = (roleToPrep || targetPrepRole || resumeComponents.targetRole || "Backend Engineering Intern").trim();
    setLoadingPrep(true);
    try {
      const res = await api.post("/api/assistant/generate-interview-prep", { role });
      setInterviewPrepData(res.data);
      setTargetPrepRole(role);
    } catch (err) {
      console.error("Interview prep error:", err);
      alert("Failed to generate interview preparation pack.");
    } finally {
      setLoadingPrep(false);
    }
  };

  // Send Message Handler (Grounded in Extracted Resume & Document Context)
  const handleSendMessage = async (msgText) => {
    if (isListening) {
      try { recognitionRef.current?.stop(); } catch (e) {}
      setIsListening(false);
    }

    const textToSend = (msgText || inputMessage).trim();
    if ((!textToSend && !attachedDoc) || loading || uploadingDoc) return;

    const currentDoc = attachedDoc;
    const finalContent = textToSend || (currentDoc ? `Please analyze and answer questions on my attached document: "${currentDoc.filename}"` : "");

    const userMsg = {
      role: "user",
      content: finalContent,
      attached_filename: currentDoc?.filename || null
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputMessage("");
    setSpeechTranscript("");
    setLoading(true);
    setAttachedDoc(null);
    setDocQAData(null);

    try {
      const res = await api.post("/api/assistant/chat", {
        messages: updatedMessages.map((m) => ({
          role: m.role,
          content: m.content,
          attached_filename: m.attached_filename
        })),
        attached_doc: currentDoc?.extracted_text || null,
        attached_filename: currentDoc?.filename || null,
        mode: responseMode
      });

      const newAssistantIdx = updatedMessages.length;
      setMessages([
        ...updatedMessages,
        {
          role: "assistant",
          content: res.data.response,
          nlp_insights: res.data.nlp_insights
        }
      ]);
      setExpandedNlpIds((prev) => ({
        ...prev,
        [newAssistantIdx]: true
      }));

      if (autoSpeakEnabled && res.data.response) {
        speakText(res.data.response, newAssistantIdx);
      }

      if (res.data.suggested_actions && res.data.suggested_actions.length > 0) {
        setQuickPrompts(res.data.suggested_actions);
      }
    } catch (err) {
      console.error("Assistant chat error:", err);
      setMessages([
        ...updatedMessages,
        {
          role: "assistant",
          content: "I encountered an error connecting to the AI career companion agent. Please verify the backend is running."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Run Workbench NLP Diagnostics
  const runWorkbenchAnalysis = async (textToAnalyze) => {
    const t = (textToAnalyze !== undefined ? textToAnalyze : workbenchText).trim();
    if (!t) return;
    setWorkbenchLoading(true);
    try {
      const res = await api.post("/api/assistant/nlp-workbench", { text: t });
      setWorkbenchData(res.data);
    } catch (err) {
      console.error("Workbench analysis failed:", err);
      alert("Failed to analyze text.");
    } finally {
      setWorkbenchLoading(false);
    }
  };

  return (
    <Layout
      title="AI Career Companion Agent"
      subtitle="AI-Powered Preparation Agent for Internship Matching and Interview Preparation grounded in your extracted resume data"
    >
      {/* View Switcher Navigation Tabs */}
      <div className="assistant-mode-tabs-bar">
        <button
          type="button"
          onClick={() => setActiveView("chat")}
          className={`assistant-tab-btn ${activeView === "chat" ? "active" : ""}`}
        >
          <span className="tab-icon">💬</span>
          <span className="tab-label">AI Companion Chat & Q&A</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveView("prep_studio");
            if (!interviewPrepData) handleFetchInterviewPrep(resumeComponents.targetRole);
          }}
          className={`assistant-tab-btn ${activeView === "prep_studio" ? "active" : ""}`}
        >
          <span className="tab-icon">🎯</span>
          <span className="tab-label">Interview Preparation Studio</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveView("role_recs");
            if (!roleRecsData) handleFetchRoleRecs();
          }}
          className={`assistant-tab-btn ${activeView === "role_recs" ? "active" : ""}`}
        >
          <span className="tab-icon">💼</span>
          <span className="tab-label">Role & Internship Recommendations</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveView("workbench");
            if (!workbenchData) runWorkbenchAnalysis();
          }}
          className={`assistant-tab-btn ${activeView === "workbench" ? "active" : ""}`}
        >
          <span className="tab-icon">🔬</span>
          <span className="tab-label">Live NLP Workbench</span>
        </button>
      </div>

      {/* ============================================================
          VIEW 1: INTERVIEW PREPARATION STUDIO
          ============================================================ */}
      {activeView === "prep_studio" && (
        <div className="prep-studio-wrapper panel-box">
          <div className="prep-studio-header">
            <div className="prep-header-left">
              <span className="prep-badge-icon">🎯</span>
              <div>
                <h3>Role-Specific Interview Preparation Studio</h3>
                <p>Generate role-tailored technical questions, HR behavioral questions, STAR answer guidance, and 4-week roadmaps.</p>
              </div>
            </div>

            <div className="prep-role-selector-form">
              <input
                type="text"
                className="prep-role-input"
                value={targetPrepRole}
                onChange={(e) => setTargetPrepRole(e.target.value)}
                placeholder="Target Role (e.g. Backend Engineering Intern)"
              />
              <button
                type="button"
                className="btn-gen-prep"
                onClick={() => handleFetchInterviewPrep(targetPrepRole)}
                disabled={loadingPrep}
              >
                {loadingPrep ? "Generating..." : "⚡ Generate Interview Pack"}
              </button>
            </div>
          </div>

          {loadingPrep ? (
            <div className="prep-loading-state">
              <div className="auth-spinner"></div>
              <p>Crafting role-specific questions and preparation roadmap for <strong>{targetPrepRole}</strong>...</p>
            </div>
          ) : interviewPrepData ? (
            <div className="prep-content-body">
              {/* Role Overview */}
              <div className="prep-overview-alert">
                <strong>🎯 Preparation Target: {interviewPrepData.role}</strong>
                <p>{interviewPrepData.overview}</p>
              </div>

              {/* Prep Tabs */}
              <div className="prep-subtabs-row">
                <button
                  type="button"
                  className={`prep-subtab ${prepActiveTab === "technical" ? "active" : ""}`}
                  onClick={() => setPrepActiveTab("technical")}
                >
                  ⚡ Technical Questions ({interviewPrepData.technical_questions?.length || 0})
                </button>
                <button
                  type="button"
                  className={`prep-subtab ${prepActiveTab === "hr" ? "active" : ""}`}
                  onClick={() => setPrepActiveTab("hr")}
                >
                  👥 HR & Behavioral Questions ({interviewPrepData.hr_questions?.length || 0})
                </button>
                <button
                  type="button"
                  className={`prep-subtab ${prepActiveTab === "roadmap" ? "active" : ""}`}
                  onClick={() => setPrepActiveTab("roadmap")}
                >
                  🗺️ 4-Week Prep Roadmap ({interviewPrepData.roadmap?.length || 0} Phases)
                </button>
                <button
                  type="button"
                  className={`prep-subtab ${prepActiveTab === "topics" ? "active" : ""}`}
                  onClick={() => setPrepActiveTab("topics")}
                >
                  📚 Priority Topics & Learning Path
                </button>
              </div>

              {/* Subtab 1: Technical Questions */}
              {prepActiveTab === "technical" && (
                <div className="prep-questions-grid">
                  {interviewPrepData.technical_questions?.map((q, idx) => (
                    <div key={q.id || idx} className="prep-qa-card">
                      <div className="prep-qa-header">
                        <span className="prep-q-num">Q{idx + 1}</span>
                        <span className="prep-topic-tag">{q.topic || "Technical"}</span>
                        <button
                          type="button"
                          className="btn-prep-ask-chat"
                          onClick={() => {
                            setActiveView("chat");
                            handleSendMessage(`Explain the technical interview question: "${q.question}" and how I should answer it.`);
                          }}
                          title="Ask AI Companion about this question"
                        >
                          💬 Ask in Chat
                        </button>
                      </div>
                      <h4 className="prep-question-text">{q.question}</h4>
                      <div className="prep-guidance-box">
                        <strong>💡 Answer Guidance:</strong>
                        <p>{q.answer_guidance}</p>
                      </div>
                      {q.sample_answer && (
                        <div className="prep-sample-answer-box">
                          <strong>⭐ Model Sample Answer:</strong>
                          <p>{q.sample_answer}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Subtab 2: HR & Behavioral Questions */}
              {prepActiveTab === "hr" && (
                <div className="prep-questions-grid">
                  {interviewPrepData.hr_questions?.map((q, idx) => (
                    <div key={q.id || idx} className="prep-qa-card hr-card">
                      <div className="prep-qa-header">
                        <span className="prep-q-num hr-num">HR-{idx + 1}</span>
                        <span className="prep-topic-tag hr-tag">{q.focus_area || "Behavioral"}</span>
                        <button
                          type="button"
                          className="btn-prep-ask-chat"
                          onClick={() => {
                            setActiveView("chat");
                            handleSendMessage(`How should I answer the HR question "${q.question}" using the STAR method for my resume?`);
                          }}
                        >
                          💬 Ask in Chat
                        </button>
                      </div>
                      <h4 className="prep-question-text">{q.question}</h4>
                      <div className="prep-guidance-box">
                        <strong>🎯 Guidance:</strong>
                        <p>{q.answer_guidance}</p>
                      </div>
                      {q.star_tip && (
                        <div className="prep-star-box">
                          <strong>⭐ STAR Framework Tip:</strong>
                          <p>{q.star_tip}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Subtab 3: 4-Week Roadmap */}
              {prepActiveTab === "roadmap" && (
                <div className="prep-roadmap-timeline">
                  {interviewPrepData.roadmap?.map((phase, idx) => (
                    <div key={idx} className="roadmap-phase-card">
                      <div className="phase-timeline-badge">
                        <span>{phase.phase}</span>
                        <small>{phase.duration}</small>
                      </div>
                      <div className="phase-content">
                        <h4>{phase.title}</h4>
                        <div className="phase-topics-row">
                          <strong>Key Topics:</strong>
                          {phase.topics?.map((top, ti) => (
                            <span key={ti} className="phase-topic-pill">{top}</span>
                          ))}
                        </div>
                        <div className="phase-actions-row">
                          <strong>Milestones:</strong>
                          <ul>
                            {phase.action_items?.map((item, ai) => (
                              <li key={ai}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Subtab 4: Priority Topics & Learning Path */}
              {prepActiveTab === "topics" && (
                <div className="prep-topics-layout">
                  <div className="topics-col">
                    <h4>🔥 Critical Domain Concepts to Master</h4>
                    {interviewPrepData.priority_topics?.map((item, i) => (
                      <div key={i} className="priority-topic-card">
                        <div className="topic-card-head">
                          <strong>{item.topic}</strong>
                          <span className={`importance-tag imp-${item.importance?.toLowerCase()}`}>
                            {item.importance}
                          </span>
                        </div>
                        <p>{item.description}</p>
                      </div>
                    ))}
                  </div>

                  <div className="learning-col">
                    <h4>🚀 Curated Learning Path & Best Practices</h4>
                    <div className="learning-path-list">
                      {interviewPrepData.learning_path_recommendations?.map((rec, i) => (
                        <div key={i} className="learning-step-card">
                          <span className="step-number">{i + 1}</span>
                          <p>{rec}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="prep-empty-state">
              <span className="empty-icon">🎯</span>
              <h4>Select a Role to Begin Preparation</h4>
              <p>Enter your target internship role above and click <strong>Generate Interview Pack</strong>.</p>
            </div>
          )}
        </div>
      )}

      {/* ============================================================
          VIEW 2: RESUME-BASED ROLE & INTERNSHIP RECOMMENDATIONS
          ============================================================ */}
      {activeView === "role_recs" && (
        <div className="role-recs-wrapper panel-box">
          <div className="prep-studio-header">
            <div className="prep-header-left">
              <span className="prep-badge-icon">💼</span>
              <div>
                <h3>Resume-Based Role & Internship Recommendations</h3>
                <p>Personalized role matching powered by your actual extracted skills, projects, and work history.</p>
              </div>
            </div>

            <button
              type="button"
              className="btn-gen-prep"
              onClick={handleFetchRoleRecs}
              disabled={loadingRoleRecs}
            >
              {loadingRoleRecs ? "Analyzing..." : "🔄 Refresh Recommendations"}
            </button>
          </div>

          {loadingRoleRecs ? (
            <div className="prep-loading-state">
              <div className="auth-spinner"></div>
              <p>Analyzing candidate resume data and evaluating internship compatibility...</p>
            </div>
          ) : roleRecsData ? (
            <div className="role-recs-body">
              {/* Strongest Skills Row */}
              <div className="strongest-skills-section">
                <h4>⭐ Your Strongest Technical Skills (Verified from Resume)</h4>
                <div className="strongest-skills-grid">
                  {roleRecsData.strongest_skills?.map((s, idx) => (
                    <div key={idx} className="strong-skill-card">
                      <div className="skill-card-top">
                        <span className="strong-skill-name">{s.skill}</span>
                        <span className="skill-prof-pill">{s.proficiency}</span>
                      </div>
                      <small className="skill-cat-sub">{s.category}</small>
                      <p className="skill-evidence">{s.evidence}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Roles Grid */}
              <div className="recommended-roles-section">
                <h4>🎯 Top Suitable Roles for Your Profile</h4>
                <div className="recommended-roles-grid">
                  {roleRecsData.recommended_roles?.map((r, idx) => (
                    <div key={idx} className="role-match-card">
                      <div className="role-card-top">
                        <div>
                          <span className="role-badge-pill">{r.badge || "High Fit"}</span>
                          <h3>{r.role}</h3>
                        </div>
                        <div className="role-match-circle">
                          <span className="score-num">{r.match_score}%</span>
                          <small>Match</small>
                        </div>
                      </div>

                      <p className="role-rationale">{r.rationale}</p>

                      <div className="role-skills-wrap">
                        <small>Key Matching Tech:</small>
                        <div className="chips-row">
                          {r.key_matching_skills?.map((sk, si) => (
                            <span key={si} className="role-tech-pill">{sk}</span>
                          ))}
                        </div>
                      </div>

                      <div className="role-card-actions">
                        <button
                          type="button"
                          className="btn-role-prep"
                          onClick={() => {
                            setTargetPrepRole(r.role);
                            setActiveView("prep_studio");
                            handleFetchInterviewPrep(r.role);
                          }}
                        >
                          🎯 Prepare for this Role →
                        </button>
                        <button
                          type="button"
                          className="btn-role-chat"
                          onClick={() => {
                            setActiveView("chat");
                            handleSendMessage(`Tell me how to apply for ${r.role} roles with my resume.`);
                          }}
                        >
                          💬 Inquire
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Suitable Internships */}
              {roleRecsData.suitable_internships?.length > 0 && (
                <div className="suitable-internships-section">
                  <h4>💼 Suitable Internship Openings</h4>
                  <div className="suitable-internships-list">
                    {roleRecsData.suitable_internships.map((intn, idx) => (
                      <div key={idx} className="internship-item-card">
                        <div>
                          <strong>{intn.title}</strong>
                          <span className="internship-domain-pill">{intn.domain}</span>
                          <p className="internship-adv">💡 Advantage: {intn.candidate_advantages}</p>
                        </div>
                        <button
                          type="button"
                          className="btn-apply-direct"
                          onClick={() => {
                            setActiveView("chat");
                            handleSendMessage(`Give me sample interview questions for ${intn.title} in ${intn.domain}`);
                          }}
                        >
                          Interview Prep →
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="prep-empty-state">
              <span className="empty-icon">💼</span>
              <h4>Ready to Match Roles</h4>
              <p>Click <strong>Refresh Recommendations</strong> to evaluate your profile against current tech roles.</p>
            </div>
          )}
        </div>
      )}

      {/* ============================================================
          VIEW 3: LIVE NLP WORKBENCH
          ============================================================ */}
      {activeView === "workbench" && (
        <div className="nlp-workbench-container panel-box">
          <div className="nlp-workbench-grid">
            <div className="nlp-workbench-input-pane">
              <div className="workbench-pane-header">
                <strong>📝 Input Text for Linguistic Inspection</strong>
                <span className="nlp-live-pill">NLP Engine v2.0</span>
              </div>
              <textarea
                className="nlp-workbench-textarea"
                rows={7}
                value={workbenchText}
                onChange={(e) => setWorkbenchText(e.target.value)}
                placeholder="Type or paste any text to run deep NLP diagnostics..."
              />
              <button
                type="button"
                className="btn-primary"
                onClick={() => runWorkbenchAnalysis()}
                disabled={workbenchLoading}
              >
                {workbenchLoading ? "Analyzing..." : "🔍 Run NLP Analysis"}
              </button>
            </div>

            <div className="nlp-workbench-results-pane">
              {workbenchLoading ? (
                <div className="workbench-loading-state">
                  <div className="auth-spinner" />
                  <p>Running multi-tier NLP parsing, entity extraction & verb scoring...</p>
                </div>
              ) : workbenchData ? (
                <div className="workbench-results-scroll">
                  {/* Summary Stat Strip */}
                  <div className="nlp-summary-strip">
                    <div className="summary-stat-box">
                      <small>Classified Intent & Focus</small>
                      <strong>{workbenchData.intent?.display || "Professional Tech Query"}</strong>
                      <div className="confidence-meter-bar">
                        <div
                          className="confidence-fill"
                          style={{ width: `${workbenchData.intent?.confidence_pct || 75}%` }}
                        />
                      </div>
                      <span className="sub-stat">Confidence: {workbenchData.intent?.confidence_pct || 75}%</span>
                    </div>

                    <div className="summary-stat-box">
                      <small>Tone & Linguistic Sentiment</small>
                      <strong>{workbenchData.sentiment_and_tone?.tone || "Objective & Analytical"}</strong>
                      <span className="sub-stat">
                        Sentiment: <strong>{workbenchData.sentiment_and_tone?.sentiment || "Neutral"}</strong> (Polarity: {workbenchData.sentiment_and_tone?.polarity || 0})
                      </span>
                    </div>
                  </div>

                  {/* ATS & Impact Mini Grid */}
                  <div className="ats-mini-grid">
                    <div className="ats-metric">
                      <small>ATS Impact</small>
                      <strong>{workbenchData.document_diagnostics?.ats_readiness_score || workbenchData.verb_strength?.impact_score || 76}%</strong>
                    </div>
                    <div className="ats-metric">
                      <small>Power Verbs</small>
                      <strong>{workbenchData.verb_strength?.power_verbs_count || 0} Found</strong>
                    </div>
                    <div className="ats-metric">
                      <small>Tech Entities</small>
                      <strong>{workbenchData.entities?.skills?.length || 0} Skills</strong>
                    </div>
                    <div className="ats-metric">
                      <small>Read Time</small>
                      <strong>{workbenchData.readability?.reading_time_sec || 5}s</strong>
                    </div>
                  </div>

                  {/* Power Action Verbs Breakdown */}
                  <div className="nlp-card-block" style={{ marginTop: "14px" }}>
                    <div className="nlp-card-header">
                      <strong>⚡ Action Verb & Impact Strength</strong>
                      <span className="skill-prof-pill" style={{ fontSize: "11px" }}>
                        {workbenchData.verb_strength?.impact_level || "Active Verbs Detected"}
                      </span>
                    </div>

                    {workbenchData.verb_strength?.weak_verbs?.length > 0 && (
                      <div className="weak-verbs-flag-box">
                        <span className="flag-label">⚠️ Passive / Weak Phrasing to Upgrade:</span>
                        {workbenchData.verb_strength.weak_verbs.map((wv, i) => (
                          <div key={i} className="weak-verb-row">
                            <span className="weak-verb-token">{wv.phrase}</span>
                            <span>→ Recommend:</span>
                            <div className="power-suggestions">
                              {wv.recommended_power_verbs?.map((sugg, j) => (
                                <button
                                  key={j}
                                  type="button"
                                  className="power-verb-btn"
                                  onClick={() => setWorkbenchText(workbenchText.replace(new RegExp(wv.phrase, "i"), sugg))}
                                >
                                  {sugg}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {workbenchData.verb_strength?.power_verbs?.length > 0 && (
                      <div className="power-verbs-found-box">
                        <span className="success-label">✓ High-Impact Verbs Detected:</span>
                        <div className="power-verbs-chips-wrap">
                          {workbenchData.verb_strength.power_verbs.map((pv, i) => (
                            <span key={i} className="power-verb-pill" title={pv.impact}>
                              ⚡ <strong>{pv.verb}</strong>: {pv.impact}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Extracted Entities */}
                  {workbenchData.entities?.skills?.length > 0 && (
                    <div className="nlp-card-block">
                      <div className="nlp-card-header">
                        <strong>🏷️ Detected Technical Entities & Skills</strong>
                        <small style={{ color: "#64748b" }}>{workbenchData.entities.skills.length} identified</small>
                      </div>
                      <div className="chips-row">
                        {workbenchData.entities.skills.map((sk, i) => (
                          <span key={i} className="role-tech-pill" style={{ background: "#e0e7ff", color: "#3730a3" }}>
                            💻 {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Keyphrases & Salience */}
                  {workbenchData.keyphrases?.length > 0 && (
                    <div className="nlp-card-block">
                      <div className="nlp-card-header">
                        <strong>🔑 Keyphrase Salience Breakdown</strong>
                        <small style={{ color: "#64748b" }}>TF-IDF & N-Gram Weights</small>
                      </div>
                      <div className="keyphrases-cloud-wrap">
                        {workbenchData.keyphrases.map((kp, i) => (
                          <span key={i} className={`keyphrase-chip kp-${kp.category || "general"}`}>
                            {kp.phrase} <span className="kp-weight">({kp.score})</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Rewrite Action Banner */}
                  <div className="nlp-card-block" style={{ background: "linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)", borderColor: "#c7d2fe" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                      <div>
                        <strong style={{ color: "#312e81", display: "block", marginBottom: "3px" }}>
                          ✨ Want to polish or rewrite this bullet point?
                        </strong>
                        <small style={{ color: "#4338ca" }}>
                          Send this exact text to the AI Companion Chat to get 3 ATS-optimized revisions with quantifiable metrics.
                        </small>
                      </div>
                      <button
                        type="button"
                        className="btn-chat-send"
                        style={{ padding: "8px 16px", fontSize: "12px" }}
                        onClick={() => {
                          setActiveView("chat");
                          handleSendMessage(
                            `Please review and rewrite this bullet point for my resume to make it more impactful for a Software Engineering Intern role:\n"${workbenchText}"`
                          );
                        }}
                      >
                        💬 Rewrite in AI Chat →
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="workbench-empty-state">
                  <span className="empty-icon">🔬</span>
                  <h4>Ready for NLP Analysis</h4>
                  <p>Click "Run NLP Analysis" to inspect the linguistic breakdown.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          VIEW 4: CHAT & DOCUMENT Q&A (DEFAULT CORE VIEW)
          ============================================================ */}
      {activeView === "chat" && (
        <div className="chat-layout-wrapper panel-box">
          {/* Active Resume Grounding Banner */}
          <div className="resume-grounding-banner">
            <div className="grounding-left">
              <span className="grounding-shield">🛡️</span>
              <div>
                <div className="grounding-title">
                  <strong>Active Resume Context Grounding Active</strong>
                  <span className="grounding-status-pill">✓ Linked to AI Agent</span>
                </div>
                <div className="grounding-meta">
                  <span>📄 {resumeComponents.filename || "Candidate Resume"}</span>
                  <span>⚡ {resumeComponents.skills.length} Extracted Skills</span>
                  <span>🚀 {resumeComponents.projects.length} Projects</span>
                  <span>🎯 Target: {resumeComponents.targetRole}</span>
                </div>
              </div>
            </div>
            <div className="grounding-actions">
              <button
                type="button"
                className="btn-grounding-action"
                onClick={() => {
                  setActiveView("role_recs");
                  if (!roleRecsData) handleFetchRoleRecs();
                }}
              >
                💼 Role Matches →
              </button>
              <button
                type="button"
                className="btn-grounding-action"
                onClick={() => {
                  setActiveView("prep_studio");
                  if (!interviewPrepData) handleFetchInterviewPrep(resumeComponents.targetRole);
                }}
              >
                🎯 Interview Prep →
              </button>
            </div>
          </div>

          {/* Core Feature Shortcuts Bar */}
          <div className="career-features-action-bar">
            <div className="features-group">
              <span className="features-group-label">💼 1. Role Recommendation:</span>
              <button
                type="button"
                className="btn-feature-chip"
                onClick={() => handleSendMessage("Which role can I apply for?")}
              >
                🎯 Which role can I apply for?
              </button>
              <button
                type="button"
                className="btn-feature-chip"
                onClick={() => handleSendMessage("Which internship is suitable for my skills?")}
              >
                💼 Which internship is suitable for my skills?
              </button>
              <button
                type="button"
                className="btn-feature-chip"
                onClick={() => handleSendMessage("What are my strongest technical skills?")}
              >
                ⭐ What are my strongest technical skills?
              </button>
            </div>

            <div className="features-group">
              <span className="features-group-label">🎯 2. Interview Prep:</span>
              <button
                type="button"
                className="btn-feature-chip"
                onClick={() => handleSendMessage(`Generate role-specific interview questions with technical and HR guidance for ${resumeComponents.targetRole}`)}
              >
                📋 Technical & HR Questions
              </button>
              <button
                type="button"
                className="btn-feature-chip"
                onClick={() => handleSendMessage(`Give me a 4-week interview preparation roadmap and priority topics for ${resumeComponents.targetRole}`)}
              >
                🗺️ 4-Week Roadmap
              </button>
            </div>
          </div>

          {/* Chat Header Bar */}
          <div className="chat-header-bar">
            <div className="chat-mentor-info">
              <div className="mentor-avatar-badge">🤖</div>
              <div>
                <div className="chat-title-row">
                  <strong>AI Career Companion Agent</strong>
                  <span className="nlp-live-pill">NLP & Resume Grounded</span>
                  {isSpeaking && <span className="mentor-speaking-pill">🔊 Speaking...</span>}
                  {isListening && <span className="mic-active-pill">🎙️ Listening...</span>}
                </div>
                <small>Internship Matching & Interview Preparation • Silent Mode by Default (Click 🔊 to listen)</small>
              </div>
            </div>

            <div className="chat-header-actions">
              <div className="mode-toggle-group" title="Control response brevity">
                <button
                  type="button"
                  className={`mode-toggle-btn ${responseMode === "minimal" ? "active minimal" : ""}`}
                  onClick={() => setResponseMode("minimal")}
                  title="Minimal & direct responses (essential points only)"
                >
                  ⚡ Minimal
                </button>
                <button
                  type="button"
                  className={`mode-toggle-btn ${responseMode === "detailed" ? "active" : ""}`}
                  onClick={() => setResponseMode("detailed")}
                  title="Detailed responses with comprehensive breakdowns"
                >
                  📄 Detailed
                </button>
              </div>

              <button
                type="button"
                onClick={handleCopyCompleteConversation}
                className={`btn-sm btn-copy-chat ${copiedFullChat ? "copied" : ""}`}
                title="Copy entire formatted conversation to clipboard"
              >
                {copiedFullChat ? "✓ Copied!" : "📋 Copy Chat"}
              </button>

              <div className="export-dropdown-wrapper">
                <button
                  type="button"
                  onClick={() => setShowExportDropdown(!showExportDropdown)}
                  className={`btn-sm btn-export-chat ${showExportDropdown ? "active" : ""}`}
                  disabled={exporting}
                  title="Export conversation as PDF, Image, Word Document, or Markdown"
                >
                  {exporting ? "⏳ Exporting..." : "📥 Export Chat ▾"}
                </button>

                {showExportDropdown && (
                  <div className="export-menu-dropdown">
                    <div className="export-menu-header">
                      <strong>Export Conversation</strong>
                      <small>Download formatted session transcript</small>
                    </div>

                    <button
                      type="button"
                      className="export-item-btn"
                      onClick={() => handleExportDocument("pdf")}
                      disabled={exporting}
                    >
                      <span className="export-item-icon">📄</span>
                      <div className="export-item-text">
                        <strong>Export as PDF (.pdf)</strong>
                        <small>Branded executive PDF transcript</small>
                      </div>
                    </button>

                    <button
                      type="button"
                      className="export-item-btn"
                      onClick={handleExportImage}
                      disabled={exporting}
                    >
                      <span className="export-item-icon">🖼️</span>
                      <div className="export-item-text">
                        <strong>Export as Image (.png)</strong>
                        <small>High-res full conversation graphic</small>
                      </div>
                    </button>

                    <button
                      type="button"
                      className="export-item-btn"
                      onClick={() => handleExportDocument("docx")}
                      disabled={exporting}
                    >
                      <span className="export-item-icon">📝</span>
                      <div className="export-item-text">
                        <strong>Export as Word Document (.docx)</strong>
                        <small>Editable Microsoft Word transcript</small>
                      </div>
                    </button>

                    <button
                      type="button"
                      className="export-item-btn"
                      onClick={() => handleExportDocument("md")}
                      disabled={exporting}
                    >
                      <span className="export-item-icon">📑</span>
                      <div className="export-item-text">
                        <strong>Export as Markdown (.md)</strong>
                        <small>Clean Markdown formatted file</small>
                      </div>
                    </button>

                    <div className="export-menu-divider" />

                    <button
                      type="button"
                      className="export-item-btn"
                      onClick={handlePrintConversation}
                    >
                      <span className="export-item-icon">🖨️</span>
                      <div className="export-item-text">
                        <strong>Print / Save as PDF</strong>
                        <small>Browser native print dialog</small>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowChatHistory(!showChatHistory)}
                className={`btn-sm btn-outline ${showChatHistory ? "active" : ""}`}
              >
                📜 History ({messages.filter((m) => m.role === "user").length})
              </button>
              <button
                type="button"
                onClick={handleClearChat}
                className="btn-sm btn-outline"
              >
                + New Chat
              </button>
              <button
                type="button"
                onClick={() => {
                  if (isSpeaking) stopSpeaking();
                  setAutoSpeakEnabled(!autoSpeakEnabled);
                }}
                className={`btn-sm btn-voice-toggle ${autoSpeakEnabled ? "active" : ""}`}
              >
                {autoSpeakEnabled ? "🔊 Voice: ON" : "🔈 Voice: Manual (Click 🔊)"}
              </button>
              <button
                type="button"
                onClick={() => setShowNlpInspector(!showNlpInspector)}
                className={`btn-sm btn-nlp-toggle ${showNlpInspector ? "active" : ""}`}
              >
                🧠 NLP: {showNlpInspector ? "ON" : "OFF"}
              </button>
            </div>
          </div>

          {/* Chat Messages Body */}
          <div className="chat-messages-container" ref={chatContainerRef}>
            {messages.map((m, idx) => {
              const isUser = m.role === "user";
              const isCurrentlySpeaking = isSpeaking && currentlySpeakingIdx === idx;

              return (
                <div
                  key={idx}
                  className={`chat-bubble-row ${isUser ? "user-bubble-row" : "assistant-bubble-row"}`}
                >
                  {!isUser && <div className="bubble-avatar">🤖</div>}
                  <div className={`chat-bubble ${isUser ? "user-bubble" : "assistant-bubble"}`}>
                    {m.attached_filename && (
                      <div className="msg-attached-doc-badge">
                        📄 Referenced Document: <strong>{m.attached_filename}</strong>
                      </div>
                    )}

                    <div className="markdown-content">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h3: ({ node, children, ...props }) => (
                            <h3 className="bubble-section-h3" {...props}>{children}</h3>
                          ),
                          h4: ({ node, children, ...props }) => {
                            const rawText = String(children || "");
                            const isResumeHeader = rawText.includes("|") || rawText.includes("💼");
                            return isResumeHeader ? (
                              <div className="resume-entry-header">
                                <h4 {...props}>{children}</h4>
                                <button
                                  type="button"
                                  className="btn-copy-resume-entry"
                                  onClick={(e) => {
                                    navigator.clipboard.writeText(rawText.replace("💼", "").trim());
                                    const btn = e.currentTarget;
                                    btn.innerText = "✓ Copied Title!";
                                    setTimeout(() => { btn.innerText = "📋 Copy Entry"; }, 2000);
                                  }}
                                  title="Copy this section header"
                                >
                                  📋 Copy Entry
                                </button>
                              </div>
                            ) : (
                              <h4 className="bubble-section-h4" {...props}>{children}</h4>
                            );
                          },
                          ol: ({ node, children, ...props }) => (
                            <ol className="bubble-checklist-ol" {...props}>{children}</ol>
                          ),
                          li: ({ node, checked, children, ...props }) => {
                            if (checked !== null && checked !== undefined) {
                              return (
                                <li className={`task-list-card ${checked ? "is-checked" : "is-unchecked"}`} {...props}>
                                  <span className="task-custom-checkbox">
                                    {checked ? "✓" : ""}
                                  </span>
                                  <span className="task-content-body">{children}</span>
                                </li>
                              );
                            }
                            return <li {...props}>{children}</li>;
                          },
                          pre: ({ node, children, ...props }) => (
                            <pre className="bubble-code-pre" {...props}>{children}</pre>
                          ),
                          code: ({ node, inline, className, children, ...props }) => (
                            <code className={inline ? "bubble-inline-code" : "bubble-code-content"} {...props}>
                              {children}
                            </code>
                          )
                        }}
                      >
                        {isUser ? m.content : formatAssistantMarkdown(m.content)}
                      </ReactMarkdown>
                    </div>

                    {!isUser && (
                      <div className="bubble-actions-strip">
                        <button
                          type="button"
                          className={`btn-bubble-listen ${isCurrentlySpeaking ? "speaking" : ""}`}
                          onClick={() => {
                            if (isCurrentlySpeaking) stopSpeaking();
                            else speakText(m.content, idx);
                          }}
                          title={isCurrentlySpeaking ? "Stop speech audio" : "Read response aloud"}
                        >
                          {isCurrentlySpeaking ? (
                            <>
                              <span className="audio-wave-bars">
                                <span className="bar" />
                                <span className="bar" />
                                <span className="bar" />
                              </span>
                              <span>⏹️ Stop Audio</span>
                            </>
                          ) : (
                            <>
                              <span>🔊 Listen Aloud</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                  {isUser && <div className="bubble-avatar user-avatar">👤</div>}
                </div>
              );
            })}

            {loading && (
              <div className="chat-bubble-row assistant-bubble-row">
                <div className="bubble-avatar">🤖</div>
                <div className="chat-bubble assistant-bubble loading-bubble">
                  <div className="typing-dots">
                    <span>.</span><span>.</span><span>.</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Attached Document Preview Strip & Document Q&A Section */}
          {attachedDoc && (
            <div className="attached-file-preview-strip">
              <div className="attached-file-info">
                <span className="att-file-icon">📄</span>
                <div>
                  <strong>{attachedDoc.filename}</strong>
                  <div className="att-file-meta-row">
                    <small>{(attachedDoc.file_size / 1024).toFixed(1)} KB • Context Ready</small>
                    <button
                      type="button"
                      className="btn-send-attached-doc-pill"
                      onClick={() => handleSendMessage(`Please analyze my uploaded document "${attachedDoc.filename}". Summarize the key qualifications, extracted technical skills, and how they match my target roles.`)}
                      disabled={loading}
                      title="Send this file into the AI chat for full analysis"
                    >
                      {loading ? "⏳ Analyzing..." : "🚀 Send File to AI Chat"}
                    </button>
                    <button
                      type="button"
                      className="btn-gen-doc-qa-pill"
                      onClick={handleGenerateDocQA}
                      disabled={loadingDocQA}
                    >
                      {loadingDocQA ? "Generating Q&A..." : "✨ Generate Q&A Pack"}
                    </button>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setAttachedDoc(null); setDocQAData(null); }}
                className="btn-remove-attachment"
                title="Remove document"
              >
                ✕
              </button>
            </div>
          )}

          {/* Generated Document Q&A Accordion Panel */}
          {docQAData && (
            <div className="doc-qa-panel-card">
              <div className="doc-qa-header">
                <div className="doc-qa-title">
                  <span className="doc-qa-icon">📄</span>
                  <div>
                    <strong>Document Q&A: {docQAData.filename}</strong>
                    <p>{docQAData.summary}</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close-qa"
                  onClick={() => setDocQAData(null)}
                >
                  ✕
                </button>
              </div>

              <div className="doc-qa-list">
                {docQAData.qa_pairs?.map((qa) => {
                  const isExpanded = expandedDocQAId === qa.id;
                  return (
                    <div key={qa.id} className={`doc-qa-item ${isExpanded ? "expanded" : ""}`}>
                      <div
                        className="doc-qa-q-row"
                        onClick={() => setExpandedDocQAId(isExpanded ? null : qa.id)}
                      >
                        <span className="qa-num">Q{qa.id}</span>
                        <span className="qa-q-text">{qa.question}</span>
                        <span className="qa-toggle-arrow">{isExpanded ? "▲" : "▼"}</span>
                      </div>
                      {isExpanded && (
                        <div className="doc-qa-answer-body">
                          <p className="qa-ans">{qa.answer}</p>
                          {qa.source_excerpt && (
                            <div className="qa-source">
                              <small>📌 Source Excerpt: "{qa.source_excerpt}"</small>
                            </div>
                          )}
                          <button
                            type="button"
                            className="btn-qa-ask-chat"
                            onClick={() => handleSendMessage(qa.question)}
                          >
                            💬 Ask Chatbot this Question →
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Input Bar */}
                    {/* Floating Export / Copy Confirmation Toast */}
          {exportToast && (
            <div className="export-floating-toast">
              <span className="toast-icon">✨</span>
              <span>{exportToast}</span>
              <button
                type="button"
                className="btn-toast-close"
                onClick={() => setExportToast(null)}
              >
                ✕
              </button>
            </div>
          )}

          <div className="chat-input-bar">
            {/* Hidden Document File Input */}
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: "none" }}
              accept=".pdf,.docx,.doc,.txt"
              onChange={handleFileUpload}
            />

            <div className="chat-input-tools">
              <button
                type="button"
                className="btn-chat-attach"
                onClick={() => fileInputRef.current?.click()}
                title="Upload PDF or DOCX Document for Q&A"
                disabled={uploadingDoc}
              >
                {uploadingDoc ? "⏳" : "📎"}
              </button>

              <button
                type="button"
                className={`btn-chat-mic ${isListening ? "listening" : ""}`}
                onClick={toggleListening}
                title={isListening ? "Listening... Click to stop" : "Speak via Microphone"}
              >
                🎙️
              </button>
            </div>

            <div className="chat-input-field-wrap">
              <input
                type="text"
                className="chat-text-input"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={
                  isListening
                    ? "Listening to speech... Speak now..."
                    : attachedDoc
                    ? `📎 File Attached: "${attachedDoc.filename}" — Click 'Send File' or type custom questions...`
                    : "Ask about suitable roles, interview questions, roadmap, or upload a document for Q&A..."
                }
                disabled={loading}
              />
            </div>

            <button
              type="button"
              className="btn-chat-send"
              onClick={() => handleSendMessage()}
              disabled={loading || (!inputMessage.trim() && !attachedDoc)}
              title={attachedDoc && !inputMessage.trim() ? "Send attached file to AI" : "Send message"}
            >
              {loading ? (
                <span className="send-spinner">...</span>
              ) : (
                <>
                  <span>{attachedDoc && !inputMessage.trim() ? "Send File" : "Send"}</span>
                  <span className="send-arrow">→</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}
