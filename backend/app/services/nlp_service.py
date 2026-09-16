"""
TalentSprint AI - Advanced Natural Language Processing (NLP) Engine
Provides:
- Intent Classification with Softmax-style normalized confidence
- Named Entity Recognition (NER) with Exact Character Offset Spans
- Action-Verb Power vs. Weak Verb Impact Diagnostics & Auto-Recommendations
- Salient Keyphrase & Concept Extraction (Frequency + Length + Heuristic Ranker)
- Sentiment & Conversational Tone Detection
- Text Readability, Complexity & Lexical Diversity
- Document & Resume ATS Readiness Assessment
- Full NLP Workbench Aggregator
"""

import re
import math
from typing import Any, Dict, List, Optional, Set, Tuple


# ============================================================
# 1. ENTITY VOCABULARIES & GAZETTEERS
# ============================================================

TECH_SKILLS = {
    # Programming Languages
    "python", "javascript", "typescript", "java", "c++", "c#", "c", "go", "golang", "rust",
    "kotlin", "swift", "ruby", "php", "sql", "r", "scala", "dart", "html", "css", "bash", "shell",
    # Frameworks & Libraries
    "react", "react.js", "next.js", "nextjs", "vue", "vue.js", "angular", "node", "node.js", "express",
    "fastapi", "django", "flask", "spring", "spring boot", "asp.net", ".net", "pytorch",
    "tensorflow", "keras", "scikit-learn", "pandas", "numpy", "tailwind", "tailwindcss", "bootstrap",
    # Databases & Storage
    "postgresql", "postgres", "mysql", "mongodb", "sqlite", "redis", "cassandra", "dynamodb",
    "elasticsearch", "chromadb", "faiss", "neo4j", "mariadb", "pinecone", "qdrant", "milvus", "weaviate",
    # Cloud, DevOps & Infrastructure
    "docker", "kubernetes", "k8s", "aws", "azure", "gcp", "google cloud", "terraform",
    "ansible", "jenkins", "github actions", "ci/cd", "git", "github", "gitlab", "linux",
    "nginx", "apache", "kafka", "rabbitmq", "graphql", "rest", "restful", "microservices",
    "grpc", "websockets", "celery", "redis streams", "prometheus", "grafana", "helm",
    # AI, ML & GenAI Concepts
    "genai", "generative ai", "llm", "large language models", "rag", "retrieval augmented generation",
    "nlp", "natural language processing", "computer vision", "machine learning", "deep learning",
    "langchain", "llamaindex", "transformers", "huggingface", "ollama", "vllm", "prompt engineering",
    "fine-tuning", "lora", "peft", "vector databases", "embeddings",
    # Core Architecture & CS Fundamentals
    "data structures", "algorithms", "system design", "oop", "object oriented programming",
    "clean architecture", "solid principles", "domain driven design", "ddd", "unit testing", "pytest"
}

