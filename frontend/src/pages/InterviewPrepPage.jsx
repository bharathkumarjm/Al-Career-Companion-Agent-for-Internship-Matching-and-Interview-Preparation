import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../services/api";

export default function InterviewPrepPage() {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get("role") || "Backend Developer";

  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(initialRole);
  const [activeTab, setActiveTab] = useState("technical"); // technical, behavioral, mock_eval, strategies

  const [questionsData, setQuestionsData] = useState(null);
  const [strategiesData, setStrategiesData] = useState(null);
  const [openAnswers, setOpenAnswers] = useState({});

  // Mock Evaluator states
  const [evalQuestion, setEvalQuestion] = useState(
    "What is the difference between synchronous and asynchronous request handling in FastAPI / Node.js?"
  );
  const [userAnswer, setUserAnswer] = useState("");
  const [evaluation, setEvaluation] = useState(null);
  const [evaluating, setEvaluating] = useState(false);
  const [loading, setLoading] = useState(true);

  // Speech Recognition (Dictate Answer with Voice)
  const [isListening, setIsListening] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState("");
  const recognitionRef = useRef(null);

  // Text to Speech (Listen to AI Feedback Aloud)
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        let finalTrans = "";
        let interimTrans = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTrans += t;
          } else {
            interimTrans += t;
          }
        }
        const text = (finalTrans || interimTrans).trim();
        setSpeechTranscript(text);
        if (text) {
          setUserAnswer((prev) => (prev ? prev + " " + text : text));
        }
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error !== "no-speech") {
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

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
      setSpeechTranscript("");
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const speakFeedback = () => {
    if (!("speechSynthesis" in window) || !evaluation) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();

    const textToSpeak = `Your interview answer scored ${evaluation.score} out of 10, rated as ${evaluation.rating_label}. ` +
      `Identified strengths: ${evaluation.strengths?.join(". ") || "Good attempt"}. ` +
      `Areas for improvement: ${evaluation.improvement_areas?.join(". ") || "Continue practicing"}. ` +
      `Recommended model approach: ${evaluation.ideal_response_summary || ""}`;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleLoadSampleAnswer = () => {
    setUserAnswer(
      "Synchronous execution handles requests sequentially on the main thread, meaning any I/O operation like a database query or external API call blocks subsequent tasks until completion. In contrast, asynchronous execution in FastAPI leverages Python's asyncio event loop with coroutines (async/await), allowing non-blocking I/O operations. While waiting on an external I/O response, the server yields control to process other incoming client requests, enabling high-throughput concurrency with minimal memory overhead."
    );
  };

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await api.get("/api/interview/roles");
        setRoles(res.data);
      } catch (err) {
        console.error("Could not load interview roles:", err);
      }
    };
    fetchRoles();
  }, []);

  const fetchRoleContent = async (role) => {
    setLoading(true);
    try {
      const [qRes, sRes] = await Promise.all([
        api.get("/api/interview/questions", { params: { role } }),
        api.get("/api/interview/strategies", { params: { role } })
      ]);
      setQuestionsData(qRes.data);
      setStrategiesData(sRes.data.strategy);

      if (qRes.data.technical_questions?.length > 0) {
        setEvalQuestion(qRes.data.technical_questions[0].question);
      }
    } catch (err) {
      console.error("Failed to load interview content:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoleContent(selectedRole);
  }, [selectedRole]);

  const toggleAnswer = (id) => {
    setOpenAnswers((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleEvaluateAnswer = async (e) => {
    e.preventDefault();
    if (!userAnswer.trim()) return;

    setEvaluating(true);
    try {
      const res = await api.post("/api/interview/evaluate-answer", {
        role: selectedRole,
        question: evalQuestion,
        answer: userAnswer.trim()
      });
      setEvaluation(res.data);
    } catch (err) {
      console.error("Evaluation error:", err);
      alert("Evaluation failed. Please try again.");
    } finally {
      setEvaluating(false);
    }
  };

  const startMockForQuestion = (qText) => {
    setEvalQuestion(qText);
    setUserAnswer("");
    setEvaluation(null);
    setActiveTab("mock_eval");
  };

  return (
    <Layout
      title="7. Interview Preparation & Strategy Coaching"
      subtitle="Role-specific technical questions, STAR behavioral coaching, and AI answer evaluation"
    >
      {/* Role Selection Bar */}
      <div className="panel-box role-selector-card">
        <div className="role-selector-header">
          <h4>Select Internship Domain for Interview Prep</h4>
        </div>
        <div className="role-chips-wrap">
          {roles.map((r) => (
            <button
              key={r}
              type="button"
              className={`role-chip-btn ${selectedRole === r ? "active" : ""}`}
              onClick={() => setSelectedRole(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="tabs-bar panel-box">
        <button
          type="button"
          className={`tab-btn ${activeTab === "technical" ? "active" : ""}`}
          onClick={() => setActiveTab("technical")}
        >
          💻 Technical Questions ({questionsData?.technical_questions?.length || 0})
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === "behavioral" ? "active" : ""}`}
          onClick={() => setActiveTab("behavioral")}
        >
          🤝 Behavioral STAR Questions
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === "mock_eval" ? "active" : ""}`}
          onClick={() => setActiveTab("mock_eval")}
        >
          🎙️ AI Mock Answer Evaluator
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === "strategies" ? "active" : ""}`}
          onClick={() => setActiveTab("strategies")}
        >
          📋 Strategies & Checklist
        </button>
      </div>

      {loading && (
        <div className="loading-state panel-box">
          <div className="spinner"></div>
          <p>Loading interview questions for {selectedRole}...</p>
        </div>
      )}

      {/* TAB 1: TECHNICAL QUESTIONS */}
      {!loading && activeTab === "technical" && (
        <div className="questions-list">
          {questionsData?.technical_questions?.map((q) => (
            <div key={q.id} className="question-card panel-box">
              <div className="q-header-row">
                <div>
                  <span className="topic-badge">{q.topic}</span>
                  <span className="difficulty-tag">{q.difficulty}</span>
                </div>
                <button
                  type="button"
                  onClick={() => startMockForQuestion(q.question)}
                  className="btn-sm btn-outline"
                >
                  🎙️ Practice in Mock Evaluator
                </button>
              </div>

              <h4 className="question-text">{q.question}</h4>

              <div className="answer-toggle-section">
                <button
                  type="button"
                  onClick={() => toggleAnswer(q.id)}
                  className="btn-text-toggle"
                >
                  {openAnswers[q.id] ? "▲ Hide Model Answer" : "▼ Show Model Answer"}
                </button>

                {openAnswers[q.id] && (
                  <div className="model-answer-box">
                    <strong>💡 Model Answer & Talking Points:</strong>
                    <p>{q.model_answer}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: BEHAVIORAL QUESTIONS */}
      {!loading && activeTab === "behavioral" && (
        <div className="questions-list">
          {questionsData?.behavioral_questions?.map((q) => (
            <div key={q.id} className="question-card panel-box">
              <div className="q-header-row">
                <span className="topic-badge">Behavioral • STAR Method</span>
                <button
                  type="button"
                  onClick={() => startMockForQuestion(q.question)}
                  className="btn-sm btn-outline"
                >
                  🎙️ Test Your STAR Answer
                </button>
              </div>

              <h4 className="question-text">{q.question}</h4>

              {q.star_framework && (
                <div className="star-grid">
                  <div className="star-step">
                    <span className="star-letter">S</span>
                    <strong>Situation</strong>
                    <p>{q.star_framework.Situation}</p>
                  </div>
                  <div className="star-step">
                    <span className="star-letter">T</span>
                    <strong>Task</strong>
                    <p>{q.star_framework.Task}</p>
                  </div>
                  <div className="star-step">
                    <span className="star-letter">A</span>
                    <strong>Action</strong>
                    <p>{q.star_framework.Action}</p>
                  </div>
                  <div className="star-step">
                    <span className="star-letter">R</span>
                    <strong>Result</strong>
                    <p>{q.star_framework.Result}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: MOCK ANSWER EVALUATOR */}
      {!loading && activeTab === "mock_eval" && (
        <div className="customizer-split-grid">
          {/* Answer Input Panel */}
          <div className="panel-box">
            <div className="panel-header-simple">
              <h4>AI Mock Interview Simulator</h4>
              <div className="mock-interview-quick-actions">
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`btn-action-pill ${isListening ? "demo-pill" : "upload-pill"}`}
                  title="Speak into your microphone to dictate your answer"
                >
                  🎙️ {isListening ? "Recording... (Click to Stop)" : "Speak Answer (Mic)"}
                </button>
                <button
                  type="button"
                  onClick={handleLoadSampleAnswer}
                  className="btn-action-pill reparse-pill"
                  title="Load a high-scoring sample technical answer"
                >
                  ⚡ Sample Answer
                </button>
              </div>
            </div>

            <p className="subtext">
              Speak or type your answer to simulate a live interview. Our AI coach evaluates your depth, clarity, and points to improve.
            </p>

            {isListening && (
              <div className="parser-status-toast info" style={{ margin: "10px 0 14px", padding: "8px 14px" }}>
                <span className="toast-icon">🎙️</span>
                <span>Listening actively... Speak your response clearly into your microphone.</span>
              </div>
            )}

            <form onSubmit={handleEvaluateAnswer} className="styled-form" style={{ marginTop: "14px" }}>
              <div className="form-group">
                <label>Interview Question:</label>
                <input
                  type="text"
                  value={evalQuestion}
                  onChange={(e) => setEvalQuestion(e.target.value)}
                  className="input-eval-q"
                  required
                />
              </div>

              <div className="form-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <label style={{ margin: 0 }}>Your Answer:</label>
                  {userAnswer && (
                    <button
                      type="button"
                      onClick={() => setUserAnswer("")}
                      style={{ background: "none", border: "none", color: "#64748b", fontSize: "12px", cursor: "pointer" }}
                    >
                      Clear Answer
                    </button>
                  )}
                </div>
                <textarea
                  rows={8}
                  placeholder="Explain your approach, technical details, code examples, or past experience here (or use the microphone above)..."
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn-primary" disabled={evaluating}>
                {evaluating ? "Evaluating Answer with AI..." : "🎯 Submit & Get AI Feedback"}
              </button>
            </form>
          </div>

          {/* Feedback Display Panel */}
          <div className="panel-box">
            <div className="panel-header-simple">
              <h4>📊 AI Performance Evaluation</h4>
              {evaluation && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={speakFeedback}
                    className="btn-action-pill upload-pill"
                    style={{ fontSize: "12px", padding: "4px 10px" }}
                    title="Listen to AI evaluation spoken aloud"
                  >
                    {isSpeaking ? "⏹️ Stop Audio" : "🔊 Listen Aloud"}
                  </button>
                  <span
                    className="score-badge-pill"
                    style={{
                      backgroundColor: evaluation.score >= 7 ? "#10b98120" : "#f59e0b20",
                      color: evaluation.score >= 7 ? "#10b981" : "#d97706"
                    }}
                  >
                    Score: {evaluation.score}/10 ({evaluation.rating_label})
                  </span>
                </div>
              )}
            </div>

            {!evaluation && !evaluating && (
              <p className="empty-hint">
                Submit an answer on the left to receive an objective score, strengths breakdown, and model response improvements.
              </p>
            )}

            {evaluating && (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Analyzing technical depth, clarity, and trade-off considerations...</p>
              </div>
            )}

            {evaluation && (
              <div className="eval-results-box">
                <div className="eval-subgroup">
                  <span className="eval-sub-title">✅ Identified Strengths:</span>
                  <ul className="bullets-list">
                    {evaluation.strengths?.map((str, i) => (
                      <li key={i}>{str}</li>
                    ))}
                  </ul>
                </div>

                <div className="eval-subgroup" style={{ marginTop: "14px" }}>
                  <span className="eval-sub-title">⚠️ Areas for Improvement:</span>
                  <ul className="bullets-list">
                    {evaluation.improvement_areas?.map((imp, i) => (
                      <li key={i}>{imp}</li>
                    ))}
                  </ul>
                </div>

                <div className="model-answer-box" style={{ marginTop: "14px" }}>
                  <strong>💡 Suggested Answer Revision:</strong>
                  <p>{evaluation.ideal_response_summary}</p>
                </div>

                {evaluation.talking_points_to_remember && (
                  <div className="talking-points-row" style={{ marginTop: "12px" }}>
                    <small>Key Points to Remember:</small>
                    <div className="skills-tags-wrap">
                      {evaluation.talking_points_to_remember.map((p, i) => (
                        <span key={i} className="skill-bubble">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: STRATEGIES & CHECKLIST */}
      {!loading && activeTab === "strategies" && strategiesData && (
        <div className="strategies-container">
          <div className="dashboard-two-col">
            <div className="panel-box">
              <h4>Preparation Checklist</h4>
              <ul className="checklist-items" style={{ marginTop: "14px" }}>
                {strategiesData.preparation_checklist?.map((item, i) => (
                  <li key={i}>
                    <input type="checkbox" id={`chk_${i}`} />
                    <label htmlFor={`chk_${i}`}>{item}</label>
                  </li>
                ))}
              </ul>
            </div>

            <div className="panel-box">
              <h4>Interview Dos & Don'ts</h4>
              <div className="dos-donts-grid" style={{ marginTop: "14px" }}>
                <div className="dos-col">
                  <strong>✅ Dos:</strong>
                  <ul>
                    {strategiesData.interview_dos?.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>
                <div className="donts-col">
                  <strong>❌ Don'ts:</strong>
                  <ul>
                    {strategiesData.interview_donts?.map((dn, i) => (
                      <li key={i}>{dn}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="panel-box" style={{ marginTop: "20px" }}>
            <h4>Questions to Ask the Interviewer (Demonstrate High Curiosity)</h4>
            <div className="recs-list" style={{ marginTop: "12px" }}>
              {strategiesData.questions_to_ask_interviewer?.map((q, i) => (
                <div key={i} className="rec-card">
                  <p>
                    "{q}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
