from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.models.user import User
from app.utils.auth import get_current_user
from app.services.groq_service import evaluate_interview_answer

router = APIRouter(
    prefix="/api/interview",
    tags=["Interview Preparation & Strategies"]
)


class EvaluateAnswerRequest(BaseModel):
    role: str
    question: str
    answer: str


ROLE_QUESTIONS = {
    "Backend Developer": {
        "technical": [
            {
                "id": "be_1",
                "question": "What is the difference between synchronous and asynchronous request handling in FastAPI / Node.js, and when should you use AsyncIO?",
                "topic": "Architecture & Concurrency",
                "difficulty": "Medium",
                "model_answer": "Synchronous code executes sequentially, blocking the thread while waiting for I/O operations like database queries or external API calls. Asynchronous code uses an event loop and non-blocking I/O (async/await), allowing the server to handle thousands of concurrent requests while awaiting I/O without spawning extra threads. Use AsyncIO when your application is I/O-bound (REST calls, DB queries). For CPU-bound tasks (image processing, ML model inference), use multiprocessing or background worker queues."
            },
            {
                "id": "be_2",
                "question": "Explain database indexing in PostgreSQL / MySQL. How does a B-Tree index speed up queries, and what is the trade-off with write operations?",
                "topic": "Database Optimization",
                "difficulty": "Medium",
                "model_answer": "A B-Tree index maintains a self-balancing sorted tree structure pointing to row locations on disk. It reduces lookup time complexity from O(N) full-table scans to O(log N). The trade-off is write overhead: every INSERT, UPDATE, or DELETE requires rebalancing and updating the index structure, and indexes consume additional storage space."
            },
            {
                "id": "be_3",
                "question": "How do you design a secure RESTful API with stateless authentication using JWT tokens?",
                "topic": "API Security",
                "difficulty": "Medium",
                "model_answer": "Stateless authentication with JWT involves signing a payload with a secret key or asymmetric RSA keypair. The client sends the token in the 'Authorization: Bearer <token>' header. Key security practices include: using HTTPS to prevent token sniffing, short expiration times (e.g. 15 minutes) coupled with refresh tokens, validating token signatures and claims on every protected route, storing tokens securely (HttpOnly SameSite cookies to mitigate XSS), and hashing passwords with bcrypt before DB storage."
            }
        ],
        "behavioral": [
            {
                "id": "be_beh_1",
                "question": "Tell me about a challenging bug you encountered in a project. How did you diagnose and resolve it?",
                "method": "STAR",
                "star_framework": {
                    "Situation": "Describe the project, feature, and unexpected behavior observed.",
                    "Task": "Explain your responsibility in isolating the root cause under time pressure.",
                    "Action": "Detail the debugging steps: checking logs, writing unit test reproducers, inspecting stack traces or SQL queries.",
                    "Result": "State the fix deployed, what tests verified it, and what monitoring or preventive steps you added."
                }
            },
            {
                "id": "be_beh_2",
                "question": "How do you handle receiving critical code review feedback on a pull request you worked hard on?",
                "method": "STAR",
                "star_framework": {
                    "Situation": "Mention a time a reviewer requested architectural changes or pointed out flaws.",
                    "Task": "Acknowledge the goal was producing the highest-quality codebase, not personal pride.",
                    "Action": "Explain how you asked clarifying questions, understood the rationale, and tested the suggestions.",
                    "Result": "Share the successful outcome: improved system performance or reliability and learning a new best practice."
                }
            }
        ]
    },
    "Generative AI & LLM Engineer": {
        "technical": [
            {
                "id": "ai_1",
                "question": "What is Retrieval-Augmented Generation (RAG) and how does it prevent LLM hallucinations compared to fine-tuning?",
                "topic": "RAG & Vector Search",
                "difficulty": "Medium",
                "model_answer": "RAG couples an information retrieval system (vector database with embeddings) with an LLM. Instead of relying solely on the model's static pre-trained weights, RAG dynamically retrieves relevant chunks from an up-to-date knowledge base and injects them into the prompt as context. This minimizes hallucinations by grounding answers in factual source documents. Fine-tuning adjusts model weights for style, tone, or specific syntax, but is costly and less effective for dynamic factual retrieval."
            },
            {
                "id": "ai_2",
                "question": "How do vector embeddings work, and what distance metrics (Cosine vs Euclidean vs Dot Product) are used for similarity search?",
                "topic": "Vector Embeddings",
                "difficulty": "Hard",
                "model_answer": "Vector embeddings represent unstructured text as dense high-dimensional numerical vectors where semantic similarity corresponds to geometric proximity. Cosine similarity measures the angle between vectors (normalized for length, ideal for text of varying length). Euclidean distance (L2) measures straight-line distance (sensitive to vector magnitude). Dot product measures both angle and magnitude (fastest when vectors are already unit-normalized)."
            }
        ],
        "behavioral": [
            {
                "id": "ai_beh_1",
                "question": "How do you test and ensure ethical guardrails and safety when deploying generative AI features?",
                "method": "STAR",
                "star_framework": {
                    "Situation": "Working on an LLM application that interacts directly with users.",
                    "Task": "Ensure responses do not leak sensitive prompt instructions or output biased/hallucinated claims.",
                    "Action": "Implemented input validation guardrails, prompt security checks, and automated temperature/max-token boundaries.",
                    "Result": "Achieved zero safety violations and consistently accurate, grounded user interactions."
                }
            }
        ]
    },
    "Full Stack Developer": {
        "technical": [
            {
                "id": "fs_1",
                "question": "Explain the React reconciliation algorithm and how the Virtual DOM uses keys to optimize list rendering.",
                "topic": "Frontend Core",
                "difficulty": "Medium",
                "model_answer": "React maintains an in-memory Virtual DOM. When state changes, React creates a new VDOM tree and diffs it with the previous one (reconciliation). Keys provide a stable identity across renders, allowing React to quickly identify which items were added, removed, or reordered without re-rendering the entire list or resetting component state."
            },
            {
                "id": "fs_2",
                "question": "What are CORS (Cross-Origin Resource Sharing) errors, and how do you properly configure them on the server?",
                "topic": "Web Security & Networking",
                "difficulty": "Medium",
                "model_answer": "CORS is a browser security mechanism that blocks web pages from making requests to a different domain, port, or protocol than the one that served the page. To fix this, the backend server must respond to preflight OPTIONS requests with appropriate headers: 'Access-Control-Allow-Origin', 'Access-Control-Allow-Methods', and 'Access-Control-Allow-Headers'."
            }
        ],
        "behavioral": [
            {
                "id": "fs_beh_1",
                "question": "Describe a scenario where you had to quickly learn a new technology or framework to deliver a project milestone.",
                "method": "STAR",
                "star_framework": {
                    "Situation": "Project required integrating an unfamiliar library or framework under deadline.",
                    "Task": "Need to quickly build a reliable proof-of-concept and integrate it into the main app.",
                    "Action": "Reviewed official documentation, built a small standalone prototype, and read source examples.",
                    "Result": "Successfully delivered the feature on schedule with zero breaking changes."
                }
            }
        ]
    },
    "Data Scientist / Analyst": {
        "technical": [
            {
                "id": "ds_1",
                "question": "What is the difference between Precision and Recall? When would you optimize for Recall over Precision?",
                "topic": "Machine Learning Metrics",
                "difficulty": "Medium",
                "model_answer": "Precision is True Positives / (True Positives + False Positives) — measuring how many predicted positive items were actually correct. Recall is True Positives / (True Positives + False Negatives) — measuring how many actual positive items were captured. Optimize for Recall when missing a positive case has severe consequences (e.g. cancer detection, fraud detection, safety monitoring)."
            },
            {
                "id": "ds_2",
                "question": "Explain how you handle skewed or missing data in a machine learning pipeline without introducing data leakage.",
                "topic": "Data Preprocessing",
                "difficulty": "Medium",
                "model_answer": "For missing values: impute using median/mode for numerical data or create a 'Missing' category for categoricals, or use KNN imputation. For skewed data: apply logarithmic or Box-Cox transformations. Crucially, all imputation and scaling parameters must be fitted ONLY on the training split and then applied to the validation/test split to prevent data leakage."
            }
        ],
        "behavioral": [
            {
                "id": "ds_beh_1",
                "question": "How do you communicate complex statistical findings or model predictions to non-technical business stakeholders?",
                "method": "STAR",
                "star_framework": {
                    "Situation": "Presenting data analysis results to managers with no math background.",
                    "Task": "Translate ROC-AUC and p-values into actionable business revenue or risk metrics.",
                    "Action": "Used visual charts, avoided technical jargon, and framed conclusions around business impact.",
                    "Result": "Stakeholders understood the recommendations and greenlit the proposed initiative."
                }
            }
        ]
    }
}

