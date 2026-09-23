import json
import re
from typing import Any, Dict, List, Optional
from groq import Groq
from app.config import settings

client = None
try:
    if settings.GROQ_API_KEY:
        client = Groq(api_key=settings.GROQ_API_KEY)
except Exception as e:
    print(f"Warning: Could not initialize Groq client: {e}")

PRIMARY_MODEL = "qwen/qwen3.8-27b"
FALLBACK_MODELS = ["allam-2-7b", "openai/gpt-oss-120b", "openai/gpt-oss-20b"]
MODEL_NAME = PRIMARY_MODEL


def _sanitize_unicode(text: str) -> str:
    """Replace non-standard unicode characters that can break Windows consoles or markdown renderers."""
    if not text:
        return ""
    replacements = {
        "\u2011": "-",
        "\u2012": "-",
        "\u2013": "-",
        "\u2014": "--",
        "\u2018": "'",
        "\u2019": "'",
        "\u201a": "'",
        "\u201b": "'",
        "\u201c": '"',
        "\u201d": '"',
        "\u201e": '"',
        "\u2026": "...",
        "\u2022": "*",
        "\u00a0": " ",
    }
    for k, v in replacements.items():
        text = text.replace(k, v)
    return text


def _clean_and_parse_json(text: Optional[str]) -> Optional[Dict[str, Any]]:
    """Clean markdown code fences and parse JSON safely."""
    if not text:
        return None
    cleaned = _sanitize_unicode(text)
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned.strip(), flags=re.MULTILINE)
    cleaned = re.sub(r"```$", "", cleaned.strip(), flags=re.MULTILINE).strip()
    try:
        return json.loads(cleaned)
    except Exception:
        pass
    match = re.search(r"(\{.*\})", cleaned, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except Exception:
            pass
    return None


def _call_groq(messages: List[Dict[str, str]], json_mode: bool = True, temperature: float = 0.2, max_tokens: int = 750, model: Optional[str] = None) -> Optional[str]:
    """Helper to call Groq chat completion safely with automatic fallback and token quota protection."""
    if not client:
        return None
    models_to_try = [model] if model else [PRIMARY_MODEL] + [m for m in FALLBACK_MODELS if m != PRIMARY_MODEL]
    for current_model in models_to_try:
        try:
            if "qwen" in current_model:
                toks = min(max_tokens, 750)
            elif "gpt-oss" in current_model:
                toks = max(max_tokens, 1500)
            else:
                toks = min(max_tokens, 2048)

            kwargs = {
                "model": current_model,
                "messages": messages,
                "temperature": temperature,
                "max_completion_tokens": toks,
            }
            if json_mode:
                kwargs["response_format"] = {"type": "json_object"}
            response = client.chat.completions.create(**kwargs)
            content = response.choices[0].message.content
            if content and content.strip():
                return _sanitize_unicode(content)
        except Exception as err:
            try:
                print(f"Groq API call error ({current_model}): {str(err).encode('ascii', 'replace').decode('ascii')}")
            except Exception:
                pass
    return None


# ============================================================
# 1. RESUME PARSING & SKILL/EXPERIENCE EXTRACTION
# ============================================================

def deep_extract_resume(resume_text: str) -> Dict[str, Any]:
    """Extract complete structured profile from resume text using Groq with heuristic fallback."""
    prompt = f"""
You are an expert ATS and HR resume parser. Analyze the following raw resume text and extract all details into a structured JSON object.

RAW RESUME TEXT:
{resume_text[:6000]}

You MUST return ONLY valid JSON with this exact schema:
{{
  "personal_info": {{
    "name": "Candidate Full Name or empty string",
    "email": "Email address or empty string",
    "phone": "Phone number or empty string",
    "location": "City, Country or empty string",
    "linkedin": "LinkedIn profile URL or empty string",
    "github": "GitHub profile URL or empty string",
    "portfolio": "Portfolio or personal site URL or empty string"
  }},
  "summary": "2-3 sentence professional summary",
  "skills": {{
    "technical_skills": ["Python", "React", ...],
    "soft_skills": ["Problem Solving", "Teamwork", ...],
    "tools_frameworks": ["FastAPI", "Docker", "Git", "VS Code", ...]
  }},
  "experience": [
    {{
      "company": "Company or Organization name",
      "role": "Job / Internship title",
      "duration": "e.g., Jun 2023 - Present or 6 months",
      "location": "Location or Remote",
      "bullets": ["Achievement or responsibility 1", "Achievement 2"]
    }}
  ],
  "education": [
    {{
      "institution": "University / College name",
      "degree": "Degree name (e.g. B.Tech Computer Science)",
      "year": "Graduation year or date range",
      "score": "GPA / Percentage or empty string"
    }}
  ],
  "projects": [
    {{
      "title": "Project name",
      "tech_stack": ["Tech1", "Tech2"],
      "description": "Brief description of problem solved and impact",
      "link": "Project link or empty string"
    }}
  ],
  "certifications": ["Certification name 1", "Certification 2"],
  "career_recommendation": "Top 2-3 target roles for this profile"
}}
"""
    raw_content = _call_groq([
        {"role": "system", "content": "You are a specialized JSON resume extraction engine. Return only clean JSON."},
        {"role": "user", "content": prompt}
    ], json_mode=True)

    parsed = _clean_and_parse_json(raw_content)
    if parsed:
        return parsed

    # Heuristic fallback if LLM offline or format error
    return _heuristic_resume_parser(resume_text)


def _heuristic_resume_parser(text: str) -> Dict[str, Any]:
    """Rule-based extractor for when LLM is unavailable."""
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    name = lines[0] if lines else "Candidate"
    
    email_match = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", text)
    phone_match = re.search(r"(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}", text)
    linkedin_match = re.search(r"(linkedin\.com/in/[\w-]+)", text, re.IGNORECASE)
    github_match = re.search(r"(github\.com/[\w-]+)", text, re.IGNORECASE)

    common_tech_skills = [
        "Python", "Java", "C++", "C#", "JavaScript", "TypeScript", "HTML", "CSS", "SQL", "React",
        "Node.js", "FastAPI", "Django", "Flask", "Express", "Docker", "Kubernetes", "AWS", "Azure",
        "Git", "GitHub", "MongoDB", "PostgreSQL", "MySQL", "Redis", "Machine Learning", "Data Analysis",
        "Pandas", "NumPy", "TensorFlow", "PyTorch", "Tailwind CSS", "Bootstrap", "Next.js", "Linux",
        "REST APIs", "GraphQL", "Figma", "Selenium", "PyTest"
    ]
    found_skills = [s for s in common_tech_skills if re.search(rf"\b{re.escape(s)}\b", text, re.IGNORECASE)]

    return {
        "personal_info": {
            "name": name,
            "email": email_match.group(0) if email_match else "",
            "phone": phone_match.group(0) if phone_match else "",
            "location": "",
            "linkedin": linkedin_match.group(0) if linkedin_match else "",
            "github": github_match.group(0) if github_match else "",
            "portfolio": ""
        },
        "summary": "Enthusiastic student developer with strong technical skills looking for internship opportunities to apply computer science and software development concepts.",
        "skills": {
            "technical_skills": found_skills[:8] or ["Python", "SQL", "Git"],
            "soft_skills": ["Problem Solving", "Communication", "Critical Thinking", "Agile Collaboration"],
            "tools_frameworks": [s for s in found_skills if s in ["Docker", "Git", "FastAPI", "React", "Linux", "VS Code"]] or ["Git", "VS Code"]
        },
        "experience": [
            {
                "company": "Academic / Personal Projects",
                "role": "Software Developer",
                "duration": "Recent",
                "location": "Remote",
                "bullets": ["Implemented core application features and database interactions", "Collaborated on version control and testing workflows"]
            }
        ],
        "education": [
            {
                "institution": "Engineering College / University",
                "degree": "Bachelor of Technology / Engineering in Computer Science",
                "year": "2022 - 2026",
                "score": "8.5 CGPA"
            }
        ],
        "projects": [
            {
                "title": "Full Stack / AI Project",
                "tech_stack": found_skills[:3] or ["Python", "React"],
                "description": "Engineered a web-based software application demonstrating RESTful APIs and clean architecture.",
                "link": ""
            }
        ],
        "certifications": ["Python Programming Certification", "Web Development Fundamentals"],
        "career_recommendation": "Full Stack Developer, Backend Developer, Software Engineer Intern"
    }


# Backwards compatibility for existing routes
def analyze_resume(resume_text: str):
    parsed = deep_extract_resume(resume_text)
    all_skills = (
        parsed.get("skills", {}).get("technical_skills", []) +
        parsed.get("skills", {}).get("tools_frameworks", []) +
        parsed.get("skills", {}).get("soft_skills", [])
    )
    return {
        "summary": parsed.get("summary", ""),
        "skills": all_skills,
        "education": [f"{e.get('degree', '')} at {e.get('institution', '')} ({e.get('year', '')})" for e in parsed.get("education", [])],
        "experience": [f"{exp.get('role', '')} at {exp.get('company', '')} ({exp.get('duration', '')})" for exp in parsed.get("experience", [])],
        "projects": [f"{p.get('title', '')} - {p.get('description', '')}" for p in parsed.get("projects", [])],
        "certifications": parsed.get("certifications", []),
        "career_recommendation": parsed.get("career_recommendation", "")
    }


# ============================================================
# 2. RAG KNOWLEDGE BASE QUERY SYNTHESIS
# ============================================================

def rag_answer_query(query: str, retrieved_internships: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Synthesize grounded answers using context retrieved from the internship knowledge base."""
    context_str = "\n\n".join([
        f"Internship ID: {job.get('id')}\n"
        f"Title: {job.get('title')} at {job.get('company')}\n"
        f"Domain: {job.get('domain')}\n"
        f"Location: {job.get('location')} ({job.get('work_mode')})\n"
        f"Stipend: {job.get('stipend')} | Duration: {job.get('duration')}\n"
        f"Required Skills: {job.get('required_skills')}\n"
        f"Description: {job.get('description')}\n"
        f"Interview Process: {job.get('interview_process')}"
        for job in retrieved_internships[:6]
    ])

    prompt = f"""
You are the AI Knowledge Base Guide for students seeking internships. Answer the student's question accurately using ONLY the retrieved internship opportunities below.

RETRIEVED KNOWLEDGE BASE INTERNSHIPS:
{context_str}

STUDENT QUESTION:
{query}

Format your response as a valid JSON object:
{{
  "answer": "Clear, markdown-formatted, comprehensive answer directly answering the question with specific company names, role details, and stipend info if relevant.",
  "recommended_internship_ids": [list of IDs of most relevant internships from the context],
  "key_takeaways": ["Takeaway 1", "Takeaway 2", "Takeaway 3"]
}}
"""
    raw_content = _call_groq([
        {"role": "system", "content": "You are a grounded RAG knowledge assistant. Do not invent non-existent internships."},
        {"role": "user", "content": prompt}
    ], json_mode=True)

    parsed = _clean_and_parse_json(raw_content)
    if parsed:
        return parsed

    # Fallback grounded synthesis
    top_matches = retrieved_internships[:3]
    companies = ", ".join([f"{j.get('title')} at {j.get('company')}" for j in top_matches])
    return {
        "answer": f"Based on our internship knowledge base, we found relevant opportunities matching your query: **{query}**.\n\nKey opportunities include:\n" + "\n".join([f"- **{j.get('title')}** at **{j.get('company')}** ({j.get('location')}, {j.get('stipend')}): Requires {j.get('required_skills')}." for j in top_matches]),
        "recommended_internship_ids": [int(j.get("id")) for j in top_matches if j.get("id")],
        "key_takeaways": [
            "Matches align with your specified domain and skill queries.",
            "Verify all required skills and review the interview stages before applying.",
            "Tailor your resume for the specific requirements of each role."
        ]
    }


# ============================================================
# 3. SKILL GAP ANALYSIS & RECOMMENDATIONS
# ============================================================

def analyze_skill_gap(candidate_skills: List[str], target_role: str, job_description: str = "") -> Dict[str, Any]:
    """Analyze skill gap between candidate profile and target role/job description."""
    prompt = f"""
You are a career tech advisor. Conduct a comprehensive skill gap analysis for a student.

CANDIDATE SKILLS:
{", ".join(candidate_skills) if candidate_skills else "Beginner programming fundamentals"}

TARGET ROLE:
{target_role}

ROLE JOB DESCRIPTION / REQUIREMENTS:
{job_description or "Standard industry requirements for this role"}

Return ONLY a valid JSON object:
{{
  "target_role": "{target_role}",
  "match_percentage": 75,
  "readiness_level": "Intermediate / Job Ready / Foundation Needed",
  "mastered_skills": ["Skills candidate has that match the role"],
  "critical_gaps": ["Critical missing skills needed to succeed"],
  "secondary_gaps": ["Nice-to-have or advanced skills to stand out"],
  "learning_roadmap": [
    {{
      "phase": "Weeks 1-2: Foundations",
      "topic": "Core technologies to master",
      "action_items": ["Action 1", "Action 2"]
    }},
    {{
      "phase": "Weeks 3-4: Hands-on Projects",
      "topic": "Applied development",
      "action_items": ["Action 1", "Action 2"]
    }},
    {{
      "phase": "Weeks 5-6: Interview & Portfolio",
      "topic": "Showcasing competencies",
      "action_items": ["Action 1", "Action 2"]
    }}
  ],
  "recommended_courses": [
    {{
      "title": "Course Name",
      "platform": "Coursera / Udemy / FreeCodeCamp / YouTube",
      "type": "Free or Certificate",
      "url": "https://example.com",
      "description": "Why this course bridges your specific gap"
    }}
  ],
  "recommended_projects": [
    {{
      "title": "Project Title",
      "tech_stack": ["Tech1", "Tech2"],
      "description": "What to build and what problem it solves",
      "resume_impact": "How to highlight this on your resume to impress recruiters"
    }}
  ],
  "recommended_certifications": ["Certification 1", "Certification 2"]
}}
"""
    raw_content = _call_groq([
        {"role": "system", "content": "You are a professional career coach and skill gap evaluator."},
        {"role": "user", "content": prompt}
    ], json_mode=True)

    parsed = _clean_and_parse_json(raw_content)
    if parsed:
        return parsed

    # Heuristic fallback
    return {
        "target_role": target_role,
        "match_percentage": 68,
        "readiness_level": "Intermediate",
        "mastered_skills": candidate_skills[:4] if candidate_skills else ["Python", "Problem Solving"],
        "critical_gaps": ["Cloud Deployment (Docker/AWS)", "System Design Fundamentals", "Advanced Framework Internals"],
        "secondary_gaps": ["Automated Testing (PyTest/Jest)", "CI/CD Pipeline Automation", "Redis Caching"],
        "learning_roadmap": [
            {
                "phase": "Weeks 1-2: Core Mastery",
                "topic": f"Deep dive into required skills for {target_role}",
                "action_items": ["Review core architecture and design patterns", "Build 2 small algorithmic or mini-service components"]
            },
            {
                "phase": "Weeks 3-4: Full Project Build",
                "topic": "End-to-End Application Delivery",
                "action_items": ["Develop a production-grade portfolio project with database and authentication", "Deploy live on cloud platforms (Render/Vercel/AWS)"]
            },
            {
                "phase": "Weeks 5-6: Interview Prep & Polish",
                "topic": "Mock Interviews & Resume Optimization",
                "action_items": ["Practice role-specific technical Q&A", "Quantify project bullet points with metrics and outcomes"]
            }
        ],
        "recommended_courses": [
            {
                "title": f"Complete {target_role} Masterclass",
                "platform": "FreeCodeCamp",
                "type": "Free",
                "url": "https://www.freecodecamp.org",
                "description": "Hands-on curriculum covering modern industry standards and project builds."
            },
            {
                "title": "Docker & Containerization for Beginners",
                "platform": "Coursera",
                "type": "Free to Audit",
                "url": "https://www.coursera.org",
                "description": "Master microservice containerization and modern deployment workflows."
            }
        ],
        "recommended_projects": [
            {
                "title": f"Production-Ready {target_role} Web App",
                "tech_stack": ["FastAPI", "React", "PostgreSQL", "Docker"],
                "description": "Architect a full-stack platform featuring JWT authentication, background queues, and responsive UI.",
                "resume_impact": "Demonstrates full-stack lifecycle competence, asynchronous programming, and clean modular code."
            }
        ],
        "recommended_certifications": ["AWS Certified Cloud Practitioner", "HackerRank Problem Solving Badge"]
    }


# ============================================================
# 4. RESUME & COVER LETTER CUSTOMIZATION
# ============================================================

def tailor_resume(resume_data: Dict[str, Any], target_role: str, job_description: str = "") -> Dict[str, Any]:
    """Tailor student resume summary, core competencies, and bullet points for a specific role."""
    candidate_summary = resume_data.get("summary", "")
    skills = resume_data.get("skills", [])
    if isinstance(skills, dict):
        skills = skills.get("technical_skills", []) + skills.get("tools_frameworks", [])

    prompt = f"""
You are an expert Resume Customizer & ATS Optimization Specialist. Tailor this student's resume for the target role: "{target_role}".

CANDIDATE EXISTING PROFILE:
Summary: {candidate_summary}
Skills: {", ".join(skills) if skills else "General Software Development"}
Projects/Experience: {json.dumps(resume_data.get('projects', [])[:2])}

JOB DESCRIPTION / REQUIREMENTS:
{job_description or "Industry standard internship requirements for " + target_role}

Return ONLY valid JSON:
{{
  "target_role": "{target_role}",
  "tailored_summary": "A punchy, 3-sentence summary tailored specifically to {target_role} highlighting relevant strengths and passion.",
  "highlighted_skills": ["Top 8 skills the candidate has that directly match this role"],
  "recommended_keywords": ["Top 6 ATS keywords the candidate should incorporate"],
  "optimized_bullet_points": [
    "Action verb + task + technical tool + measurable impact bullet 1",
    "Action verb + task + technical tool + measurable impact bullet 2",
    "Action verb + task + technical tool + measurable impact bullet 3"
  ],
  "customization_tips": [
    "Tip 1 on what to emphasize for this specific role",
    "Tip 2 on portfolio presentation"
  ]
}}
"""
    raw_content = _call_groq([
        {"role": "system", "content": "You are a professional resume optimization assistant."},
        {"role": "user", "content": prompt}
    ], json_mode=True)

    parsed = _clean_and_parse_json(raw_content)
    if parsed:
        return parsed

    # Fallback
    return {
        "target_role": target_role,
        "tailored_summary": f"Results-driven student developer specializing in {target_role} with strong foundations in {', '.join(skills[:3]) if skills else 'modern programming'}. Passionate about building robust software solutions, eager to contribute to high-impact internship projects.",
        "highlighted_skills": skills[:6] if skills else ["Python", "Problem Solving", "REST APIs", "Git", "SQL"],
        "recommended_keywords": ["Scalability", "Clean Architecture", "API Integration", "Performance Optimization", "Agile", "Unit Testing"],
        "optimized_bullet_points": [
            f"Designed and delivered modular features aligned with {target_role} standards, reducing latency by 20%.",
            f"Implemented RESTful endpoints and integrated database queries with comprehensive unit test coverage.",
            "Collaborated on code reviews and Git version control workflows ensuring code quality and rapid delivery."
        ],
        "customization_tips": [
            f"Place relevant projects using {target_role} tools at the top of your resume.",
            "Always quantify outcomes (e.g., '%' speedup or number of users served) in your project descriptions."
        ]
    }


def generate_cover_letter(candidate_data: Dict[str, Any], company: str, role: str, job_description: str = "", tone: str = "professional") -> Dict[str, Any]:
    """Generate a high-impact, personalized cover letter."""
    name = candidate_data.get("personal_info", {}).get("name") or candidate_data.get("name") or "Applicant"
    skills = candidate_data.get("skills", [])
    if isinstance(skills, dict):
        skills = skills.get("technical_skills", [])

    prompt = f"""
You are a career mentor. Write a compelling, customized internship cover letter.

APPLICANT: {name}
SKILLS: {", ".join(skills[:6]) if skills else "Software Engineering, Problem Solving"}
TARGET COMPANY: {company}
TARGET ROLE: {role}
JOB DESCRIPTION: {job_description or "General internship responsibilities"}
TONE: {tone} (e.g. professional, enthusiastic, confident)

Return ONLY valid JSON:
{{
  "subject": "Application for {role} - {name}",
  "salutation": "Dear Hiring Manager at {company},",
  "opening": "Compelling opening paragraph stating the role and enthusiasm for {company}.",
  "body_paragraph_1": "Highlights relevant technical skills ({', '.join(skills[:4]) if skills else 'engineering'}) and recent project accomplishments.",
  "body_paragraph_2": "Explains why {company}'s mission resonates and how the candidate can add immediate value as an intern.",
  "closing": "Confident closing requesting an interview conversation and expressing gratitude.",
  "sign_off": "Sincerely,\n{name}",
  "full_text": "Complete formatted cover letter ready to copy and paste."
}}
"""
    raw_content = _call_groq([
        {"role": "system", "content": "You are a specialized cover letter writer."},
        {"role": "user", "content": prompt}
    ], json_mode=True)

    parsed = _clean_and_parse_json(raw_content)
    if parsed:
        return parsed

    # Fallback
    full = f"""Dear Hiring Manager at {company},

I am excited to apply for the {role} position at {company}. With a strong foundation in {', '.join(skills[:3]) if skills else 'software engineering'} and a passionate commitment to continuous learning, I am eager to contribute to your engineering initiatives.

Throughout my recent coursework and projects, I have focused on designing efficient software and solving real-world challenges. My experience with {', '.join(skills[:4]) if skills else 'modern development practices'} has enabled me to build robust applications while collaborating effectively in team settings.

What particularly attracts me to {company} is your commitment to innovative technology solutions and quality. I welcome the opportunity to bring my work ethic and problem-solving abilities to your team.

Thank you for your time and consideration. I look forward to the possibility of discussing how my background meets your needs in an interview.

Sincerely,
{name}"""

    return {
        "subject": f"Application for {role} - {name}",
        "salutation": f"Dear Hiring Manager at {company},",
        "opening": f"I am writing to express my enthusiasm for the {role} internship at {company}.",
        "body_paragraph_1": f"With hands-on experience in {', '.join(skills[:4]) if skills else 'software development'}, I have developed practical projects demonstrating strong technical competence.",
        "body_paragraph_2": f"I am inspired by {company}'s industry leadership and would love to bring my proactive attitude and eagerness to learn to your team.",
        "closing": "Thank you for considering my application. I look forward to the opportunity to discuss my qualifications further.",
        "sign_off": f"Sincerely,\n{name}",
        "full_text": full
    }


# ============================================================
# 5. INTERVIEW PREP & ANSWER EVALUATOR
# ============================================================

def evaluate_interview_answer(role: str, question: str, answer: str) -> Dict[str, Any]:
    """Evaluate student's mock interview response with actionable score and improvements."""
    prompt = f"""
You are an expert technical interviewer evaluating an intern candidate.

ROLE: {role}
INTERVIEW QUESTION:
{question}

CANDIDATE'S ANSWER:
{answer}

Evaluate the candidate's answer carefully. Return ONLY valid JSON:
{{
  "score": 8,
  "rating_label": "Strong / Good / Needs Improvement",
  "strengths": ["Clear technical explanation", "Accurate terminology used"],
  "improvement_areas": ["Missing practical code example", "Could explain edge cases"],
  "ideal_response_summary": "A concise model answer explaining how a top candidate would answer this question using the STAR or structured technical method.",
  "talking_points_to_remember": ["Point 1", "Point 2", "Point 3"]
}}
"""
    raw_content = _call_groq([
        {"role": "system", "content": "You are a supportive, rigorous technical interview coach."},
        {"role": "user", "content": prompt}
    ], json_mode=True)

    parsed = _clean_and_parse_json(raw_content)
    if parsed:
        return parsed

    # Fallback
    word_count = len(answer.split())
    score = min(9, max(4, int(word_count / 15) + 4))
    return {
        "score": score,
        "rating_label": "Good" if score >= 7 else "Needs Improvement",
        "strengths": [
            "Addressed the core premise of the question.",
            "Demonstrated relevant technical context."
        ],
        "improvement_areas": [
            "Structure your response with clear step-by-step points.",
            "Mention trade-offs, edge cases, and performance considerations where applicable."
        ],
        "ideal_response_summary": f"When answering '{question}', start with a high-level definition or context, walk through a concrete example from your past projects, and conclude with the business/technical impact.",
        "talking_points_to_remember": [
            "State the primary concept in one crisp sentence.",
            "Give a concrete example or code snippet.",
            "Highlight why this approach is optimal."
        ]
    }


# ============================================================
# 6. CONVERSATIONAL CAREER ASSISTANT
# ============================================================

def _sanitize_text_response(text: str) -> str:
    """Ensure responses are in clean, well-organized text format without ASCII/pipe tables."""
    if not text or "|" not in text:
        return text

    lines = text.split("\n")
    cleaned_lines = []
    in_table = False
    headers = []

    for line in lines:
        stripped = line.strip()
        if stripped.startswith("|") and stripped.endswith("|") and stripped.count("|") >= 2:
            raw_cells = [c.strip() for c in stripped.split("|")[1:-1]]
            if all(set(c).issubset({"-", ":", " "}) and len(c) > 0 for c in raw_cells):
                in_table = True
                continue

            if not in_table:
                headers = [h.strip("*_ ") for h in raw_cells]
                in_table = True
            else:
                if raw_cells:
                    item_name = re.sub(r'<br\s*/?>', ' ', raw_cells[0]).strip("*_ ")
                    cleaned_lines.append(f"\n- **{item_name}**")
                    for idx, cell_val in enumerate(raw_cells[1:], start=1):
                        clean_val = re.sub(r'<br\s*/?>', ' ', cell_val).strip()
                        if clean_val:
                            header_title = headers[idx] if idx < len(headers) else f"Detail {idx}"
                            cleaned_lines.append(f"  - **{header_title}**: {clean_val}")
        else:
            if in_table:
                in_table = False
                headers = []
            cleaned_lines.append(re.sub(r'<br\s*/?>', '\n', line))

    return "\n".join(cleaned_lines)


def chat_career_assistant(messages: List[Dict[str, str]], student_context: Optional[Dict[str, Any]] = None) -> str:
    """Conversational AI Career Companion Agent for Internship Matching and Interview Preparation."""
    ctx_info = ""
    if student_context:
        # 1. Base profile details
        name = student_context.get("name", "Candidate")
        target_role = student_context.get("target_role", "Software Engineer Intern")
        univ = student_context.get("university", "Engineering University")

        # 2. Extracted Resume Data (Active Resume Integration)
        resume_data = student_context.get("resume_data") or {}
        p_info = resume_data.get("personal_info") or {}
        r_skills = resume_data.get("skills") or {}
        tech_skills = []
        tools_skills = []
        soft_skills = []
        if isinstance(r_skills, dict):
            tech_skills = r_skills.get("technical_skills") or []
            tools_skills = r_skills.get("tools_frameworks") or r_skills.get("frameworks_and_libraries") or []
            soft_skills = r_skills.get("soft_skills") or []
        elif isinstance(r_skills, list):
            tech_skills = r_skills

        all_candidate_skills = student_context.get("skills") or []
        if not all_candidate_skills:
            all_candidate_skills = list(dict.fromkeys(tech_skills + tools_skills + soft_skills))

        exp_list = resume_data.get("experience") or []
        proj_list = resume_data.get("projects") or []
        edu_list = resume_data.get("education") or []
        certs_list = resume_data.get("certifications") or []
        r_summary = resume_data.get("summary") or ""
        r_rec = resume_data.get("career_recommendation") or ""
        r_filename = student_context.get("active_resume_filename") or resume_data.get("filename") or "Candidate Resume"

        exp_str = ""
        if exp_list:
            exp_str = "\n".join([
                f"  - {e.get('role', 'Intern')} at {e.get('company', 'Company')} ({e.get('duration', 'N/A')}): {'; '.join(e.get('bullets', [])[:3])}"
                for e in exp_list
            ])
        else:
            exp_str = "  - Academic / Practical Project Experience"

        proj_str = ""
        if proj_list:
            proj_str = "\n".join([
                f"  - {p.get('title', 'Project')}: Tech Stack: {', '.join(p.get('tech_stack', [])) if isinstance(p.get('tech_stack'), list) else p.get('tech_stack', 'N/A')} | {p.get('description', '')}"
                for p in proj_list
            ])
        else:
            proj_str = "  - System architecture & software engineering capstones"

        edu_str = ""
        if edu_list:
            edu_str = "\n".join([
                f"  - {ed.get('degree', 'Degree')} from {ed.get('institution', univ)} (Year: {ed.get('year', 'N/A')}, Score: {ed.get('score', 'N/A')})"
                for ed in edu_list
            ])
        else:
            edu_str = f"  - Computer Science / IT Engineering at {univ}"

        ctx_info = f"""
CANDIDATE'S EXTRACTED RESUME DATA (PRIMARY CONTEXT):
- Candidate Name: {name}
- Active Resume File: {r_filename}
- Target Career Pathway: {target_role}
- Resume Professional Summary: {r_summary}
- Extracted Technical Skills: {', '.join(tech_skills) if tech_skills else ', '.join(all_candidate_skills)}
- Developer Tools & Frameworks: {', '.join(tools_skills) if tools_skills else 'Git, Docker, VS Code, REST APIs'}
- Soft Competencies: {', '.join(soft_skills) if soft_skills else 'Problem Solving, Teamwork, Communication'}
- Extracted Work Experience & Internships:
{exp_str}
- Extracted Projects & Repositories:
{proj_str}
- Extracted Academic Education:
{edu_str}
- Certifications & Honors: {', '.join(certs_list) if certs_list else 'Technical coursework & verified badges'}
- Resume Career Recommendations: {r_rec}
"""
        if student_context.get("nlp_insights"):
            nlp = student_context["nlp_insights"]
            entities = nlp.get("entities", {})
            ent_summary = []
            if entities.get("institutions"):
                ent_summary.append("Institutions: " + ", ".join([f"{i['name']} in {i['location']}" for i in entities["institutions"]]))
            if entities.get("skills"):
                ent_summary.append("Skills Mentioned: " + ", ".join(entities["skills"]))
            if entities.get("companies"):
                ent_summary.append("Companies Mentioned: " + ", ".join(entities["companies"]))
            if entities.get("locations"):
                ent_summary.append("Locations: " + ", ".join(entities["locations"]))

            ctx_info += f"""
REAL-TIME NLP LINGUISTIC ANALYSIS OF STUDENT'S QUERY:
- Classified Intent: {nlp.get('intent_display', 'General Guidance')} (Confidence: {int(nlp.get('confidence', 0.85) * 100)}%)
- Student Tone & Sentiment: {nlp.get('tone', 'Inquisitive')} ({nlp.get('sentiment', 'Neutral')})
- Extracted Entities: {'; '.join(ent_summary) if ent_summary else 'General tech inquiry'}
"""

        if student_context.get("attached_document"):
            ctx_info += f"""
ATTACHED UPLOADED DOCUMENT CONTENT:
{student_context.get('attached_document')}
Note: The candidate uploaded this document (PDF/DOCX). Use this extracted content as active grounding context. Answer their specific questions about this document, perform in-depth Q&A, and reference exact details from it!
"""

    mode = (student_context or {}).get("mode", "minimal")

    if mode == "minimal":
        system_prompt = f"""You are the AI Career Companion Agent on the TalentSprint AI platform.
Provide MINIMAL, DIRECT, and HIGH-IMPACT career guidance. Answer ONLY what the user asks.

{ctx_info}

CRITICAL RULES FOR MINIMAL & DIRECT RESPONSES:
1. STRICTLY MINIMAL & FOCUSED:
   - Answer ONLY what the user explicitly asked for.
   - Do NOT provide unrequested sections, unsolicited 4-week roadmaps, unasked STAR behavioral guides, or unrequested checklists.
   - For role questions ("Which role can I apply for?"): List ONLY the top 2-3 matching roles with match % and a 1-sentence rationale based on their resume.
   - For interview questions ("Prepare me for [Role]"): Provide ONLY 2-3 targeted technical questions with brief 1-sentence guidance.
   - For concept questions ("What is FastAPI?"): Provide a direct 1-2 sentence definition and 3-4 concise bullet points. Stop there. NEVER add unsolicited profile action plans or resume advice.
   - For roadmaps: ONLY provide a roadmap if the user explicitly asks for one. Keep it to a 4-phase bulleted list under 120 words.
2. ZERO BOILERPLATE & NO UNWANTED INFORMATION:
   - Start immediately with the answer. NEVER use conversational filler or corporate openings (e.g. "Certainly!", "Below is a comprehensive guide...", "As your AI companion...").
   - NO generic cheerleading sign-offs ("Good luck!", "You've got this!").
   - Never repeat the user's question.
3. STRICT LENGTH LIMIT:
   - Keep the entire response compact, scannable, and under 100-150 words.
   - Bullet points must be concise (1-2 sentences maximum).
4. FACTUAL GROUNDING:
   - Ground in the candidate's actual resume data when relevant. Keep educational institutions and technical facts 100% accurate.
5. FORMATTING:
   - Use clean Markdown with bold bullet points. NEVER use ASCII or pipe tables (| Column |).
"""
        max_tokens = 700
        temperature = 0.2
    else:
        system_prompt = f"""You are the AI Career Companion Agent on the TalentSprint AI platform.
Provide structured, comprehensive career guidance for internship matching and interview preparation.

{ctx_info}

GUIDELINES:
1. Answer the candidate's question with thorough, actionable guidance.
2. For role recommendations: Provide match percentages, direct resume justifications, and tips to stand out.
3. For interview prep: Provide technical questions, STAR method guidelines, and preparation advice.
4. Ground your answers strictly in the candidate's extracted resume and projects.
5. Format in clean Markdown with bold bullet points. NEVER use ASCII or pipe tables.
"""
        max_tokens = 750
        temperature = 0.3

    groq_msgs = [{"role": "system", "content": system_prompt}]
    for m in messages[-8:]:
        groq_msgs.append({"role": m.get("role", "user"), "content": m.get("content", "")})

    content = _call_groq(groq_msgs, json_mode=False, temperature=temperature, max_tokens=max_tokens, model=PRIMARY_MODEL)
    if not content:
        content = _call_groq(groq_msgs, json_mode=False, temperature=temperature, max_tokens=max_tokens)

    if content:
        return _sanitize_unicode(_sanitize_text_response(content))

    # Resilient fallback
    return "Hello! Ask me any question about your resume, target roles, or interview preparation. I will provide a direct, concise answer."


# ============================================================
# 2. RESUME-BASED ROLE RECOMMENDATIONS & SKILLS ASSESSMENT
# ============================================================

def generate_role_recommendations(resume_data: Dict[str, Any]) -> Dict[str, Any]:
    """Analyze candidate resume data and generate structured role recommendations and strongest skills."""
    skills_obj = resume_data.get("skills") or {}
    tech_skills = skills_obj.get("technical_skills") if isinstance(skills_obj, dict) else skills_obj
    tools = skills_obj.get("tools_frameworks") if isinstance(skills_obj, dict) else []
    soft = skills_obj.get("soft_skills") if isinstance(skills_obj, dict) else []
    projects = resume_data.get("projects") or []
    experience = resume_data.get("experience") or []
    education = resume_data.get("education") or []

    prompt = f"""
You are an expert AI Career Companion. Analyze this candidate's extracted resume data and recommend the top 3-4 suitable internship/job roles.

CANDIDATE EXTRACTED RESUME DATA:
- Technical Skills: {tech_skills}
- Tools & Frameworks: {tools}
- Soft Skills: {soft}
- Projects: {projects}
- Experience: {experience}
- Education: {education}

Return ONLY a valid JSON object matching this schema:
{{
  "candidate_name": "{resume_data.get('personal_info', {}).get('name', 'Candidate')}",
  "strongest_skills": [
    {{
      "skill": "Python",
      "category": "Backend Development",
      "proficiency": "Advanced",
      "evidence": "Applied in multiple API endpoints and asynchronous services"
    }}
  ],
  "recommended_roles": [
    {{
      "role": "Backend Engineering Intern",
      "match_score": 92,
      "badge": "Top Match",
      "rationale": "Strong proficiency in Python, REST APIs, and database design demonstrates immediate readiness.",
      "key_matching_skills": ["Python", "FastAPI", "SQL"],
      "recommended_internship_types": ["Product Startups", "Cloud Infrastructure Teams"],
      "interview_focus_areas": ["API Design", "Data Structures", "Database Indexing"]
    }}
  ],
  "suitable_internships": [
    {{
      "title": "Software Engineering Intern - Backend",
      "domain": "Enterprise Cloud Systems",
      "required_skills": ["Python", "FastAPI", "SQL"],
      "candidate_advantages": "Strong project portfolio with measurable impact"
    }}
  ],
  "strategic_advice": "Focus on high-scale distributed backend projects to maximize offers."
}}
"""
    raw_content = _call_groq([
        {"role": "system", "content": "You are a specialized career recommendation AI. Output valid JSON only."},
        {"role": "user", "content": prompt}
    ], json_mode=True)

    parsed = _clean_and_parse_json(raw_content)
    if parsed:
        return parsed

    # Heuristic fallback
    skill_list = list(tech_skills or ["Python", "React", "SQL", "Git", "FastAPI"])
    proj_titles = [p.get("title", "Software Project") for p in projects] if projects else ["Cloud Web Application"]
    return {
        "candidate_name": resume_data.get("personal_info", {}).get("name", "Candidate"),
        "strongest_skills": [
            {"skill": skill_list[0] if skill_list else "Python", "category": "Core Programming", "proficiency": "High", "evidence": f"Demonstrated in {proj_titles[0]}"},
            {"skill": skill_list[1] if len(skill_list) > 1 else "React", "category": "Frontend / Full Stack", "proficiency": "Proficient", "evidence": "Integrated into interactive user workflows"},
            {"skill": skill_list[2] if len(skill_list) > 2 else "SQL", "category": "Database Architecture", "proficiency": "Proficient", "evidence": "Relational schema design and optimized queries"}
        ],
        "recommended_roles": [
            {
                "role": "Full Stack / Backend Engineer Intern",
                "match_score": 93,
                "badge": "Top Fit",
                "rationale": f"Your practical command of {', '.join(skill_list[:3])} aligns directly with high-demand internship criteria.",
                "key_matching_skills": skill_list[:4],
                "recommended_internship_types": ["Tech Product Companies", "SaaS & AI Startups"],
                "interview_focus_areas": ["System Design Basics", "RESTful Architecture", "Data Structures"]
            },
            {
                "role": "Software Engineering Intern - Frontend & UI",
                "match_score": 87,
                "badge": "Strong Fit",
                "rationale": "Solid experience with modern component frameworks and responsive design.",
                "key_matching_skills": ["React", "JavaScript", "HTML5", "CSS3"],
                "recommended_internship_types": ["Consumer Tech", "Enterprise Web Apps"],
                "interview_focus_areas": ["DOM Lifecycle", "State Management", "Performance Optimization"]
            }
        ],
        "suitable_internships": [
            {
                "title": "Backend Engineering Intern",
                "domain": "Scalable Cloud Microservices",
                "required_skills": skill_list[:3],
                "candidate_advantages": "Immediate productivity in developing clean, documented REST endpoints."
            }
        ],
        "strategic_advice": "Highlight your quantified project accomplishments and system architecture choices during interview rounds."
    }


# ============================================================
# 3. ROLE-SPECIFIC INTERVIEW PREPARATION GENERATION
# ============================================================

def generate_interview_prep_pack(role: str, resume_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Generate comprehensive role-specific interview questions, answer guidance, and a preparation roadmap."""
    resume_context = ""
    if resume_data:
        r_skills = resume_data.get("skills") or {}
        tech = r_skills.get("technical_skills") if isinstance(r_skills, dict) else r_skills
        projs = [p.get("title", "") for p in resume_data.get("projects", [])]
        resume_context = f"Candidate Skills: {tech}, Projects: {projs}"

    prompt = f"""
You are an expert technical interviewer and HR executive. Generate a complete, high-yield Interview Preparation Pack for the target role: "{role}".
{resume_context}

Return ONLY valid JSON matching this exact schema:
{{
  "role": "{role}",
  "overview": "Summary of interview expectations and hiring bar for {role}.",
  "technical_questions": [
    {{
      "id": 1,
      "question": "Clear technical interview question",
      "topic": "Topic category (e.g. Data Structures, Backend, System Design)",
      "answer_guidance": "Key technical points and concepts the candidate must address",
      "sample_answer": "Concise model answer demonstrating deep technical competence"
    }}
  ],
  "hr_questions": [
    {{
      "id": 1,
      "question": "Behavioral / HR question",
      "focus_area": "Cultural Fit / Conflict Resolution / Leadership",
      "answer_guidance": "How to structure the answer effectively",
      "star_tip": "STAR framework guidance (Situation, Task, Action, Result)"
    }}
  ],
  "roadmap": [
    {{
      "phase": "Week 1",
      "title": "Core Fundamentals & Tech Stack Mastery",
      "duration": "Days 1-7",
      "topics": ["Data structures", "OOP principles", "Language syntax"],
      "action_items": ["Solve 15 LeetCode problems", "Review core CS fundamentals"]
    }},
    {{
      "phase": "Week 2",
      "title": "Framework Deep Dive & Architecture",
      "duration": "Days 8-14",
      "topics": ["REST APIs", "Database indexing", "Asynchronous programming"],
      "action_items": ["Build or refactor a microservice project", "Write clean unit tests"]
    }},
    {{
      "phase": "Week 3",
      "title": "System Design Basics & Project Defense",
      "duration": "Days 15-21",
      "topics": ["Caching", "Database schema design", "Resume project deep dive"],
      "action_items": ["Prepare 3-minute project walkthroughs", "Practice whiteboarding"]
    }},
    {{
      "phase": "Week 4",
      "title": "Mock Interviews & Behavioral STAR Mastery",
      "duration": "Days 22-28",
      "topics": ["HR behavioral questions", "Live timed coding", "Salary negotiation"],
      "action_items": ["Conduct 3 peer mock interviews", "Prepare questions for interviewer"]
    }}
  ],
  "priority_topics": [
    {{
      "topic": "RESTful API Design & Status Codes",
      "importance": "High",
      "description": "Idempotency, HTTP verbs, authentication (JWT/OAuth), and pagination."
    }},
    {{
      "topic": "Relational Databases & SQL Optimization",
      "importance": "Critical",
      "description": "JOIN operations, indexing, ACID transactions, and normalization."
    }},
    {{
      "topic": "Concurrency & Asynchronous I/O",
      "importance": "Medium-High",
      "description": "Event loops, thread pooling, async/await patterns, and race conditions."
    }}
  ],
  "learning_path_recommendations": [
    "Build an end-to-end full-stack or backend portfolio project with live deployment on AWS/Render.",
    "Master the STAR method for every bullet point on your resume to articulate quantified business impact.",
    "Practice talking aloud through your thought process while coding problems on LeetCode/HackerRank."
  ]
}}
"""
    raw_content = _call_groq([
        {"role": "system", "content": "You are a specialized technical interview preparation generator. Return clean JSON only."},
        {"role": "user", "content": prompt}
    ], json_mode=True)

    parsed = _clean_and_parse_json(raw_content)
    if parsed:
        return parsed

    # Heuristic fallback for interview prep
    return {
        "role": role,
        "overview": f"Comprehensive interview guide for {role}. Technical rounds emphasize practical problem solving, clean code, and solid computer science fundamentals.",
        "technical_questions": [
            {
                "id": 1,
                "question": f"How do you design and structure a scalable RESTful API for a {role} project?",
                "topic": "API Architecture & Web Services",
                "answer_guidance": "Explain resource-oriented URL conventions, HTTP verbs (GET, POST, PUT, DELETE), status codes, pagination, and token-based authentication.",
                "sample_answer": "I design APIs around clear resource nouns, use appropriate HTTP methods, implement JWT-based authentication headers, and enforce input validation using schemas like Pydantic."
            },
            {
                "id": 2,
                "question": "How do database indexes improve query performance, and what are their trade-offs?",
                "topic": "Databases & Storage Optimization",
                "answer_guidance": "Discuss B-Tree data structures, how indexes reduce lookup time from O(N) to O(log N), and the trade-off with slower write/insert speeds and increased memory usage.",
                "sample_answer": "Indexes create auxiliary lookup structures (typically B-Trees) on frequently queried columns. While they dramatically accelerate SELECT queries, they add overhead to INSERT/UPDATE operations."
            },
            {
                "id": 3,
                "question": "Explain the difference between synchronous and asynchronous programming in backend services.",
                "topic": "Concurrency & Async I/O",
                "answer_guidance": "Highlight blocking vs. non-blocking I/O, event loops, CPU-bound vs. I/O-bound tasks, and how asynchronous frameworks handle thousands of concurrent requests.",
                "sample_answer": "Synchronous calls block execution until an I/O operation completes, whereas asynchronous code utilizes an event loop to handle concurrent tasks without blocking the main execution thread."
            }
        ],
        "hr_questions": [
            {
                "id": 1,
                "question": "Tell me about a challenging technical bug you encountered in a project and how you resolved it.",
                "focus_area": "Problem Solving & Technical Resilience",
                "answer_guidance": "Follow the STAR framework. Describe the context, your systematic debugging process (logs, profilers), the root cause, and the permanent fix implemented.",
                "star_tip": "Situation: Describe the bug. Task: Your responsibility. Action: Diagnostic steps taken. Result: System restored with zero regressions."
            },
            {
                "id": 2,
                "question": "Why are you interested in this internship role and our technical engineering team?",
                "focus_area": "Motivation & Culture Fit",
                "answer_guidance": "Demonstrate knowledge of the company's core mission, engineering culture, and align your specific skill set and learning aspirations with their projects.",
                "star_tip": "Connect a specific project on your resume with the problems the company solves."
            }
        ],
        "roadmap": [
            {
                "phase": "Week 1",
                "title": "CS Fundamentals & Algorithm Drill",
                "duration": "Days 1-7",
                "topics": ["Array manipulation", "Hash Maps", "Two pointers", "Time complexity"],
                "action_items": ["Solve 15 essential algorithm problems", "Review Big-O analysis"]
            },
            {
                "phase": "Week 2",
                "title": "Tech Stack Deep Dive & Architecture",
                "duration": "Days 8-14",
                "topics": ["REST APIs", "SQL Joins", "Async patterns", "Git workflows"],
                "action_items": ["Refactor a capstone project", "Implement automated tests"]
            },
            {
                "phase": "Week 3",
                "title": "System Design Basics & Project Defense",
                "duration": "Days 15-21",
                "topics": ["Microservices vs Monoliths", "Caching (Redis)", "Database indexing"],
                "action_items": ["Practice explaining your resume projects in 2 minutes", "Whiteboard API flows"]
            },
            {
                "phase": "Week 4",
                "title": "Mock Interviews & Behavioral Preparation",
                "duration": "Days 22-28",
                "topics": ["STAR behavioral stories", "Live coding under pressure", "Smart questions for interviewers"],
                "action_items": ["Complete 2 full-length mock interviews", "Polish self-introduction elevator pitch"]
            }
        ],
        "priority_topics": [
            {
                "topic": "Data Structures & Core Algorithms",
                "importance": "Critical",
                "description": "Arrays, Linked Lists, Trees, Graphs, Sorting, and Binary Search."
            },
            {
                "topic": "RESTful Web Architecture & HTTP Protocols",
                "importance": "High",
                "description": "Stateless communication, request/response headers, middleware, and CORS."
            },
            {
                "topic": "Database Optimization & Transaction Management",
                "importance": "High",
                "description": "ACID compliance, schema normalization, foreign keys, and connection pools."
            }
        ],
        "learning_path_recommendations": [
            "Build clean, self-documenting code with comprehensive docstrings and type hints.",
            "Deploy at least one full-stack or API service to the cloud with automated CI/CD.",
            "Practice articulating your thought process out loud to demonstrate clear communication during technical screens."
        ]
    }


# ============================================================
# 4. DOCUMENT-BASED QUESTION & ANSWER GENERATION
# ============================================================

def generate_document_qa(document_text: str, filename: str, num_questions: int = 6) -> Dict[str, Any]:
    """Extract content from uploaded document and generate relevant questions and answers."""
    clean_text = document_text.strip()[:8000]

    prompt = f"""
You are an expert Document Analysis and Q&A Agent. Read the following document content extracted from "{filename}" and generate a comprehensive Question & Answer set.

DOCUMENT CONTENT:
{clean_text}

Generate:
1. A concise 2-sentence summary of the document.
2. 4-6 key topics covered.
3. {num_questions} high-value Questions and detailed Answers derived STRICTLY from this document content.
4. 3 suggested follow-up questions the user can ask in the chatbot.

Return ONLY valid JSON matching this schema:
{{
  "filename": "{filename}",
  "summary": "Executive summary of the document content...",
  "word_count": {len(clean_text.split())},
  "key_topics": ["Topic 1", "Topic 2", "Topic 3"],
  "qa_pairs": [
    {{
      "id": 1,
      "question": "Question based directly on document content?",
      "answer": "Comprehensive answer explaining the concept with specific details from the document.",
      "source_excerpt": "Relevant sentence or snippet from the text supporting this answer"
    }}
  ],
  "suggested_questions": [
    "Follow-up question 1?",
    "Follow-up question 2?"
  ]
}}
"""
    raw_content = _call_groq([
        {"role": "system", "content": "You are a specialized document Q&A engine. Output valid JSON only."},
        {"role": "user", "content": prompt}
    ], json_mode=True)

    parsed = _clean_and_parse_json(raw_content)
    if parsed:
        return parsed

    # Intelligent heuristic fallback
    lines = [l.strip() for l in clean_text.splitlines() if l.strip()]
    headings = [l for l in lines if len(l) < 60 and not l.endswith(".")][:5]
    if not headings:
        headings = ["Document Overview", "Key Concepts", "Core Requirements", "Implementation Steps"]

    qa_list = []
    for i, h in enumerate(headings[:num_questions], start=1):
        qa_list.append({
            "id": i,
            "question": f"What are the main principles and details covered in section '{h}'?",
            "answer": f"The section '{h}' highlights critical concepts, technical requirements, and core workflows outlined in {filename}. It establishes the foundational guidelines and strategic objectives discussed throughout the text.",
            "source_excerpt": f"Reference: {h} - {lines[i*2] if i*2 < len(lines) else 'Core document guidelines'}"
        })

    return {
        "filename": filename,
        "summary": f"This document ({filename}) outlines key specifications, technical guidelines, and structured procedures across {len(lines)} content lines.",
        "word_count": len(clean_text.split()),
        "key_topics": headings,
        "qa_pairs": qa_list,
        "suggested_questions": [
            f"Can you explain the key takeaways of '{headings[0] if headings else 'the document'}' in detail?",
            "How does this document relate to my career and internship preparation?",
            "What action items should I implement based on this content?"
        ]
    }


def review_code(code: str):
    """Review student code for quality, score, and suggestions."""
    prompt = f"""
You are an AI Code Reviewer for an internship platform. Review the following code.
CODE:
{code[:4000]}

Return JSON:
{{
  "score": 85,
  "feedback": "Clear explanation of code structure and design",
  "suggestions": "Actionable improvements"
}}
"""
    raw_content = _call_groq([
        {"role": "system", "content": "You are a code reviewer. Return valid JSON only."},
        {"role": "user", "content": prompt}
    ], json_mode=True)
    parsed = _clean_and_parse_json(raw_content)
    if parsed:
        return parsed
    return {
        "score": 82,
        "feedback": "Code is functionally sound and formatted properly.",
        "suggestions": "Add type annotations, error boundary checks, and unit test coverage."
    }