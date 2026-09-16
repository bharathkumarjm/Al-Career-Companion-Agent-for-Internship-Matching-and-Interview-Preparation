# RAG-Based Internship Matching System

This project includes a lightweight RAG-style internship retrieval flow that matches a candidate's resume profile against internship opportunities using semantic similarity.

## Overview

The pipeline works in the following order:

1. Candidate resume data is prepared from extracted resume fields such as summary, skills, education, experience, projects, certifications, and career recommendation.
2. Internship dataset entries are transformed into rich text representations.
3. TF-IDF vector embeddings are generated for both the candidate profile and internship records.
4. Cosine similarity is used to retrieve the most relevant internships.
5. A structured result is returned with match percentage and explanation.

## Why this qualifies as RAG-style matching

The design follows the retrieval-augmented matching pattern:

- Candidate resume profile = query
- Internship repository = document store
- TF-IDF embeddings = vector representation
- Similarity search = retrieval
- Matching explanation = grounded response using only the candidate and internship data

## Key files

- `app/services/rag_matcher.py` — main retrieval and matching logic
- `app/services/internship_dataset.py` — demo internship dataset
- `app/routers/rag_matching.py` — API endpoint for querying the assistant
- `tests/test_rag_matching.py` — validation tests

## Example candidate payload

```json
{
  "summary": "Python developer with backend and AI experience",
  "skills": ["Python", "FastAPI", "SQL", "Machine Learning"],
  "education": ["B.Tech in Computer Science"],
  "experience": ["Built APIs and dashboards"],
  "projects": ["AI internship platform"],
  "certifications": ["Google Data Analytics"],
  "career_recommendation": "Backend Developer"
}
```

## API usage

```bash
curl -X POST http://localhost:8000/matching/rag/query \
  -H "Content-Type: application/json" \
  -d '{
    "candidate": {
      "summary": "Python backend developer with SQL and FastAPI experience",
      "skills": ["Python", "FastAPI", "SQL", "Machine Learning"],
      "education": ["B.Tech in CSE"],
      "experience": ["Built APIs and optimized database queries"],
      "projects": ["AI Internship Agent"],
      "certifications": [],
      "career_recommendation": "Backend Developer"
    },
    "top_k": 5
  }'
```

## Notes

- This implementation intentionally avoids inventing internship details.
- It grounds results only in the provided candidate profile and internship dataset.
- The vector store is lightweight and local, built using scikit-learn, so it works in a standard Python environment without extra distributed infrastructure.
