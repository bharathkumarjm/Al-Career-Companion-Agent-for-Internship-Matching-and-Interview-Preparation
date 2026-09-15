from app.services.rag_matcher import RAGInternshipMatcher


def test_rag_matcher_returns_highest_similarity_for_skill_match():
    matcher = RAGInternshipMatcher()

    candidate = {
        "summary": "Software engineering intern with strong Python, FastAPI, SQL, and data analysis skills.",
        "skills": ["Python", "FastAPI", "SQL", "Machine Learning", "Data Analysis"],
        "education": ["B.Tech in Computer Science"],
        "experience": ["Built backend services and dashboards"],
        "projects": ["AI internship tracking platform"],
        "certifications": ["Google Data Analytics"],
        "career_recommendation": "Backend Developer"
    }

    internships = [
        {
            "id": 1,
            "title": "Backend Developer Intern",
            "company": "OpenAI Labs",
            "description": "Build Python backend services, APIs, and database logic for enterprise systems.",
            "required_skills": "Python, FastAPI, SQL, REST APIs",
            "preferred_skills": "Machine Learning, Docker",
            "education_requirements": "B.Tech or equivalent",
            "experience_requirements": "0-1 years",
            "location": "Hyderabad",
            "work_mode": "Hybrid",
            "duration": "6 months",
            "status": "active"
        },
        {
            "id": 2,
            "title": "Data Analyst Intern",
            "company": "InsightWorks",
            "description": "Analyze customer data and generate reports using SQL and dashboards.",
            "required_skills": "SQL, Data Analysis, Excel",
            "preferred_skills": "Python, Tableau",
            "education_requirements": "Any degree",
            "experience_requirements": "Freshers can apply",
            "location": "Remote",
            "work_mode": "Remote",
            "duration": "3 months",
            "status": "active"
        }
    ]

    result = matcher.match_candidate(candidate, internships, top_k=2)

    assert len(result["recommendations"]) >= 1
    assert result["recommendations"][0]["internship_id"] == 1
    assert result["recommendations"][0]["match_percentage"] >= 70


def test_rag_matcher_handles_missing_fields_gracefully():
    matcher = RAGInternshipMatcher()

    candidate = {
        "summary": "Student with interest in AI and machine learning.",
        "skills": ["Python", "Machine Learning"],
        "education": [],
        "experience": [],
        "projects": [],
        "certifications": [],
        "career_recommendation": "AI Engineer"
    }

    internships = [
        {
            "id": 10,
            "title": "Generative AI Intern",
            "company": "CortexAI",
            "description": "Work on LLM workflows, prompt engineering, and AI experiments.",
            "required_skills": "Python, Machine Learning, NLP",
            "preferred_skills": "LLMs, PyTorch",
            "education_requirements": "B.Tech",
            "experience_requirements": "0-1 years",
            "location": "Bengaluru",
            "work_mode": "Onsite",
            "duration": "6 months",
            "status": "active"
        }
    ]

    result = matcher.match_candidate(candidate, internships, top_k=1)

    assert result["recommendations"][0]["internship_id"] == 10
    assert result["recommendations"][0]["match_percentage"] >= 40
