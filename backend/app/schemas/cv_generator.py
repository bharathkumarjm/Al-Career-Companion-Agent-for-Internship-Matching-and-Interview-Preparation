import os

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    HRFlowable
)


CV_DIR = "generated_cvs"

os.makedirs(CV_DIR, exist_ok=True)


def generate_cv_pdf(
    filename: str,
    summary: str,
    skills: list,
    education: list,
    experience: list,
    projects: list,
    certifications: list,
    career_recommendation: str
):

    file_path = os.path.join(
        CV_DIR,
        filename
    )

    document = SimpleDocTemplate(
        file_path,
        pagesize=A4,
        rightMargin=45,
        leftMargin=45,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()

    name_style = ParagraphStyle(
        "CVName",
        parent=styles["Title"],
        alignment=TA_CENTER,
        fontSize=20,
        spaceAfter=8
    )

    heading_style = ParagraphStyle(
        "CVHeading",
        parent=styles["Heading2"],
        fontSize=12,
        spaceBefore=12,
        spaceAfter=6
    )

    normal_style = ParagraphStyle(
        "CVNormal",
        parent=styles["BodyText"],
        fontSize=9.5,
        leading=14,
        spaceAfter=5
    )

    bullet_style = ParagraphStyle(
        "CVBullet",
        parent=normal_style,
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=4
    )

    story = []

    # ---------------------------------------
    # Header
    # ---------------------------------------

    story.append(
        Paragraph(
            "CURRICULUM VITAE",
            name_style
        )
    )

    story.append(
        HRFlowable(
            width="100%",
            thickness=1,
            spaceAfter=10
        )
    )

    # ---------------------------------------
    # Professional Summary
    # ---------------------------------------

    story.append(
        Paragraph(
            "PROFESSIONAL SUMMARY",
            heading_style
        )
    )

    story.append(
        Paragraph(
            summary or "No summary available.",
            normal_style
        )
    )

    # ---------------------------------------
    # Skills
    # ---------------------------------------

    story.append(
        Paragraph(
            "SKILLS",
            heading_style
        )
    )

    for skill in skills or []:
        story.append(
            Paragraph(
                f"• {skill}",
                bullet_style
            )
        )

    # ---------------------------------------
    # Education
    # ---------------------------------------

    story.append(
        Paragraph(
            "EDUCATION",
            heading_style
        )
    )

    for item in education or []:
        story.append(
            Paragraph(
                f"• {item}",
                bullet_style
            )
        )

    # ---------------------------------------
    # Experience
    # ---------------------------------------

    story.append(
        Paragraph(
            "EXPERIENCE",
            heading_style
        )
    )

    for item in experience or []:
        story.append(
            Paragraph(
                f"• {item}",
                bullet_style
            )
        )

    # ---------------------------------------
    # Projects
    # ---------------------------------------

    story.append(
        Paragraph(
            "PROJECTS",
            heading_style
        )
    )

    for item in projects or []:
        story.append(
            Paragraph(
                f"• {item}",
                bullet_style
            )
        )

    # ---------------------------------------
    # Certifications
    # ---------------------------------------

    story.append(
        Paragraph(
            "CERTIFICATIONS",
            heading_style
        )
    )

    for item in certifications or []:
        story.append(
            Paragraph(
                f"• {item}",
                bullet_style
            )
        )

    # ---------------------------------------
    # Career Recommendation
    # ---------------------------------------

    story.append(
        Paragraph(
            "CAREER RECOMMENDATION",
            heading_style
        )
    )

    story.append(
        Paragraph(
            career_recommendation or "No recommendation available.",
            normal_style
        )
    )

    document.build(story)

    return file_path