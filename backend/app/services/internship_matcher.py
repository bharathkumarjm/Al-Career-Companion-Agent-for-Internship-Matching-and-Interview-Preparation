import json

from groq import Groq

from app.config import settings


client = Groq(
    api_key=settings.GROQ_API_KEY
)


def _parse_json_list(value):
    """
    Convert a JSON string stored in the database
    back into a Python list.
    """

    if not value:
        return []

    if isinstance(value, list):
        return value

    try:
        parsed = json.loads(value)

        if isinstance(parsed, list):
            return parsed

        return [str(parsed)]

    except (json.JSONDecodeError, TypeError):

        return [str(value)]


def match_internships(
    resume_analysis,
    internships
):

    # ========================================================
    # Convert database JSON strings into lists
    # ========================================================

    skills = _parse_json_list(
        resume_analysis.skills
    )

    education = _parse_json_list(
        resume_analysis.education
    )

    experience = _parse_json_list(
        resume_analysis.experience
    )

    projects = _parse_json_list(
        resume_analysis.projects
    )

    certifications = _parse_json_list(
        resume_analysis.certifications
    )

    # ========================================================
    # Build internship information
    # ========================================================

    internship_text = ""

    for internship in internships:

        internship_text += f"""
ID: {internship.id}
Title: {internship.title}
Description: {internship.description or ""}
Required Skills: {internship.required_skills}
Duration: {internship.duration or ""}
"""

    # ========================================================
    # Build AI prompt
    # ========================================================

    prompt = f"""
You are an AI Internship Matching System.

Your job is to compare the candidate's resume information
with the available internships and determine how suitable
each internship is for the candidate.

CANDIDATE INFORMATION

Summary:
{resume_analysis.summary}

Skills:
{json.dumps(skills)}

Education:
{json.dumps(education)}

Experience:
{json.dumps(experience)}

Projects:
{json.dumps(projects)}

Certifications:
{json.dumps(certifications)}

Career Recommendation:
{resume_analysis.career_recommendation}


AVAILABLE INTERNSHIPS

{internship_text}


MATCHING RULES

1. Compare the candidate's skills with the internship's
   required skills.

2. Consider education, experience, projects,
   certifications, and career recommendation.

3. Give every internship a match percentage from 0 to 100.

4. A higher percentage means the internship is more suitable.

5. Give a short and meaningful reason for the match.

6. Mention important matching skills in the reason.

7. Sort recommendations from highest match percentage
   to lowest match percentage.

8. Use the exact internship ID provided above.

9. Do not invent internship IDs.

10. Do not add any extra fields.

11. Return ONLY valid JSON.


RETURN EXACTLY THIS FORMAT:

{{
    "recommendations": [
        {{
            "internship_id": 1,
            "match_percentage": 85,
            "reason": "Strong match because the candidate has Python, Django and SQL experience."
        }}
    ]
}}
"""

    # ========================================================
    # Call Groq
    # ========================================================

    response = client.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an AI internship matching system. "
                    "Return only valid JSON."
                )
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.1,
        max_completion_tokens=2048,
        response_format={
            "type": "json_object"
        }
    )

    # ========================================================
    # Get AI response
    # ========================================================

    content = response.choices[0].message.content

    if not content:
        raise Exception(
            "AI returned an empty internship matching response"
        )

    # ========================================================
    # Parse JSON
    # ========================================================

    try:

        result = json.loads(content)

    except json.JSONDecodeError as e:

        raise Exception(
            f"AI returned invalid JSON: {str(e)}"
        )

    # ========================================================
    # Validate recommendations
    # ========================================================

    recommendations = result.get(
        "recommendations"
    )

    if not isinstance(recommendations, list):

        raise Exception(
            "AI response does not contain a valid recommendations list"
        )

    # ========================================================
    # Validate and clean each recommendation
    # ========================================================

    valid_internship_ids = {
        internship.id
        for internship in internships
    }

    cleaned_recommendations = []

    for recommendation in recommendations:

        if not isinstance(recommendation, dict):
            continue

        internship_id = recommendation.get(
            "internship_id"
        )

        match_percentage = recommendation.get(
            "match_percentage"
        )

        reason = recommendation.get(
            "reason"
        )

        # Check internship ID

        if internship_id not in valid_internship_ids:
            continue

        # Convert percentage to integer

        try:

            match_percentage = int(
                match_percentage
            )

        except (ValueError, TypeError):

            continue

        # Keep percentage between 0 and 100

        match_percentage = max(
            0,
            min(100, match_percentage)
        )

        # Check reason

        if not reason:
            reason = "Internship matches the candidate profile."

        cleaned_recommendations.append(
            {
                "internship_id": internship_id,
                "match_percentage": match_percentage,
                "reason": str(reason)
            }
        )

    # ========================================================
    # Sort by match percentage
    # ========================================================

    cleaned_recommendations.sort(
        key=lambda x: x["match_percentage"],
        reverse=True
    )

    # ========================================================
    # Return final result
    # ========================================================

    return {
        "recommendations": cleaned_recommendations
    }