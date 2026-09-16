# 🚀 AI Career Companion Agent
### Intelligent Internship Matching, ATS Resume Scoring & Interview Preparation Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.109.0-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.x-61DAFB.svg?logo=react&logoColor=black)](https://reactjs.org)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev)
[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB.svg?logo=python&logoColor=white)](https://www.python.org)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

An end-to-end full-stack AI career platform designed to empower students and job seekers through automated resume parsing, intelligent RAG-driven Q&A, hands-free voice dictation, ATS compatibility scoring, and 1-click executive CV generation.

---

## 🌐 Live Public Deployment (ngrok Tunnel)

- **Live Application URL**: [https://eclair-modulator-express.ngrok-free.dev](https://eclair-modulator-express.ngrok-free.dev)
- **Architecture**:
  - React 18 + Vite Frontend running locally, exposed via ngrok secure HTTPS tunnel.
  - FastAPI Python Backend (Uvicorn) with high-speed Groq LPU inference (`qwen/qwen3.8-27b`).
  - Seamless reverse proxying for all API routes and Single Page Application (SPA) navigation.

---

## 📁 Repository Structure

The project follows a clean monorepo architecture separating the backend REST API services from the frontend user interface:

```
.
├── 📂 backend/               # FastAPI Python Backend Service
│   ├── 📂 app/               # Application logic (routers, models, schemas, services)
│   │   ├── 📂 models/        # SQLAlchemy database models
│   │   ├── 📂 routers/       # REST API endpoints (Auth, Career Copilot, CV, etc.)
│   │   ├── 📂 schemas/       # Pydantic request & response validation
│   │   ├── 📂 services/      # Groq Qwen/Llama, ReportLab PDF, NLP & RAG matching
│   │   ├── 📂 utils/         # Security & JWT authorization utilities
│   │   ├── config.py         # Application configuration & .env loader
│   │   ├── database.py       # Database connection & session factory
│   │   └── main.py           # FastAPI entry point & CORS configuration
│   ├── 📂 tests/             # Automated test suite (pytest)
│   ├── 📂 docs/              # System & RAG documentation
│   ├── 📂 uploads/           # Ephemeral storage for uploaded resumes
│   ├── requirements.txt      # Python dependencies
│   └── .env.example          # Backend environment variables template
│
├── 📂 frontend/              # React 18 + Vite Web Application
│   ├── 📂 public/            # Static assets
│   ├── 📂 src/
│   │   ├── 📂 components/    # Reusable UI widgets (Sidebar, Layout, Copilot)
│   │   ├── 📂 pages/         # Application pages (Auth, Dashboard, CareerAssistant, Customizer)
│   │   ├── 📂 services/      # Axios HTTP client with JWT interceptor
│   │   ├── App.jsx           # Main routing & state
│   │   └── App.css           # Styling & print stylesheets
│   ├── package.json          # Node dependencies & build scripts
│   └── vite.config.js        # Vite dev server & backend reverse-proxy
│
├── 📄 .gitignore             # Unified Git ignore rules
├── 📄 LICENSE                # Open-source MIT License
└── 📄 README.md              # Project documentation & setup instructions
```

---

## 🌟 Key Features

- **🔐 Secure Authentication & Session Management**:
  - Encrypted credential registration with auto-redirect to login and pre-filled email.
  - JWT (JSON Web Token) bearer authorization with automatic client-side interceptors.
- **📄 Multi-Format Resume Ingestion**:
  - Drag-and-drop file upload supporting **PDF**, **DOCX**, and **TXT** formats up to 10 MB.
  - Spatial, multi-column text extraction using `pdfplumber` and `python-docx`.
- **🤖 Context-Grounded RAG Chatbot**:
  - Vector embeddings powered by SentenceTransformers (`all-MiniLM-L6-v2`).
  - High-speed LLM reasoning via Groq API (`qwen/qwen3.8-27b`).
  - Hallucination-resistant answers grounded strictly in the candidate's actual qualifications.
- **🎙️ Speech-to-Text Voice Dictation**:
  - Hands-free natural language question input via browser Web Speech API with live audio feedback.
- **📊 Automated ATS Resume Scorer**:
  - Evaluates keyword density, quantifiable metrics, section completeness, and action verbs.
  - Generates an actionable 0–100% ATS score with targeted improvement suggestions.
- **📝 Executive CV Builder & 1-Click PDF Generator**:
  - Interactive multi-section CV customizer with **Modern**, **Classic**, and **Minimal** templates.
  - High-definition, vector-crisp PDF generation powered by Python's `reportlab.platypus` engine.
- **💾 Multi-Format Chat Export**:
  - Download interview preparation dialogues into **PDF**, Word (**DOCX**), and plain text (**TXT**).

---

## 🚀 Running with ngrok Tunnel

### 1. Start Backend Server
```bash
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001
```

### 2. Start Frontend Dev Server
```bash
cd frontend
npm run dev
```

### 3. Launch ngrok HTTPS Tunnel
```bash
ngrok http http://127.0.0.1:5173 --url=eclair-modulator-express.ngrok-free.dev
```
Your application will be live at: [https://eclair-modulator-express.ngrok-free.dev](https://eclair-modulator-express.ngrok-free.dev)

### 1. Clone the Repository
```bash
git clone https://github.com/bharathkumarjm/Al-Career-Companion-Agent-for-Internship-Matching-and-Interview-Preparation.git
cd Al-Career-Companion-Agent-for-Internship-Matching-and-Interview-Preparation
```

### 2. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
# On Windows:
.\.venv\Scripts\activate
# On Linux/macOS:
# source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
copy .env.example .env

# Run FastAPI server
uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```
Interactive API documentation will be available at: [http://127.0.0.1:8001/docs](http://127.0.0.1:8001/docs)

### 3. Frontend Setup
```bash
cd frontend

# Install npm packages
npm install

# Launch Vite dev server
npm run dev
```
Open [http://127.0.0.1:5173](http://127.0.0.1:5173) in your browser.

---

## 🔌 API Reference Overview

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/health` | Health check endpoint for system uptime monitors | No |
| `POST` | `/api/auth/register` | Register new user account | No |
| `POST` | `/api/auth/login` | Authenticate user & return JWT token | No |
| `GET` | `/api/auth/me` | Retrieve authenticated user profile | Yes |
| `POST` | `/api/documents/upload` | Upload & parse resume (PDF/DOCX/TXT) | Yes |
| `POST` | `/api/assistant/chat` | AI Career Companion dialogue | Yes |
| `POST` | `/api/customization/download-cv-pdf` | Generate & download custom CV PDF | Yes |
| `POST` | `/api/export/chat` | Export conversation (PDF/DOCX/TXT) | Yes |

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.