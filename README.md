# 🚀 AI Career Companion Agent
### Intelligent Internship Matching, ATS Resume Scoring & Interview Preparation Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.109.0-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.x-61DAFB.svg?logo=react&logoColor=black)](https://reactjs.org)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev)
[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB.svg?logo=python&logoColor=white)](https://www.python.org)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

An end-to-end full-stack AI career platform designed to empower students and job seekers through automated resume parsing, intelligent RAG-driven Q&A, hands-free voice dictation, ATS compatibility scoring, and 1-click executive CV generation.

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

## 🏗️ Architecture & Workflow

```
Candidate / User
      │
      ▼
React 18 + Vite Frontend (Port 5173)
  ├── Drag & Drop File Upload
  ├── Speech-to-Text Voice Interface
  ├── Interactive CV Customizer Canvas
  └── Axios Interceptor with JWT Auth
      │
      ▼ REST APIs (Port 8001)
FastAPI Python Backend
  ├── Auth Service (bcrypt + JWT)
  ├── Document Parser (pdfplumber / python-docx)
  ├── Sliding-Window Text Chunker (500 chars, 100 overlap)
  ├── Embedding Service (all-MiniLM-L6-v2)
  ├── Vector Similarity Search & Context Filter
  ├── Groq / LLaMA-3 Prompt Inference Engine
  └── ReportLab Vector PDF Builder
      │
      ▼ Persistence
SQLite / SQLAlchemy ORM Database
```

---

## 💻 Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, React Router, Axios, CSS3, Web Speech API |
| **Backend** | FastAPI, Uvicorn, Python 3.10+, Pydantic v2 |
| **Database & ORM**| SQLite, SQLAlchemy |
| **Security & Auth**| OAuth2 Password Bearer, JWT (`python-jose`), `passlib[bcrypt]` |
| **AI / NLP / RAG** | SentenceTransformers (`all-MiniLM-L6-v2`), Groq API (LLaMA-3), Gemini |
| **Document Processing** | `pdfplumber`, `python-docx`, ReportLab Platypus |

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.10 or higher
- Node.js 18 or higher & npm

### 1. Clone the Repository
```bash
git clone https://github.com/bharathkumarjm/Al-Career-Companion-Agent-for-Internship-Matching-and-Interview-Preparation.git
cd Al-Career-Companion-Agent-for-Internship-Matching-and-Interview-Preparation
```

### 2. Backend Setup
```bash
# Create and activate virtual environment
python -m venv .venv
# On Windows:
.\.venv\Scripts\activate
# On Linux/macOS:
# source .venv/bin/activate

# Install backend dependencies
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

# Launch frontend development server
npm run dev
```
Open [http://127.0.0.1:5173](http://127.0.0.1:5173) in your browser.

---

## 🔌 API Reference Overview

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/register` | Register new user account | No |
| `POST` | `/api/auth/login` | Authenticate user & return JWT token | No |
| `GET` | `/api/auth/me` | Retrieve authenticated user profile | Yes |
| `POST` | `/api/documents/upload` | Upload & parse resume (PDF/DOCX/TXT) | Yes |
| `GET` | `/api/documents` | List uploaded user documents | Yes |
| `POST` | `/api/chat/ask` | Submit question to RAG AI Copilot | Yes |
| `POST` | `/api/customization/download-cv-pdf` | Generate & download custom CV PDF | Yes |
| `POST` | `/api/export/chat` | Export chat history (PDF/DOCX/TXT) | Yes |

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.