INSTITUTIONS = {
    # Ballari / Local Regional
    "kishkinda university": {"city": "Ballari", "state": "Karnataka", "type": "State Private University"},
    "kishkindha university": {"city": "Ballari", "state": "Karnataka", "type": "State Private University"},
    "vsku": {"city": "Ballari", "state": "Karnataka", "type": "State Public University"},
    "vijayanagara sri krishnadevaraya university": {"city": "Ballari", "state": "Karnataka", "type": "State Public University"},
    "bitm": {"city": "Ballari", "state": "Karnataka", "type": "Engineering College"},
    "ballari institute of technology and management": {"city": "Ballari", "state": "Karnataka", "type": "Engineering College"},
    "vtu": {"city": "Belagavi", "state": "Karnataka", "type": "State Technical University"},
    "visvesvaraya technological university": {"city": "Belagavi", "state": "Karnataka", "type": "State Technical University"},
    # Karnataka Top Tier
    "rv college of engineering": {"city": "Bengaluru", "state": "Karnataka", "type": "Autonomous Engineering College"},
    "rvce": {"city": "Bengaluru", "state": "Karnataka", "type": "Autonomous Engineering College"},
    "bms college of engineering": {"city": "Bengaluru", "state": "Karnataka", "type": "Engineering College"},
    "bmsce": {"city": "Bengaluru", "state": "Karnataka", "type": "Engineering College"},
    "ms ramaiah institute of technology": {"city": "Bengaluru", "state": "Karnataka", "type": "Engineering College"},
    "msrit": {"city": "Bengaluru", "state": "Karnataka", "type": "Engineering College"},
    "ramaiah": {"city": "Bengaluru", "state": "Karnataka", "type": "Engineering College"},
    "pes university": {"city": "Bengaluru", "state": "Karnataka", "type": "Private University"},
    "dayananda sagar": {"city": "Bengaluru", "state": "Karnataka", "type": "University"},
    "dsce": {"city": "Bengaluru", "state": "Karnataka", "type": "Engineering College"},
    "iiit bangalore": {"city": "Bengaluru", "state": "Karnataka", "type": "Indian Institute of Information Technology"},
    "iiitb": {"city": "Bengaluru", "state": "Karnataka", "type": "Indian Institute of Information Technology"},
    "nitk": {"city": "Surathkal", "state": "Karnataka", "type": "National Institute of Technology"},
    "nitk surathkal": {"city": "Surathkal", "state": "Karnataka", "type": "National Institute of Technology"},
    "iit dharwad": {"city": "Dharwad", "state": "Karnataka", "type": "Indian Institute of Technology"},
    "manipal": {"city": "Manipal", "state": "Karnataka", "type": "Deemed University"},
    "mahe": {"city": "Manipal", "state": "Karnataka", "type": "Deemed University"},
    "bangalore university": {"city": "Bengaluru", "state": "Karnataka", "type": "State Public University"},
    # National & Global
    "iit": {"city": "National", "state": "India", "type": "Institute of National Importance"},
    "nit": {"city": "National", "state": "India", "type": "National Institute of Technology"},
    "iiit": {"city": "National", "state": "India", "type": "Indian Institute of Information Technology"},
    "bits pilani": {"city": "Pilani", "state": "Rajasthan", "type": "Institute of Eminence"},
    "stanford": {"city": "Stanford, CA", "state": "USA", "type": "University"},
    "mit": {"city": "Cambridge, MA", "state": "USA", "type": "University"},
    "harvard": {"city": "Cambridge, MA", "state": "USA", "type": "University"},
    "oxford": {"city": "Oxford", "state": "UK", "type": "University"}
}

COMPANIES = {
    "google", "microsoft", "amazon", "meta", "apple", "netflix", "infosys", "tcs",
    "wipro", "cognizant", "accenture", "capgemini", "ibm", "oracle", "cisco", "intel",
    "nvidia", "uber", "salesforce", "adobe", "flipkart", "swiggy", "zomato", "paytm",
    "razorpay", "cred", "jpmorgan", "goldman sachs", "morgan stanley", "deloitte"
}

TECH_ROLES = {
    "software engineer", "software developer", "sde", "backend developer", "backend engineer",
    "frontend developer", "frontend engineer", "full stack developer", "fullstack developer",
    "ai engineer", "machine learning engineer", "ml engineer", "data scientist", "data analyst",
    "devops engineer", "cloud architect", "cybersecurity analyst", "qa engineer",
    "site reliability engineer", "sre", "product manager", "intern", "software intern"
}

LOCATIONS = {
    "ballari": "Karnataka, India",
    "bellary": "Karnataka, India",
    "bengaluru": "Karnataka, India",
    "bangalore": "Karnataka, India",
    "hyderabad": "Telangana, India",
    "pune": "Maharashtra, India",
    "mumbai": "Maharashtra, India",
    "chennai": "Tamil Nadu, India",
    "delhi": "Delhi NCR, India",
    "noida": "Uttar Pradesh, India",
    "gurgaon": "Haryana, India",
    "mysuru": "Karnataka, India",
    "mysore": "Karnataka, India",
    "dharwad": "Karnataka, India",
    "hubballi": "Karnataka, India",
    "remote": "Work from Home / Anywhere",
    "hybrid": "Hybrid Workplace",
    "onsite": "Onsite Location"
}

