# SkillMap — AI Adaptive Onboarding Engine

> Personalized learning roadmaps for every new hire, powered by AI.

[![Django](https://img.shields.io/badge/Django-4.2.7-green)](https://djangoproject.com)
[![Python](https://img.shields.io/badge/Python-3.13-blue)](https://python.org)
[![Groq](https://img.shields.io/badge/LLM-Groq%20Llama%203-orange)](https://groq.com)
[![React](https://img.shields.io/badge/Frontend-React.js-61DAFB)](https://reactjs.org)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

## Table of Contents

- [Problem Statement](#problem-statement)
- [Solution Overview](#solution-overview)
- [Live Demo](#live-demo)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Folder Structure](#folder-structure)
- [AI Pipeline](#ai-pipeline)
- [Skill Gap Analysis Logic](#skill-gap-analysis-logic)
- [RAG Implementation](#rag-implementation)
- [Scalability](#scalability)
- [Setup Instructions](#setup-instructions)
- [API Endpoints](#api-endpoints)
- [Sample API Response](#sample-api-response)
- [Datasets Used](#datasets-used)
- [Team](#team)

---

## Problem Statement

Current corporate onboarding relies on static, one-size-fits-all curricula. This results in:

- Experienced hires wasting weeks on content they already know
- Beginners getting overwhelmed by advanced modules they are not ready for
- HR teams spending excessive time manually designing training plans
- No personalization based on individual skill levels or role requirements

---

## Solution Overview

SkillMap is an AI-driven adaptive onboarding engine that:

1. Parses a candidate's resume to extract skills, experience level and scoring
2. Parses the target job description to extract required and preferred skills
3. Runs an intelligent skill gap analysis comparing the two
4. Generates a personalized, ordered learning roadmap using RAG and LLM
5. Provides a full reasoning trace explaining every course recommendation
6. Automatically adds prerequisite skills the candidate needs before advanced topics

The result is a targeted training plan unique to every individual — eliminating redundant training time while ensuring role-specific competency.

---

## Live Demo

Video walkthrough: [YouTube Link]

GitHub Repository: [GitHub Link]

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                        │
│              Upload Resume + Job Description            │
└──────────────────────┬──────────────────────────────────┘
                       │ POST /api/analyze/
                       ▼
┌─────────────────────────────────────────────────────────┐
│                  Django REST API                         │
│                   (Central Hub)                         │
└──────┬───────────────────────────────────────┬──────────┘
       │                                       │
       ▼                                       ▼
┌──────────────────┐                ┌─────────────────────┐
│  AI Pipeline     │                │    AI Engine         │
│  (parser.py)     │                │    (bo's RAG)        │
│                  │                │                      │
│ • Resume Parser  │                │ • Skill Graph        │
│ • JD Parser      │──── gaps ─────▶│ • RAG Retrieval      │
│ • Gap Analysis   │                │ • Path Generator     │
└──────────────────┘                │ • Reasoning Trace    │
                                    └─────────────────────┘
                                             │
                                             ▼
                                    ┌─────────────────────┐
                                    │   Course Catalog     │
                                    │  (course_catalog     │
                                    │      .json)          │
                                    └─────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React.js | File upload UI and results display |
| Backend | Django 4.2 + Django REST Framework | REST API and pipeline integration |
| LLM | Groq Llama 3.3 70B + Llama 3.1 8B | Resume parsing, JD parsing, gap analysis, path generation |
| PDF Parsing | pdfplumber | Extract raw text from uploaded PDFs |
| RAG | Custom implementation | Retrieval from verified course catalog |
| Skill Graph | Custom graph algorithm | Prerequisite skill ordering |
| CORS | django-cors-headers | Allow React to communicate with Django |
| Environment | python-dotenv | Secure API key management |
| API Client | Groq Python SDK | LLM API calls |

---



---

## AI Pipeline

The system runs a 5-stage pipeline on every request:

### Stage 1 — Resume Parsing
- pdfplumber extracts raw text from the uploaded resume PDF
- Groq Llama 3.1 8B analyzes the text using a custom HR scoring algorithm
- Extracts: name, skills, experience breakdown, projects, leadership, and seniority level
- Scoring system: real company experience = 10pts/year, internships = 5pts/year, projects with real users = 15pts

### Stage 2 — Job Description Parsing
- pdfplumber extracts raw text from the uploaded JD PDF
- Groq Llama 3.1 8B extracts required skills, preferred skills, tech stack, seniority level and responsibilities

### Stage 3 — Skill Gap Analysis
- LLM-based comparison of candidate skills vs job required skills
- Returns matching skills, missing required skills, missing preferred skills
- Generates a match score (0-100%) and match verdict
- Provides career advice tailored to the specific candidate and role

### Stage 4 — RAG Course Retrieval
- Skill gaps are passed to the prerequisite skill graph
- Graph automatically adds foundational skills the candidate needs first
- RAG pipeline retrieves only relevant courses from the verified course catalog
- Strictly no hallucination — every course must exist in the catalog

### Stage 5 — Learning Path Generation + Reasoning Trace
- Groq Llama 3.3 70B generates an ordered learning path from retrieved courses
- Path is ordered from foundational to advanced
- Every course recommendation includes a reasoning trace
- A full professional reasoning report is generated explaining the entire path

---

## Skill Gap Analysis Logic

The skill gap analysis uses a three step approach:

**Step 1 — LLM Extraction**
Both resume and JD are parsed by an LLM with strict JSON output formatting. The LLM identifies skills using natural language understanding rather than keyword matching, making it robust to varied resume formats.

**Step 2 — Intelligent Comparison**
A Groq LLM compares candidate skills against required skills, considering context and semantic similarity. A match score is calculated as a percentage of required skills the candidate already has.

**Step 3 — Severity Classification**
Gap severity is classified based on match score: 70%+ = low severity, 40-70% = medium severity, below 40% = high severity. Severity determines the depth of courses recommended (beginner only vs beginner through advanced).

---

## RAG Implementation

The RAG (Retrieval Augmented Generation) pipeline ensures zero hallucination:

**Retrieval** — For each skill gap, the RAG module searches the course catalog by skill name and level match. Only courses within the appropriate level range are retrieved.

**Prerequisite Expansion** — The skill graph automatically adds prerequisite skills. For example, if a candidate needs Troubleshooting, the graph adds Systems Analysis and Programming as prerequisites since those must come first.

**Augmented Generation** — Retrieved courses are formatted and injected directly into the LLM prompt. The LLM is explicitly instructed to recommend only from the provided list with no exceptions.

**Reasoning Trace** — For every course recommendation, the LLM generates a human readable explanation of why that specific course was chosen for that specific candidate at that specific stage in their learning journey.

---

## Scalability

SkillMap is designed to scale across dimensions:

**Course Catalog** — Adding new domains requires only a new JSON entry in course_catalog.json. No retraining or redeployment needed. The RAG engine adapts automatically.

**Cross Domain** — The same pipeline handles technical roles (Software Developer), business roles (HR Manager) and operational roles (Production Supervisor) without any code changes. The skill graph covers all three domains.

**LLM Agnostic** — The system is not tied to any specific LLM. Switching from Groq to OpenAI, Anthropic Claude, or a self-hosted model requires changing a single MODEL constant.

**Horizontal Scaling** — The Django REST API is stateless. It can be deployed behind a load balancer with multiple instances to handle thousands of concurrent onboarding requests.

**API First** — Any HR system, LMS platform, or enterprise application can integrate with SkillMap via the REST API without touching the frontend.

**Prerequisite Graph** — The skill graph is fully extensible. New skills and prerequisite relationships can be added as a single dictionary entry in skill_graph.py.

---

## Setup Instructions

### Prerequisites
- Python 3.10 or higher
- Node.js 18 or higher
- Groq API key (free at https://console.groq.com)

### Backend Setup

**Step 1 — Clone the repository**
```bash
git clone https://github.com/your-team/AI-Adaptive-Onboarding-Engine.git
cd AI-Adaptive-Onboarding-Engine/backend
```

**Step 2 — Create and activate virtual environment**
```bash
python -m venv venv

# Windows
.\venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
```

**Step 3 — Install dependencies**
```bash
pip install -r requirements.txt
```

**Step 4 — Configure environment variables**
```bash
cp .env.example .env
```

Open `.env` and fill in:
```
GROQ_API_KEY=your_groq_api_key_here
DEBUG=True
SECRET_KEY=your_django_secret_key_here
ALLOWED_HOSTS=localhost,127.0.0.1
```

**Step 5 — Run migrations**
```bash
python manage.py migrate
```

**Step 6 — Start the backend server**
```bash
python manage.py runserver
```

Backend runs at: `http://localhost:8000`

### Frontend Setup

```bash
cd ../Frontend+Roadmap
cd frontend
npm install
npm start
```

Frontend runs at: `http://localhost:3000`

---

## API Endpoints

### GET `/api/health/`
Check if the server is running.

**Response:**
```json
{
    "status": "ok",
    "message": "Adaptive Onboarding Engine API is running."
}
```

---

### POST `/api/analyze/`
Upload resume and job description PDFs. Returns complete skill gap analysis and personalized learning roadmap.

**Request:** `multipart/form-data`

| Field | Type | Description |
|---|---|---|
| `resume` | PDF File | Candidate's resume |
| `job_description` | PDF File | Target role's job description |

**Response:** See Sample API Response below.

---

## Sample API Response

```json
{
    "candidate_name": "John Smith",
    "candidate_level": "junior",
    "candidate_skills": ["Python", "Django", "Critical Thinking"],
    "job_title": "Senior AI/ML Engineer",
    "required_skills": ["Machine Learning", "Deep Learning", "NLP", "MLOps"],
    "matching_skills": ["Python", "Critical Thinking"],
    "skill_gaps": ["Machine Learning", "Deep Learning", "NLP", "MLOps"],
    "match_score": 38,
    "match_verdict": "Partial Match",
    "overall_advice": "Focus on building ML fundamentals before advancing to NLP.",
    "learning_path": [
        {
            "step_number": 1,
            "course_title": "Critical Thinking - Fundamentals",
            "skill": "Critical Thinking",
            "level": "beginner",
            "duration_weeks": 1,
            "link": "https://www.coursera.org/learn/critical-thinking-skills",
            "reason": "Critical Thinking is a prerequisite for all analytical ML skills"
        }
    ],
    "reasoning_trace": "The candidate is currently missing essential ML skills...",
    "summary": {
        "original_gaps": 4,
        "expanded_gaps": 6,
        "prerequisites_added": 2,
        "total_steps": 12,
        "total_weeks": 24
    }
}
```

---

## Datasets Used

| Dataset | Source | Usage |
|---|---|---|
| O*NET Skills Database | https://www.onetcenter.org/db_releases.html | Skill names, skill levels, job role skill requirements |
| O*NET Occupation Data | https://www.onetcenter.org/db_releases.html | Job titles and occupational categories |
| Course Catalog | Custom built from O*NET data | RAG source for course recommendations |

All datasets are publicly available. No proprietary or private data was used.

---

## Team

| Member | Role | Responsibilities |
|---|---|---|
| bu | Backend + Integration | Django API, pipeline integration, README, presentation |
| ta | Parsing + Skill Gap | Resume parser, JD parser, skill gap analysis |
| bo | Learning Path + RAG | RAG pipeline, learning path generation, reasoning trace |
| a | Frontend + Demo | React UI, demo video, final submission |
