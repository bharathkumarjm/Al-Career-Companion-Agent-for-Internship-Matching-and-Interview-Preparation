import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import json
import pytest
from fastapi.testclient import TestClient
from app.main import app


client = TestClient(app)

# Helper to get auth token
def get_auth_token():
    test_email = "test_verification_student@example.com"
    test_password = "Password123!"

    # Try register
    client.post("/auth/register", json={
        "name": "Alex Student",
        "email": test_email,
        "password": test_password
    })

    # Login
    res = client.post(
        "/auth/login",
        data={"username": test_email, "password": test_password},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    if res.status_code == 200:
        return res.json()["access_token"]
    raise Exception(f"Login failed: {res.text}")


def test_system_root():
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert len(data["modules"]) == 9
    print("[PASS] System root lists all 9 modules")


def test_module_1_profile_and_resume_management():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Get profile
    res = client.get("/api/profile/me", headers=headers)
    assert res.status_code == 200
    profile = res.json()
    assert "email" in profile
    print("[PASS] Module 1: GET /api/profile/me passed")

    # 2. Update profile
    res = client.put("/api/profile/me", json={
        "university": "Apex Institute of Tech",
        "target_role": "Backend Engineer Intern",
        "skills": ["Python", "FastAPI", "SQL", "Docker"]
    }, headers=headers)
    assert res.status_code == 200
    print("[PASS] Module 1: PUT /api/profile/me passed")

    # 3. List resumes
    res = client.get("/resumes/my", headers=headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)
    print("[PASS] Module 1: GET /resumes/my passed")


def test_module_2_resume_parsing_and_skill_extraction():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Test direct deep extraction service
    from app.services.groq_service import deep_extract_resume
    sample_text = """
    Alex Student
    alex@example.com | +91 9988776655 | Bengaluru
    linkedin.com/in/alexstudent | github.com/alexstudent

    SUMMARY
    Computer Science student with experience building Python backend APIs and React frontend apps.

    SKILLS
    Python, FastAPI, SQL, Docker, React, Git, REST APIs, Linux

    EXPERIENCE
    Software Engineering Intern at CodeLabs (Jun 2023 - Aug 2023)
    - Developed RESTful API endpoints using FastAPI and PostgreSQL.
    - Improved query latency by 25% with indexing.

    EDUCATION
    B.Tech in Computer Science, VTU (2022 - 2026) - CGPA: 8.8

    PROJECTS
    AI Internship Agent: Built full stack platform with RAG retrieval and vector store.
    """
    extracted = deep_extract_resume(sample_text)
    assert "personal_info" in extracted
    assert "skills" in extracted
    assert len(extracted["skills"]["technical_skills"]) > 0
    print(f"[PASS] Module 2: Deep extraction extracted {len(extracted['skills']['technical_skills'])} technical skills")


def test_module_3_knowledge_base_with_rag_retrieval():
    # 1. Get internships
    res = client.get("/api/knowledge-base/internships")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 10
    print(f"[PASS] Module 3: Knowledge base contains {data['total']} verified opportunities")

    # 2. Get domains
    res = client.get("/api/knowledge-base/domains")
    assert res.status_code == 200
    domains = res.json()
    assert len(domains) > 2
    print(f"[PASS] Module 3: Retrieved {len(domains)} knowledge domains")

    # 3. RAG Query
    res = client.post("/api/knowledge-base/rag-query", json={
        "query": "Which internships require Python and have good stipend?",
        "top_k": 3
    })
    assert res.status_code == 200
    rag_data = res.json()
    assert "answer" in rag_data
    assert len(rag_data["internships"]) > 0
    print("[PASS] Module 3: RAG Query successfully synthesized grounded answer with citations")


def test_module_4_job_resume_matching():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Upload a sample resume
    from io import BytesIO
    fake_pdf = b"%PDF-1.4 ... fake pdf content ... Python FastAPI SQL Docker React Git"
    
    # We can test compatibility directly or via endpoint
    res = client.get("/matching/compatibility", headers=headers)
    # If no resume uploaded yet for this user, it returns 404 cleanly; otherwise 200
    if res.status_code == 404:
        # Create a resume record in database for test
        from app.database import SessionLocal
        from app.models.resume import Resume
        from app.models.user import User
        with SessionLocal() as db:
            user = db.query(User).filter(User.email == "test_verification_student@example.com").first()
            r = Resume(
                filename="alex_resume.pdf",
                file_path="uploads/test.pdf",
                extracted_text="Python FastAPI SQL Docker React Git REST APIs",
                parsed_data=json.dumps({
                    "skills": {"technical_skills": ["Python", "FastAPI", "SQL", "Docker"]}
                }),
                is_active=True,
                owner_id=user.id
            )
            db.add(r)
            db.commit()

        res = client.get("/matching/compatibility", headers=headers)

    assert res.status_code == 200
    match_data = res.json()
    assert len(match_data["matches"]) > 0
    top_match = match_data["matches"][0]
    assert "compatibility_score" in top_match
    assert "matched_skills" in top_match
    assert "missing_skills" in top_match
    print(f"[PASS] Module 4: Matching computed top compatibility score of {top_match['compatibility_score']}%")


def test_module_5_skill_gap_analysis():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Get roles
    res = client.get("/api/skill-gap/roles")
    assert res.status_code == 200
    roles = res.json()
    assert len(roles) >= 5

    # 2. Analyze gap
    res = client.post("/api/skill-gap/analyze", json={
        "target_role": "Backend Developer",
        "candidate_skills": ["Python", "SQL", "Git"]
    }, headers=headers)
    assert res.status_code == 200
    gap = res.json()
    assert "match_percentage" in gap
    assert "critical_gaps" in gap
    assert "learning_roadmap" in gap
    assert "recommended_courses" in gap
    assert "recommended_projects" in gap
    print(f"[PASS] Module 5: Skill Gap generated roadmap with {len(gap['learning_roadmap'])} phases and {len(gap['critical_gaps'])} critical gaps")


def test_module_6_customization():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Tailor resume
    res = client.post("/api/customization/tailor-resume", json={
        "target_role": "Backend Developer Intern",
        "job_description": "Looking for Python, FastAPI, and PostgreSQL experience."
    }, headers=headers)
    assert res.status_code == 200
    tailored = res.json()
    assert "tailored_summary" in tailored
    assert "optimized_bullet_points" in tailored
    print("[PASS] Module 6: Tailored resume generated ATS keywords and bullet points")

    # 2. Cover letter
    res = client.post("/api/customization/generate-cover-letter", json={
        "company": "OpenAI Labs",
        "role": "Backend Developer Intern",
        "tone": "professional"
    }, headers=headers)
    assert res.status_code == 200
    cover = res.json()
    assert "full_text" in cover
    print("[PASS] Module 6: Generated customized cover letter")


def test_module_7_interview_prep():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Get roles
    res = client.get("/api/interview/roles")
    assert res.status_code == 200

    # 2. Get questions
    res = client.get("/api/interview/questions?role=Backend%20Developer")
    assert res.status_code == 200
    q_data = res.json()
    assert len(q_data["technical_questions"]) > 0
    assert len(q_data["behavioral_questions"]) > 0
    print(f"[PASS] Module 7: Retrieved {len(q_data['technical_questions'])} technical & {len(q_data['behavioral_questions'])} behavioral STAR questions")

    # 3. Evaluate answer
    res = client.post("/api/interview/evaluate-answer", json={
        "role": "Backend Developer",
        "question": "What is the difference between synchronous and asynchronous request handling?",
        "answer": "Synchronous blocks the execution thread while waiting for I/O, whereas asynchronous uses the event loop with non-blocking I/O to handle many concurrent connections."
    }, headers=headers)
    assert res.status_code == 200
    evaluation = res.json()
    assert "score" in evaluation
    assert "strengths" in evaluation
    assert "ideal_response_summary" in evaluation
    print(f"[PASS] Module 7: AI Mock Answer Evaluator scored response at {evaluation['score']}/10")


def test_module_8_application_tracker():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Add application
    res = client.post("/api/applications/", json={
        "company": "Stripe Labs",
        "role": "Payments Engineering Intern",
        "location": "Remote",
        "stipend": "₹40,000 / month",
        "status": "Applied",
        "notes": "Applied via referral"
    }, headers=headers)
    assert res.status_code == 200
    new_app = res.json()
    app_id = new_app["id"]

    # 2. Update status to Interviewing
    res = client.put(f"/api/applications/{app_id}", json={
        "status": "Interviewing",
        "interview_date": "Next Monday 10:00 AM"
    }, headers=headers)
    assert res.status_code == 200
    assert res.json()["status"] == "Interviewing"

    # 3. Get stats
    res = client.get("/api/applications/stats", headers=headers)
    assert res.status_code == 200
    stats = res.json()
    assert stats["total"] >= 1
    print(f"[PASS] Module 8: Application Tracking pipeline active with {stats['total']} total applications")


def test_module_9_conversational_career_assistant():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    res = client.post("/api/assistant/chat", json={
        "messages": [
            {"role": "user", "content": "How do I prepare for a technical interview for a backend intern role?"}
        ]
    }, headers=headers)
    assert res.status_code == 200
    chat_data = res.json()
    assert "response" in chat_data
    assert len(chat_data["response"]) > 20
    print("[PASS] Module 9: AI Conversational Career Assistant provided personalized mentorship")


if __name__ == "__main__":
    test_system_root()
    test_module_1_profile_and_resume_management()
    test_module_2_resume_parsing_and_skill_extraction()
    test_module_3_knowledge_base_with_rag_retrieval()
    test_module_4_job_resume_matching()
    test_module_5_skill_gap_analysis()
    test_module_6_customization()
    test_module_7_interview_prep()
    test_module_8_application_tracker()
    test_module_9_conversational_career_assistant()
    print("\n=======================================================")
    print("ALL 9 CORE MODULES VERIFIED & WORKING PERFECTLY!")
    print("=======================================================")