POWER_VERBS = {
    "architected": "Designed system architecture and data models",
    "engineered": "Built robust, production-ready software components",
    "spearheaded": "Led initiative and drove delivery",
    "accelerated": "Reduced latency or improved processing speed",
    "deployed": "Released applications to production/cloud infrastructure",
    "automated": "Eliminated repetitive manual workflows via CI/scripts",
    "orchestrated": "Coordinated microservices, pipelines, or containers",
    "optimized": "Enhanced query performance, memory, or cost",
    "refactored": "Restructured legacy code for maintainability",
    "streamlined": "Simplified workflows and eliminated bottlenecks",
    "implemented": "Built and integrated features from specifications",
    "integrated": "Connected third-party APIs and microservices",
    "scaled": "Supported increased traffic and concurrent users",
    "benchmarked": "Measured and validated system performance metrics",
    "authored": "Created technical specs, documentation, or RFCs"
}

WEAK_VERB_REPLACEMENTS = {
    "helped with": ["co-engineered", "assisted in architecting", "contributed to developing"],
    "helped": ["collaborated to engineer", "co-implemented", "supported rollout of"],
    "worked on": ["developed", "engineered", "implemented", "delivered"],
    "responsible for": ["spearheaded", "owned delivery of", "orchestrated", "managed"],
    "did": ["executed", "implemented", "built"],
    "made": ["designed", "engineered", "built", "architected"],
    "handled": ["administered", "managed", "resolved", "maintained"],
    "tried": ["prototyped", "benchmarked", "evaluated"],
    "assisted": ["partnered in engineering", "co-developed", "supported delivery of"],
    "fixed bugs": ["debugged critical issues", "optimized system stability", "eliminated software defects"]
}

STOPWORDS = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are",
    "aren't", "as", "at", "be", "because", "been", "before", "being", "below", "between", "both",
    "but", "by", "can", "can't", "cannot", "could", "couldn't", "did", "didn't", "do", "does",
    "doesn't", "doing", "don't", "down", "during", "each", "few", "for", "from", "further", "had",
    "hadn't", "has", "hasn't", "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her",
    "here", "here's", "hers", "herself", "him", "himself", "his", "how", "how's", "i", "i'd",
    "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself",
    "let's", "me", "more", "most", "mustn't", "my", "myself", "no", "nor", "not", "of", "off",
    "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own",
    "same", "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't", "so", "some",
    "such", "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then",
    "there", "there's", "these", "they", "they'd", "they'll", "they're", "they've", "this",
    "those", "through", "to", "too", "under", "until", "up", "very", "was", "wasn't", "we", "we'd",
    "we'll", "we're", "we've", "were", "weren't", "what", "what's", "when", "when's", "where",
    "where's", "which", "while", "who", "who's", "whom", "why", "why's", "with", "won't", "would",
    "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself"
}

POSITIVE_WORDS = {
    "great", "good", "excellent", "excited", "happy", "improve", "enhance", "optimize",
    "succeed", "ready", "interested", "passionate", "strong", "best", "confident",
    "opportunity", "eager", "aspiring", "helpful", "perfect", "appreciate", "love"
}

ANXIOUS_WORDS = {
    "nervous", "scared", "worried", "stressed", "anxious", "fear", "fail", "failing",
    "struggling", "confused", "lost", "doubt", "hard", "difficult", "impossible",
    "rejection", "rejected", "weak", "stuck", "frustrated", "overwhelmed"
}

QUESTION_WORDS = {
    "what", "where", "how", "when", "why", "who", "which", "can", "could", "should", "is", "are"
}


# ============================================================
# 2. NLP TOKENIZER & NORMALIZER
# ============================================================

def tokenize(text: str) -> List[str]:
    """Basic NLP word tokenization stripping punctuation while keeping tech terms."""
    clean = re.sub(r"[^\w\s\+\#\.\-]", " ", text.lower())
    tokens = [t.strip() for t in clean.split() if t.strip()]
    return tokens


def get_ngrams(tokens: List[str], n: int) -> List[str]:
    """Extract word n-grams for multi-word phrase matching."""
    return [" ".join(tokens[i:i+n]) for i in range(len(tokens) - n + 1)]


# ============================================================
# 3. NAMED ENTITY RECOGNITION (NER) & EXACT SPAN EXTRACTION
# ============================================================

