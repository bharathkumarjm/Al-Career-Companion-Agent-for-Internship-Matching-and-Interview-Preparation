from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base, SessionLocal

# Import all models
from app.models.user import User
from app.models.student_profile import StudentProfile
from app.models.resume import Resume
from app.models.analysis import ResumeAnalysis
from app.models.application import Application
from app.models.internship import Internship
from app.models.project import Project
from app.models.task import Task
from app.models.submission import Submission
from app.models.code_review import CodeReview
from app.models.feedback import MentorFeedback
from app.models.attendance import Attendance
from app.models.training import TrainingSession
from app.models.progress import LearningProgress
from app.models.notification import Notification
from app.models.file import FileRecord
from app.models.project_progress import ProjectProgress
from app.models.cv import CV

# Import core routers for the 9 requirements
from app.routers.auth import router as auth_router
from app.routers.profile import router as profile_router
from app.routers.resume import router as resume_router
from app.routers.knowledge_base import router as knowledge_base_router
from app.routers.matching import router as matching_router
from app.routers.skill_gap import router as skill_gap_router
from app.routers.customization import router as customization_router
from app.routers.interview_prep import router as interview_prep_router
from app.routers.application import router as application_router
from app.routers.career_assistant import router as career_assistant_router

# Import existing routers for compatibility
from app.routers.analysis import router as analysis_router
from app.routers.project import router as project_router
from app.routers.task import router as task_router
from app.routers.submission import router as submission_router
from app.routers.code_review import router as code_review_router
from app.routers.feedback import router as feedback_router
from app.routers.attendance import router as attendance_router
from app.routers.training import router as training_router
from app.routers.progress import router as progress_router
from app.routers.notification import router as notification_router
from app.routers.file import router as file_router
from app.routers.project_progress import router as project_progress_router
from app.routers.internship import router as internship_router
from app.routers.rag_matching import router as rag_matching_router
from app.routers.dashboard import router as dashboard_router
from app.routers.cv import router as cv_router

from app.services.internship_dataset import seed_internships_if_empty

# Create database tables
Base.metadata.create_all(bind=engine)

# Seed demo internships
try:
    db = SessionLocal()
    seed_internships_if_empty(db)
    db.close()
except Exception as e:
    print(f"Database seed note: {e}")


# Create FastAPI app
app = FastAPI(
    title="AI Internship Agent",
    description="AI-powered Resume Parsing, Internship Matching, and Career Mentorship System",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all during dev/demo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register the 9 core requirement routers
app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(resume_router)
app.include_router(knowledge_base_router)
app.include_router(matching_router)
app.include_router(skill_gap_router)
app.include_router(customization_router)
app.include_router(interview_prep_router)
app.include_router(application_router)
app.include_router(career_assistant_router)

# Register existing compatibility routers
app.include_router(project_router)
app.include_router(task_router)
app.include_router(submission_router)
app.include_router(code_review_router)
app.include_router(feedback_router)
app.include_router(attendance_router)
app.include_router(training_router)
app.include_router(progress_router)
app.include_router(notification_router)
app.include_router(file_router)
app.include_router(project_progress_router)
app.include_router(internship_router)
app.include_router(rag_matching_router)
app.include_router(dashboard_router)
app.include_router(analysis_router)
app.include_router(cv_router)


@app.get("/")
def root():
    return {
        "message": "AI Internship Agent API v2.0 is running",
        "modules": [
            "1. Student Profile and Resume Management",
            "2. Resume Parsing and Skill/Experience Extraction",
            "3. Internship Knowledge Base with RAG-based Retrieval",
            "4. Job-Resume Matching and Compatibility Scoring",
            "5. Skill Gap Analysis and Improvement Recommendations",
            "6. Role-specific Resume and Cover Letter Customization",
            "7. Interview Preparation with Role-specific Questions and Strategies",
            "8. Application Tracking and Management",
            "9. Conversational Career Assistant for ongoing guidance"
        ]
    }


@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "AI Internship Agent Backend"}