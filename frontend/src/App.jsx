import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation
} from "react-router-dom";

import { LandingPage, Login, Register, ForgotPassword, ResetPassword } from "./pages/AuthPages";
import Dashboard from "./pages/Dashboard";
import ProfilePage from "./pages/ProfilePage";
import ResumeParserPage from "./pages/ResumeParserPage";
import KnowledgeBasePage from "./pages/KnowledgeBasePage";
import JobMatchingPage from "./pages/JobMatchingPage";
import SkillGapPage from "./pages/SkillGapPage";
import CustomizerPage from "./pages/CustomizerPage";
import InterviewPrepPage from "./pages/InterviewPrepPage";
import CareerAssistantPage from "./pages/CareerAssistantPage";

import "./App.css";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("access_token");
  const location = useLocation();
  if (!token) {
    const target = location.pathname + location.search;
    return <Navigate to={`/login?redirect=${encodeURIComponent(target)}`} replace />;
  }
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC AUTH ROUTES */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* 8 CORE MODULES + DASHBOARD */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Module 1: Student Profile and Resume Management */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Module 2: Resume Parsing and Skill/Experience Extraction */}
        <Route
          path="/resume-parser"
          element={
            <ProtectedRoute>
              <ResumeParserPage />
            </ProtectedRoute>
          }
        />

        {/* Module 3: Internship Knowledge Base with RAG-based Retrieval */}
        <Route
          path="/knowledge-base"
          element={
            <ProtectedRoute>
              <KnowledgeBasePage />
            </ProtectedRoute>
          }
        />

        {/* Module 4: Job-Resume Matching and Compatibility Scoring */}
        <Route
          path="/job-matching"
          element={
            <ProtectedRoute>
              <JobMatchingPage />
            </ProtectedRoute>
          }
        />

        {/* Module 5: Skill Gap Analysis and Improvement Recommendations */}
        <Route
          path="/skill-gap"
          element={
            <ProtectedRoute>
              <SkillGapPage />
            </ProtectedRoute>
          }
        />

        {/* Module 6: Role-specific Resume and Cover Letter Customization */}
        <Route
          path="/customizer"
          element={
            <ProtectedRoute>
              <CustomizerPage />
            </ProtectedRoute>
          }
        />

        {/* Module 7: Interview Preparation with Role-specific Questions and Strategies */}
        <Route
          path="/interview-prep"
          element={
            <ProtectedRoute>
              <InterviewPrepPage />
            </ProtectedRoute>
          }
        />

        {/* Module 8: Conversational Career Assistant for ongoing guidance */}
        <Route
          path="/career-assistant"
          element={
            <ProtectedRoute>
              <CareerAssistantPage />
            </ProtectedRoute>
          }
        />

        {/* BACKWARDS COMPATIBILITY REDIRECTS */}
        <Route path="/application-tracker" element={<Navigate to="/dashboard" replace />} />
        <Route path="/resume" element={<Navigate to="/profile" replace />} />
        <Route path="/analysis" element={<Navigate to="/skill-gap" replace />} />
        <Route path="/internships" element={<Navigate to="/knowledge-base" replace />} />
        <Route path="/cv" element={<Navigate to="/customizer" replace />} />
        <Route path="/tasks" element={<Navigate to="/dashboard" replace />} />
        <Route path="/submissions" element={<Navigate to="/dashboard" replace />} />
        <Route path="/code-review" element={<Navigate to="/interview-prep" replace />} />
        <Route path="/feedback" element={<Navigate to="/career-assistant" replace />} />
        <Route path="/training" element={<Navigate to="/interview-prep" replace />} />
        <Route path="/progress" element={<Navigate to="/dashboard" replace />} />

        {/* CATCH-ALL */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