def extract_entities(text: str) -> Dict[str, Any]:
    """Gazetteer and boundary-based Named Entity Recognition (NER)."""
    text_lower = text.lower()
    tokens = tokenize(text)
    bigrams = get_ngrams(tokens, 2)
    trigrams = get_ngrams(tokens, 3)
    all_phrases = set(tokens + bigrams + trigrams)

    detected_skills = []
    for skill in TECH_SKILLS:
        if skill in all_phrases or (len(skill) > 2 and re.search(r"\b" + re.escape(skill) + r"\b", text_lower)):
            detected_skills.append(skill.title())

    detected_institutions = []
    for inst, meta in INSTITUTIONS.items():
        if inst in text_lower or inst in all_phrases:
            detected_institutions.append({
                "name": inst.title(),
                "location": f"{meta['city']}, {meta['state']}",
                "type": meta["type"]
            })

    detected_companies = []
    for comp in COMPANIES:
        if comp in all_phrases or re.search(r"\b" + re.escape(comp) + r"\b", text_lower):
            detected_companies.append(comp.title())

    detected_roles = []
    for role in TECH_ROLES:
        if role in all_phrases or role in text_lower:
            detected_roles.append(role.title())

    detected_locations = []
    for loc, full_loc in LOCATIONS.items():
        if loc in all_phrases or re.search(r"\b" + re.escape(loc) + r"\b", text_lower):
            detected_locations.append(f"{loc.title()} ({full_loc})")

    return {
        "skills": sorted(list(set(detected_skills))),
        "institutions": detected_institutions,
        "companies": sorted(list(set(detected_companies))),
        "roles": sorted(list(set(detected_roles))),
        "locations": sorted(list(set(detected_locations)))
    }


def extract_entities_with_spans(text: str) -> List[Dict[str, Any]]:
    """
    Extracts entities with exact character start and end indices for in-text visual highlighting.
    De-duplicates overlapping matches by preferring longer token spans.
    """
    spans = []
    
    # 1. Institutions
    for inst in INSTITUTIONS.keys():
        pattern = r"\b" + re.escape(inst) + r"\b"
        for m in re.finditer(pattern, text, re.IGNORECASE):
            spans.append({
                "start": m.start(),
                "end": m.end(),
                "text": text[m.start():m.end()],
                "category": "institution",
                "label": "Institution",
                "details": f"{INSTITUTIONS[inst]['city']}, {INSTITUTIONS[inst]['state']}"
            })

    # 2. Tech Skills
    for skill in TECH_SKILLS:
        pattern = r"\b" + re.escape(skill) + r"\b"
        for m in re.finditer(pattern, text, re.IGNORECASE):
            spans.append({
                "start": m.start(),
                "end": m.end(),
                "text": text[m.start():m.end()],
                "category": "skill",
                "label": "Tech Skill",
                "details": "Technical Skill / Framework"
            })

    # 3. Companies
    for comp in COMPANIES:
        pattern = r"\b" + re.escape(comp) + r"\b"
        for m in re.finditer(pattern, text, re.IGNORECASE):
            spans.append({
                "start": m.start(),
                "end": m.end(),
                "text": text[m.start():m.end()],
                "category": "company",
                "label": "Company",
                "details": "Target Tech Enterprise"
            })

    # 4. Roles
    for role in TECH_ROLES:
        pattern = r"\b" + re.escape(role) + r"\b"
        for m in re.finditer(pattern, text, re.IGNORECASE):
            spans.append({
                "start": m.start(),
                "end": m.end(),
                "text": text[m.start():m.end()],
                "category": "role",
                "label": "Job Role",
                "details": "Career Role"
            })

    # 5. Locations
    for loc, full in LOCATIONS.items():
        pattern = r"\b" + re.escape(loc) + r"\b"
        for m in re.finditer(pattern, text, re.IGNORECASE):
            spans.append({
                "start": m.start(),
                "end": m.end(),
                "text": text[m.start():m.end()],
                "category": "location",
                "label": "Location",
                "details": full
            })

    # De-duplicate overlaps: sort by start ascending, length descending
    spans.sort(key=lambda s: (s["start"], -(s["end"] - s["start"])))
    non_overlapping = []
    last_end = -1
    for s in spans:
        if s["start"] >= last_end:
            non_overlapping.append(s)
            last_end = s["end"]

    return non_overlapping


# ============================================================
# 4. SALIENT KEYPHRASE & TOPIC EXTRACTION
# ============================================================

