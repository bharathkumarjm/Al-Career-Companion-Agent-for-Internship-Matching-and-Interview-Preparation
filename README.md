# 🚀 AI Career Companion Agent
### Intelligent Internship Matching, ATS Resume Scoring & Interview Preparation Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.109.0-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.x-61DAFB.svg?logo=react&logoColor=black)](https://reactjs.org)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev)
[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB.svg?logo=python&logoColor=white)](https://www.python.org)
[![Deployed on Railway](https://img.shields.io/badge/Deploy-Railway-0B0D0E.svg?logo=railway&logoColor=white)](https://railway.app)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

An end-to-end full-stack AI career platform designed to empower students and job seekers through automated resume parsing, intelligent RAG-driven Q&A, hands-free voice dictation, ATS compatibility scoring, and 1-click executive CV generation.

---

## 🌐 Live Deployments

- **Frontend Application**: [https://talentsprint-ai.netlify.app/](https://talentsprint-ai.netlify.app/)
- **Backend API**: [https://al-career-companion-agent-for-internship-matchin-production.up.railway.app/](https://al-career-companion-agent-for-internship-matchin-production.up.railway.app/)
- **API Documentation (Swagger)**: [https://al-career-companion-agent-for-internship-matchin-production.up.railway.app/docs](https://al-career-companion-agent-for-internship-matchin-production.up.railway.app/docs)
- **Health Check**: [https://al-career-companion-agent-for-internship-matchin-production.up.railway.app/health](https://al-career-companion-agent-for-internship-matchin-production.up.railway.app/health)

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
│   │   ├── 📂 services/      # Groq LLaMA-3, ReportLab PDF, NLP & RAG matching
│   │   ├── 📂 utils/         # Security & JWT authorization utilities
│   │   ├── config.py         # Application configuration & .env loader
│   │   ├── database.py       # Database connection & session factory
│   │   └── main.py           # FastAPI entry point & CORS configuration
│   ├── 📂 tests/             # Automated test suite (pytest)
│   ├── 📂 docs/              # System & RAG documentation
│   ├── 📂 uploads/           # Ephemeral storage for uploaded resumes
│   ├── Procfile              # Railway process runner
│   ├── railway.json          # Railway service deployment configuration
│   ├── nixpacks.toml         # Nixpacks build specification for Python 3.11
│   ├── runtime.txt           # Python runtime version
│   ├── requirements.txt      # Python dependencies
│   └── .env.example          # Backend environment variables template
│
├── 📂 frontend/              # React 18 + Vite Web Application
│   ├── 📂 public/            # Static assets & _redirects (SPA routing)
│   ├── 📂 src/
│   │   ├── 📂 components/    # Reusable UI widgets (Sidebar, Layout, Copilot)
│   │   ├── 📂 pages/         # Application pages (Auth, Dashboard, Copilot, Customizer)
│   │   ├── 📂 services/      # Axios HTTP client with JWT interceptor
│   │   ├── App.jsx           # Main routing & state
│   │   └── App.css           # Styling & print stylesheets
│   ├── netlify.toml          # Netlify build configuration
│   ├── package.json          # Node dependencies & build scripts
│   └── vite.config.js        # Vite dev server & backend reverse-proxy
│
├── 📄 .gitignore             # Unified Git ignore rules
├── 📄 LICENSE                # Open-source MIT License
├── 📄 netlify.toml           # Root Netlify configuration
├── 📄 railway.json           # Root Railway monorepo deployment config
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
  - High-speed LLM reasoning via Groq API (LLaMA-3) and Google Gemini.
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

## 🚂 Deploying to Railway (Zero-Config Guide)

This repository includes native Railway configuration files (`railway.json`, `Procfile`, `nixpacks.toml`, and `runtime.txt`) for one-click deployment.

### Step 1: Deploy the Backend Service
1. Log in to [Railway](https://railway.app) and click **New Project**.
2. Select **Deploy from GitHub repo** and choose this repository:  
   `bharathkumarjm/Al-Career-Companion-Agent-for-Internship-Matching-and-Interview-Preparation`
3. Click on the newly created service $\rightarrow$ go to **Settings**:
   - Under **General** $\rightarrow$ **Root Directory**: Set to `/backend` (or leave blank; the root `railway.json` will automatically direct to `backend/`).
4. Go to **Variables** and add your environment variables:
   - `SECRET_KEY`: `InfosysAIInternship_2026_SecureKey_8392`
   - `DATABASE_URL`: `sqlite:///./test.db`
   - `GROQ_API_KEY`: *(your Groq API key)*
   - `PYTHONPATH`: `.`
5. Under **Settings** $\rightarrow$ **Networking**: Click **Generate Domain**.  
   Railway will provide your public backend URL (e.g., `https://web-production-xxxx.up.railway.app`).

### Step 2: Deploy the Frontend to Netlify
This repository includes `netlify.toml` and `_redirects` pre-configured for automatic Single Page App (SPA) routing:

1. Log in to [Netlify](https://app.netlify.com) and click **Add new site** $\rightarrow$ **Import an existing project**.
2. Connect your GitHub account and select this repository:  
   `bharathkumarjm/Al-Career-Companion-Agent-for-Internship-Matching-and-Interview-Preparation`
3. Netlify will auto-detect the configuration from `netlify.toml`:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist` (or `frontend/dist`)
4. Click **Add environment variables** and set:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://web-production-xxxx.up.railway.app` *(your Railway backend URL from Step 1, without a trailing slash)*
5. Click **Deploy Site**. Netlify will build and provide your production URL (e.g., `https://your-site.netlify.app`).

---

## 🚀 Local Development Setup

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
| `GET` | `/health` | Health check endpoint for Railway/uptime monitors | No |
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