ROLE_STRATEGIES = {
    "Backend Developer": {
        "preparation_checklist": [
            "Review time & space complexity (Big-O) for array, hashmap, and tree operations.",
            "Be ready to write clean, modular REST endpoints with schema validation.",
            "Prepare to explain relational database design, indexing, and foreign keys.",
            "Understand HTTP status codes (200, 201, 400, 401, 403, 404, 500)."
        ],
        "interview_dos": [
            "Do think out loud while writing code or designing schemas.",
            "Do ask about input constraints and edge cases (null inputs, huge datasets).",
            "Do mention unit testing and error handling before the interviewer prompts you."
        ],
        "interview_donts": [
            "Don't jump straight into code without clarifying requirements.",
            "Don't ignore database query optimization or perform N+1 queries."
        ],
        "questions_to_ask_interviewer": [
            "What does the deployment and CI/CD workflow look like for interns on your team?",
            "How does your engineering team approach code reviews and architectural decisions?",
            "What is an example of an impactful project past interns have shipped?"
        ]
    },
    "Generative AI & LLM Engineer": {
        "preparation_checklist": [
            "Be crystal clear on RAG pipelines (chunking, embedding models, vector indexing).",
            "Understand prompt engineering strategies (few-shot, chain-of-thought, system prompts).",
            "Know how to benchmark and evaluate model latency vs accuracy trade-offs."
        ],
        "interview_dos": [
            "Do emphasize hallucination prevention and citation tracking.",
            "Do discuss cost optimization (token efficiency, context window management)."
        ],
        "interview_donts": [
            "Don't claim fine-tuning is always superior to RAG for knowledge updates.",
            "Don't treat LLMs as black boxes without considering safety and validation."
        ],
        "questions_to_ask_interviewer": [
            "What LLM architectures and vector databases are currently in your production stack?",
            "How does your team evaluate accuracy and safety in real-world user queries?"
        ]
    },
    "Full Stack Developer": {
        "preparation_checklist": [
            "Master React component lifecycle, custom hooks, and state management.",
            "Understand asynchronous JavaScript, Promises, and async/await.",
            "Review responsive layouts, CSS flexbox/grid, and browser performance."
        ],
        "interview_dos": [
            "Do build clean, reusable UI components with responsive design.",
            "Do demonstrate how frontend state connects cleanly to backend REST endpoints."
        ],
        "interview_donts": [
            "Don't neglect loading and error states in user interfaces.",
            "Don't hardcode API URLs or secrets in frontend repositories."
        ],
        "questions_to_ask_interviewer": [
            "How do your frontend and backend engineers collaborate during sprint cycles?",
            "What design system or component library does your team utilize?"
        ]
    }
}


@router.get("/roles")
def get_available_roles():
    return list(ROLE_QUESTIONS.keys())


@router.get("/questions")
def get_interview_questions(role: Optional[str] = "Backend Developer"):
    selected_role = role if role in ROLE_QUESTIONS else "Backend Developer"
    return {
        "role": selected_role,
        "technical_questions": ROLE_QUESTIONS[selected_role]["technical"],
        "behavioral_questions": ROLE_QUESTIONS[selected_role]["behavioral"]
    }


@router.get("/strategies")
def get_interview_strategies(role: Optional[str] = "Backend Developer"):
    selected_role = role if role in ROLE_STRATEGIES else "Backend Developer"
    return {
        "role": selected_role,
        "strategy": ROLE_STRATEGIES[selected_role]
    }


@router.post("/evaluate-answer")
def evaluate_mock_answer(
    payload: EvaluateAnswerRequest,
    current_user: User = Depends(get_current_user)
):
    if not payload.answer.strip():
        raise HTTPException(status_code=400, detail="Answer cannot be empty")

    evaluation = evaluate_interview_answer(
        role=payload.role,
        question=payload.question,
        answer=payload.answer
    )

    return evaluation