def extract_keyphrases(text: str, top_n: int = 8) -> List[Dict[str, Any]]:
    """
    NLP Keyphrase Extractor scoring unigrams & bigrams based on term frequency,
    positional weighting, domain vocabulary relevance, and capital casing.
    """
    raw_tokens = [w.strip() for w in text.split() if w.strip()]
    if not raw_tokens:
        return []

    tokens_clean = tokenize(text)
    candidates: Dict[str, float] = {}

    # Extract 1-grams and 2-grams
    ngrams_to_eval = []
    for i in range(len(tokens_clean)):
        w1 = tokens_clean[i]
        if w1 not in STOPWORDS and len(w1) > 2 and not w1.isdigit():
            ngrams_to_eval.append((w1, 1))
        if i < len(tokens_clean) - 1:
            w2 = tokens_clean[i+1]
            if w1 not in STOPWORDS and w2 not in STOPWORDS and len(w1) > 2 and len(w2) > 2:
                ngrams_to_eval.append((f"{w1} {w2}", 2))

    for phrase, length in ngrams_to_eval:
        score = 1.0 * length

        # Boost if in domain skills
        if phrase in TECH_SKILLS or any(s in phrase for s in TECH_SKILLS):
            score += 3.5
        # Boost if in institutions
        if phrase in INSTITUTIONS or any(inst in phrase for inst in INSTITUTIONS):
            score += 4.0
        # Boost if power verb
        if phrase in POWER_VERBS:
            score += 2.5
        # Boost length
        if len(phrase) > 7:
            score += 1.0

        # Positional boost (earlier phrases often set topic)
        pos = text.lower().find(phrase)
        if pos != -1 and pos < len(text) * 0.3:
            score += 1.5

        candidates[phrase] = candidates.get(phrase, 0.0) + score

    sorted_items = sorted(candidates.items(), key=lambda x: x[1], reverse=True)
    if not sorted_items:
        return []

    max_score = sorted_items[0][1]
    results = []
    seen = set()
    for phrase, raw_sc in sorted_items:
        clean_p = phrase.strip(".- ").strip()
        if not clean_p or clean_p in seen:
            continue
        if any(clean_p in s for s in seen):
            continue
        seen.add(clean_p)

        rel_score = min(99, max(65, int((raw_sc / max_score) * 100)))
        category = "tech_concept" if clean_p in TECH_SKILLS else ("institution" if clean_p in INSTITUTIONS else "general_topic")
        results.append({
            "phrase": clean_p.title(),
            "score": rel_score,
            "category": category
        })
        if len(results) >= top_n:
            break

    return results


# ============================================================
# 5. ACTION-VERB POWER VS WEAK VERB IMPACT ANALYZER
# ============================================================

def analyze_verb_strength(text: str) -> Dict[str, Any]:
    """
    Linguistic scanner identifying strong power verbs vs passive/weak verbs.
    Generates actionable high-impact replacements for ATS resume enhancement.
    """
    text_lower = text.lower()
    power_verbs_found = []
    for verb, desc in POWER_VERBS.items():
        if re.search(r"\b" + re.escape(verb) + r"\b", text_lower):
            power_verbs_found.append({
                "verb": verb.title(),
                "impact": desc
            })

    weak_phrases_found = []
    for weak_p, suggestions in WEAK_VERB_REPLACEMENTS.items():
        if weak_p in text_lower:
            weak_phrases_found.append({
                "phrase": weak_p,
                "recommended_power_verbs": [s.title() for s in suggestions]
            })

    score = 60 + (len(power_verbs_found) * 8) - (len(weak_phrases_found) * 12)
    score = max(20, min(100, score))

    if score >= 80:
        impact_level = "High-Impact Action Verbs"
    elif score >= 50:
        impact_level = "Moderate Impact - Upgrade Recommended"
    else:
        impact_level = "Weak Verbs Detected - Needs Immediate Action"

    return {
        "impact_score": score,
        "impact_level": impact_level,
        "power_verbs_count": len(power_verbs_found),
        "power_verbs": power_verbs_found,
        "weak_verbs_count": len(weak_phrases_found),
        "weak_verbs": weak_phrases_found
    }


# ============================================================
# 6. INTENT CLASSIFICATION
# ============================================================

