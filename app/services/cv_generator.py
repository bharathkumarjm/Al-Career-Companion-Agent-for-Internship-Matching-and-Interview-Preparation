import io
import os
from typing import Any, Dict, List, Optional

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    HRFlowable,
    Table,
    TableStyle
)


def _clean_text(val: Any) -> str:
    """Escape XML-sensitive characters for ReportLab paragraphs."""
    if val is None:
        return ""
    text = str(val).strip()
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    return text


def generate_cv_pdf_bytes(cv_data: Dict[str, Any], template: str = "modern") -> bytes:
    """
    Generate an executive, beautifully styled CV PDF in-memory and return raw bytes.
    Supports both CustomizerPage cvData and standard resume schemas.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=14 * mm,
        leftMargin=14 * mm,
        topMargin=12 * mm,
        bottomMargin=12 * mm
    )

    # Color themes based on chosen template
    if template == "classic":
        primary_color = colors.HexColor("#1e3a8a")    # Harvard / Navy Blue
        accent_color = colors.HexColor("#1e293b")
        rule_color = colors.HexColor("#3b82f6")
    elif template == "minimal":
        primary_color = colors.HexColor("#0f172a")    # Deep Slate / Monochrome
        accent_color = colors.HexColor("#334155")
        rule_color = colors.HexColor("#64748b")
    else:  # "modern"
        primary_color = colors.HexColor("#4f46e5")    # Modern Indigo
        accent_color = colors.HexColor("#0f172a")
        rule_color = colors.HexColor("#6366f1")

    styles = getSampleStyleSheet()

    name_style = ParagraphStyle(
        "CVName",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=19,
        leading=23,
        textColor=accent_color,
        alignment=TA_CENTER,
        spaceAfter=2
    )

    role_style = ParagraphStyle(
        "CVRole",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=15,
        textColor=primary_color,
        alignment=TA_CENTER,
        spaceAfter=4
    )

    contact_style = ParagraphStyle(
        "CVContact",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#475569"),
        alignment=TA_CENTER,
        spaceAfter=6
    )

    section_style = ParagraphStyle(
        "CVSectionHeading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=10.5,
        leading=13,
        textColor=primary_color,
        spaceBefore=5,
        spaceAfter=2
    )

    body_style = ParagraphStyle(
        "CVBody",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#334155"),
        spaceAfter=2
    )

    bullet_style = ParagraphStyle(
        "CVBullet",
        parent=body_style,
        leftIndent=11,
        firstLineIndent=-7,
        spaceAfter=2
    )

    story = []

    # 1. HEADER: NAME & TITLE
    name = cv_data.get("fullName") or cv_data.get("name") or "Candidate"
    role = cv_data.get("roleTitle") or cv_data.get("career_objective") or ""

    story.append(Paragraph(f"<b>{_clean_text(name).upper()}</b>", name_style))
    if role:
        story.append(Paragraph(f"<b>{_clean_text(role)}</b>", role_style))

    # 2. CONTACT STRIP
    contact_parts = []
    for field in ["email", "phone", "location", "linkedin", "github"]:
        val = cv_data.get(field)
        if val:
            contact_parts.append(_clean_text(val))

    if contact_parts:
        contact_line = " &nbsp;|&nbsp; ".join(contact_parts)
        story.append(Paragraph(contact_line, contact_style))

    story.append(HRFlowable(width="100%", thickness=1.5, color=rule_color, spaceAfter=6, spaceBefore=2))

    # Helper: add section banner
    def add_section_header(title: str):
        story.append(Paragraph(f"<b>{_clean_text(title).upper()}</b>", section_style))
        story.append(HRFlowable(width="100%", thickness=0.6, color=colors.HexColor("#cbd5e1"), spaceAfter=4, spaceBefore=1))

    # 3. PROFESSIONAL SUMMARY
    summary = cv_data.get("summary")
    if summary:
        add_section_header("Professional Summary")
        story.append(Paragraph(_clean_text(summary), body_style))
        story.append(Spacer(1, 3))

    # 4. TECHNICAL COMPETENCIES / SKILLS
    skills = cv_data.get("skills")
    if skills:
        add_section_header("Technical Competencies")
        if isinstance(skills, dict):
            skill_categories = [
                ("Programming Languages", skills.get("languages") or skills.get("technical_skills")),
                ("Frameworks & Libraries", skills.get("frameworks") or skills.get("tools_frameworks")),
                ("Cloud, Databases & Tools", skills.get("cloud_devops")),
                ("Architectural Concepts", skills.get("concepts") or skills.get("soft_skills")),
            ]
            has_rendered_any = False
            for cat_name, val in skill_categories:
                if val:
                    val_str = ", ".join(val) if isinstance(val, list) else str(val)
                    story.append(Paragraph(f"<b>{cat_name}:</b> {_clean_text(val_str)}", body_style))
                    has_rendered_any = True
            if not has_rendered_any:
                for k, v in skills.items():
                    if v:
                        v_str = ", ".join(v) if isinstance(v, list) else str(v)
                        story.append(Paragraph(f"<b>{k.replace('_', ' ').title()}:</b> {_clean_text(v_str)}", body_style))
        elif isinstance(skills, list):
            skill_text = " &bull; ".join(_clean_text(s) for s in skills if s)
            story.append(Paragraph(skill_text, body_style))
        elif isinstance(skills, str):
            story.append(Paragraph(_clean_text(skills), body_style))
        story.append(Spacer(1, 3))

    # 5. WORK EXPERIENCE
    experience = cv_data.get("experience") or []
    if experience:
        add_section_header("Professional Experience")
        for exp in experience:
            if isinstance(exp, dict):
                role_str = _clean_text(exp.get("role") or exp.get("title") or "Engineering Role")
                company_str = _clean_text(exp.get("company") or "Company")
                duration_str = _clean_text(exp.get("duration") or "")
                location_str = _clean_text(exp.get("location") or "")

                top_left = f"<b>{role_str}</b> &mdash; <i>{company_str}</i>"
                top_right = f"<font color=\"#64748b\">{duration_str}{(' | ' + location_str) if location_str else ''}</font>"

                tbl = Table(
                    [[Paragraph(top_left, body_style), Paragraph(top_right, ParagraphStyle("TR", parent=body_style, alignment=TA_RIGHT))]],
                    colWidths=["72%", "28%"]
                )
                tbl.setStyle(TableStyle([
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 0),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
                    ("TOPPADDING", (0, 0), (-1, -1), 1),
                ]))
                story.append(tbl)

                bullets = exp.get("bullets") or []
                if isinstance(bullets, str):
                    bullets = [bullets]
                for b in bullets:
                    if b:
                        story.append(Paragraph(f"&bull; {_clean_text(b)}", bullet_style))
                story.append(Spacer(1, 3))
            elif isinstance(exp, str):
                story.append(Paragraph(f"&bull; {_clean_text(exp)}", bullet_style))
        story.append(Spacer(1, 2))

    # 6. KEY TECHNICAL PROJECTS
    projects = cv_data.get("projects") or []
    if projects:
        add_section_header("Key Technical Projects")
        for proj in projects:
            if isinstance(proj, dict):
                title_str = _clean_text(proj.get("title") or "Project")
                tech_str = _clean_text(proj.get("tech") or proj.get("tech_stack") or "")

                heading_text = f"<b>{title_str}</b>"
                if tech_str:
                    heading_text += f" <font color=\"#4f46e5\">(Tech Stack: {tech_str})</font>"

                story.append(Paragraph(heading_text, body_style))

                bullets = proj.get("bullets") or []
                if isinstance(bullets, str):
                    bullets = [bullets]
                for b in bullets:
                    if b:
                        story.append(Paragraph(f"&bull; {_clean_text(b)}", bullet_style))

                desc = proj.get("description")
                if desc and not bullets:
                    story.append(Paragraph(f"&bull; {_clean_text(desc)}", bullet_style))

                story.append(Spacer(1, 3))
            elif isinstance(proj, str):
                story.append(Paragraph(f"&bull; {_clean_text(proj)}", bullet_style))
        story.append(Spacer(1, 2))

    # 7. EDUCATION & CREDENTIALS
    education = cv_data.get("education") or []
    if education:
        add_section_header("Education & Credentials")
        for edu in education:
            if isinstance(edu, dict):
                deg_str = _clean_text(edu.get("degree") or "Degree")
                school_str = _clean_text(edu.get("school") or edu.get("institution") or "University")
                dur_str = _clean_text(edu.get("duration") or edu.get("year") or "")
                gpa_str = _clean_text(edu.get("gpa") or edu.get("score") or "")

                left_txt = f"<b>{deg_str}</b> &mdash; <i>{school_str}</i>"
                right_txt = f"<font color=\"#64748b\">{dur_str}{(' | ' + gpa_str) if gpa_str else ''}</font>"

                tbl = Table(
                    [[Paragraph(left_txt, body_style), Paragraph(right_txt, ParagraphStyle("ETR", parent=body_style, alignment=TA_RIGHT))]],
                    colWidths=["72%", "28%"]
                )
                tbl.setStyle(TableStyle([
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 0),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
                    ("TOPPADDING", (0, 0), (-1, -1), 1),
                ]))
                story.append(tbl)

                if edu.get("details"):
                    story.append(Paragraph(f"<font color=\"#64748b\">{_clean_text(edu['details'])}</font>", body_style))
                story.append(Spacer(1, 3))
            elif isinstance(edu, str):
                story.append(Paragraph(f"&bull; {_clean_text(edu)}", bullet_style))
        story.append(Spacer(1, 2))

    # 8. CERTIFICATIONS & HONORS
    certifications = cv_data.get("certifications") or []
    if certifications:
        add_section_header("Certifications & Honors")
        for cert in certifications:
            if cert:
                story.append(Paragraph(f"&bull; {_clean_text(cert)}", bullet_style))
        story.append(Spacer(1, 2))

    # 9. CAREER RECOMMENDATION / OBJECTIVE
    career_rec = cv_data.get("career_recommendation")
    if career_rec:
        add_section_header("Career Pathway")
        story.append(Paragraph(_clean_text(career_rec), body_style))

    doc.build(story)
    return buffer.getvalue()


def generate_cv_pdf(
    cv_data: Optional[Dict[str, Any]] = None,
    output_path: Optional[str] = None,
    **kwargs
) -> str:
    """
    Generate a CV PDF and write to output_path on disk.
    Fully backwards-compatible with keyword arguments (summary=..., skills=..., etc.)
    """
    if cv_data is None:
        cv_data = {}

    for k, v in kwargs.items():
        if k not in cv_data:
            cv_data[k] = v

    if not output_path:
        filename = kwargs.get("filename") or cv_data.get("filename") or "Candidate_CV.pdf"
        output_dir = os.path.join(os.getcwd(), "uploads", "cv")
        os.makedirs(output_dir, exist_ok=True)
        output_path = os.path.join(output_dir, filename)

    out_dir = os.path.dirname(output_path)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    template = cv_data.get("template") or "modern"
    pdf_bytes = generate_cv_pdf_bytes(cv_data, template=template)

    with open(output_path, "wb") as f:
        f.write(pdf_bytes)

    return output_path