INTENT_RULES = [
    {
        "intent": "INSTITUTION_QUERY",
        "display": "🏛️ Academic Institution & University Query",
        "keywords": ["university", "college", "campus", "located", "where is", "address", "institution", "school", "fees", "admission", "affiliated"],
        "entity_trigger": "institutions",
        "weight": 2.5
    },
    {
        "intent": "RESUME_ATS_REVIEW",
        "display": "📄 Resume & ATS Compliance Review",
        "keywords": ["resume", "cv", "bullet", "bullets", "ats", "summary", "formatting", "tailor", "portfolio", "projects section", "review my"],
        "weight": 2.0
    },
    {
        "intent": "INTERVIEW_PREP",
        "display": "🎙️ Technical & STAR Interview Prep",
        "keywords": ["interview", "questions", "mock", "technical round", "star method", "hr round", "behavioral", "coding round", "prepare for interview"],
        "weight": 2.0
    },
    {
        "intent": "CAREER_ROADMAP",
        "display": "🗺️ Career Roadmap & Skill Gap Strategy",
        "keywords": ["roadmap", "skill gap", "how to become", "learn", "study plan", "steps", "timeline", "transition", "pathway", "beginner to"],
        "weight": 1.8
    },
    {
        "intent": "TECH_EXPLANATION",
        "display": "⚡ Technical Concept & Architecture Deep-Dive",
        "keywords": ["what is", "how does", "difference between", "architecture", "explain", "vs", "overview", "concept", "microservices", "pipeline"],
        "weight": 1.6
    },
    {
        "intent": "COMPENSATION_NEGOTIATION",
        "display": "💰 Stipend, Salary & Offer Evaluation",
        "keywords": ["stipend", "salary", "offer", "compensation", "negotiate", "perks", "duration", "contract", "lpa", "inr", "bucks"],
        "weight": 1.8
    },
    {
        "intent": "PORTFOLIO_PROJECTS",
        "display": "🚀 High-Impact Capstone Projects",
        "keywords": ["project ideas", "portfolio", "capstone", "what to build", "project suggestions", "build project", "side project"],
        "weight": 1.8
    },
    {
        "intent": "GENERAL_GUIDANCE",
        "display": "💡 General Professional Career Mentorship",
        "keywords": ["hello", "hi", "help", "guide", "advice", "suggest", "tips", "internship", "job"],
        "weight": 1.0
    }
]


def classify_intent(text: str, entities: Dict[str, Any]) -> Tuple[str, str, float]:
    """NLP multi-class Intent Classifier computing normalized confidence scores."""
    text_lower = text.lower()
    tokens = set(tokenize(text))

    scores = {}
    for rule in INTENT_RULES:
        intent_id = rule["intent"]
        score = 0.0

        for kw in rule["keywords"]:
            if " " in kw:
                if kw in text_lower:
                    score += 1.5 * rule["weight"]
            else:
                if kw in tokens:
                    score += 1.0 * rule["weight"]

        if rule.get("entity_trigger") and entities.get(rule["entity_trigger"]):
            score += 3.0 * rule["weight"]

        scores[intent_id] = score

    best_intent = max(scores, key=scores.get)
    best_score = scores[best_intent]

    if best_score == 0:
        return "GENERAL_GUIDANCE", "💡 General Professional Career Mentorship", 0.70

    confidence = min(0.98, max(0.65, round(best_score / (best_score + 2.0), 2)))
    rule_meta = next((r for r in INTENT_RULES if r["intent"] == best_intent), INTENT_RULES[-1])
    return best_intent, rule_meta["display"], confidence


# ============================================================
# 7. SENTIMENT & COMMUNICATION TONE ANALYSIS
# ============================================================

def analyze_sentiment_and_tone(text: str) -> Dict[str, Any]:
    """Lexical NLP Sentiment & Tone Analyzer."""
    tokens = tokenize(text)
    if not tokens:
        return {
            "polarity": 0.0,
            "sentiment": "Neutral",
            "tone": "Direct & Inquisitive",
            "confidence": 0.85
        }

    pos_count = sum(1 for t in tokens if t in POSITIVE_WORDS)
    anx_count = sum(1 for t in tokens if t in ANXIOUS_WORDS)
    q_count = sum(1 for t in tokens if t in QUESTION_WORDS) or (1 if "?" in text else 0)

    total_words = len(tokens)
    polarity = round((pos_count - anx_count) / max(1, pos_count + anx_count + 1), 2)

    if anx_count > 0 and anx_count >= pos_count:
        sentiment = "Concerned / Needs Encouragement"
        tone = "Apprehensive & Seeking Guidance"
    elif polarity > 0.3:
        sentiment = "Positive"
        tone = "Confident & Proactive"
    elif q_count > 0:
        sentiment = "Curious"
        tone = "Inquisitive & Learning-Focused"
    else:
        sentiment = "Neutral"
        tone = "Objective & Analytical"

    return {
        "polarity": polarity,
        "sentiment": sentiment,
        "tone": tone,
        "positive_cues": pos_count,
        "anxious_cues": anx_count
    }


# ============================================================
# 8. TEXT READABILITY & LINGUISTIC STATS
# ============================================================

def calculate_readability(text: str) -> Dict[str, Any]:
    """Computes NLP text complexity, lexical diversity, and reading ease."""
    words = tokenize(text)
    word_count = len(words)
    if word_count == 0:
        return {"word_count": 0, "reading_time_sec": 0, "complexity": "N/A"}

    sentences = [s.strip() for s in re.split(r"[.!?]+", text) if s.strip()]
    sentence_count = max(1, len(sentences))

    def count_syllables(word):
        w = word.lower()
        count = len(re.findall(r"[aeiouy]+", w))
        return max(1, count)

    total_syllables = sum(count_syllables(w) for w in words)
    avg_words_per_sentence = word_count / sentence_count
    avg_syllables_per_word = total_syllables / word_count

    flesch = 206.835 - (1.015 * avg_words_per_sentence) - (84.6 * avg_syllables_per_word)
    flesch_score = round(max(0, min(100, flesch)), 1)

    if flesch_score >= 80:
        complexity = "Very Easy to Read"
    elif flesch_score >= 60:
        complexity = "Standard & Clear"
    elif flesch_score >= 40:
        complexity = "Technical & Dense"
    else:
        complexity = "High Complexity"

    unique_words = len(set(words))
    lexical_diversity = round((unique_words / word_count) * 100, 1)

    return {
        "word_count": word_count,
        "sentence_count": sentence_count,
        "reading_time_sec": math.ceil(word_count / 3.5),
        "flesch_score": flesch_score,
        "complexity": complexity,
        "lexical_diversity_pct": lexical_diversity
    }


# ============================================================
# 9. DOCUMENT ATS & ACTION-VERB DIAGNOSTICS
# ============================================================

def analyze_document_nlp(doc_text: str) -> Dict[str, Any]:
    """Deep NLP diagnostics for attached resume or career documents."""
    tokens = tokenize(doc_text)
    word_count = len(tokens)
    if word_count == 0:
        return {}

    lines = [line.strip() for line in doc_text.splitlines() if line.strip()]
    bullet_lines = [l for l in lines if l.startswith(("-", "•", "*")) or len(l) < 120]

    action_verb_count = 0
    quant_metric_count = 0

    for line in lines:
        line_clean = line.lower().strip()
        first_words = line_clean.split()[:2]
        if any(w in POWER_VERBS for w in first_words):
            action_verb_count += 1
        if re.search(r"(\d+%\s*|\$\d+|\d+\+?\s*(users|clients|ms|latency|speed|revenue|req/s))", line_clean):
            quant_metric_count += 1

    entities = extract_entities(doc_text)
    readability = calculate_readability(doc_text)
    verb_strength = analyze_verb_strength(doc_text)

    ats_score = 40
    if len(entities["skills"]) >= 5:
        ats_score += 25
    elif len(entities["skills"]) >= 2:
        ats_score += 15

    if action_verb_count >= 3:
        ats_score += 15
    if quant_metric_count >= 2:
        ats_score += 15
    if readability["flesch_score"] >= 50:
        ats_score += 5

    ats_score = min(100, ats_score)

    return {
        "word_count": word_count,
        "detected_skills_count": len(entities["skills"]),
        "detected_skills": entities["skills"][:10],
        "action_verb_count": action_verb_count,
        "quant_metric_count": quant_metric_count,
        "ats_readiness_score": ats_score,
        "readability_score": readability["flesch_score"],
        "complexity": readability["complexity"],
        "verb_strength": verb_strength
    }


# ============================================================
# 10. MASTER USER QUERY NLP PIPELINE
# ============================================================

def analyze_user_query(text: str) -> Dict[str, Any]:
    """
    Main NLP pipeline for student messages in the AI Mentor Chat.
    Extracts Entities, Spans, Intent, Sentiment, Tone, Keyphrases, and Follow-up Actions.
    """
    entities = extract_entities(text)
    entity_spans = extract_entities_with_spans(text)
    intent_id, intent_display, confidence = classify_intent(text, entities)
    sentiment_data = analyze_sentiment_and_tone(text)
    readability_data = calculate_readability(text)
    keyphrases = extract_keyphrases(text, top_n=6)
    verb_strength = analyze_verb_strength(text)

    follow_ups = []
    if intent_id == "INSTITUTION_QUERY":
        if entities["institutions"]:
            inst_name = entities["institutions"][0]["name"]
            follow_ups = [
                f"What programs and courses are offered at {inst_name}?",
                f"How are the campus placement records at {inst_name}?",
                f"What tech companies hire graduates from {inst_name}?"
            ]
        else:
            follow_ups = [
                "Tell me about accredited engineering colleges in Karnataka",
                "What skills are needed for campus placement interviews?",
                "How can I prepare for off-campus software internships?"
            ]
    elif intent_id == "RESUME_ATS_REVIEW":
        follow_ups = [
            "Rewrite my resume bullets using Google's X-Y-Z formula",
            "What ATS keywords are missing for a Backend Engineer role?",
            "How do I highlight my college projects without prior experience?"
        ]
    elif intent_id == "INTERVIEW_PREP":
        skill_name = entities["skills"][0] if entities["skills"] else "software development"
        follow_ups = [
            f"Give me 3 tough technical interview questions on {skill_name}",
            "Guide me through an answer using the STAR behavioral framework",
            "What smart questions should I ask the interviewer at the end?"
        ]
    elif intent_id == "TECH_EXPLANATION":
        tech_name = entities["skills"][0] if entities["skills"] else "this technology"
        follow_ups = [
            f"Show a practical hands-on example using {tech_name}",
            f"What are the best open-source projects using {tech_name}?",
            f"How is {tech_name} tested in technical internship interviews?"
        ]
    else:
        follow_ups = [
            "Review my attached resume for ATS compliance",
            "What technical questions will I get in an internship interview?",
            "How do I bridge missing skills for top engineering roles?"
        ]

    return {
        "intent": intent_id,
        "intent_display": intent_display,
        "confidence": confidence,
        "sentiment": sentiment_data["sentiment"],
        "tone": sentiment_data["tone"],
        "polarity": sentiment_data["polarity"],
        "entities": entities,
        "entity_spans": entity_spans,
        "keyphrases": keyphrases,
        "verb_strength": verb_strength,
        "readability": readability_data,
        "follow_ups": follow_ups
    }


# ============================================================
# 11. FULL NLP WORKBENCH AGGREGATOR
# ============================================================

def run_nlp_workbench(text: str) -> Dict[str, Any]:
    """
    Comprehensive NLP diagnostic aggregator for the Live NLP Workbench.
    Provides complete linguistic, syntactic, semantic, and ATS compliance insights.
    """
    if not text or not text.strip():
        return {
            "error": "Input text cannot be empty."
        }

    clean_text = text.strip()
    entities = extract_entities(clean_text)
    entity_spans = extract_entities_with_spans(clean_text)
    intent_id, intent_display, confidence = classify_intent(clean_text, entities)
    sentiment_data = analyze_sentiment_and_tone(clean_text)
    readability_data = calculate_readability(clean_text)
    keyphrases = extract_keyphrases(clean_text, top_n=8)
    verb_strength = analyze_verb_strength(clean_text)

    # Document-level assessment if text length is substantial
    doc_diagnostics = analyze_document_nlp(clean_text) if len(tokenize(clean_text)) >= 20 else None

    suggested_chat_prompt = (
        "Please rewrite and optimize this text for a top software internship application. "
        "Focus on strong action verbs, ATS keyword alignment, and quantifiable metrics:\n\n"
        + clean_text
    )

    return {
        "text": clean_text,
        "intent": {
            "id": intent_id,
            "display": intent_display,
            "confidence": confidence,
            "confidence_pct": int(confidence * 100)
        },
        "sentiment_and_tone": sentiment_data,
        "entities": entities,
        "entity_spans": entity_spans,
        "keyphrases": keyphrases,
        "verb_strength": verb_strength,
        "readability": readability_data,
        "document_diagnostics": doc_diagnostics,
        "suggested_chat_prompt": suggested_chat_prompt
    }
