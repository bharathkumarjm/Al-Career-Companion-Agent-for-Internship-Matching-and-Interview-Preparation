import io
import re
from datetime import datetime
from typing import List, Dict, Any, Optional

# ReportLab for PDF generation
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

# Python-docx for Word document generation
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import qn, nsdecls


def _clean_markdown_for_text(md_text: str) -> str:
    """Strip complex markdown syntax for plain text exports."""
    if not md_text:
        return ""
    text = md_text
    text = re.sub(r'```[\s\S]*?```', '', text)
    text = re.sub(r'`([^`]+)`', r'\1', text)
    text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', text)
    text = re.sub(r'#{1,6}\s*', '', text)
    text = re.sub(r'[*_]{1,3}([^*_]+)[*_]{1,3}', r'\1', text)
    return text.strip()


def _format_markdown_for_reportlab(md_text: str) -> List[str]:
    """Convert markdown text into ReportLab Paragraph-compatible XML strings."""
    if not md_text:
        return []
    
    # Escape XML entities first
    text = md_text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    
    # Re-apply bold and italic in ReportLab tags
    text = re.sub(r'\*\*([^*]+)\*\*', r'<b>\1</b>', text)
    text = re.sub(r'\*([^*]+)\*', r'<i>\1</i>', text)
    text = re.sub(r'`([^`]+)`', r'<font face="Courier" color="#4338ca">\1</font>', text)
    
    paragraphs = []
    lines = text.split("\n")
    current_p = []
    
    for line in lines:
        stripped = line.strip()
        if not stripped:
            if current_p:
                paragraphs.append(" ".join(current_p))
                current_p = []
        elif stripped.startswith("### ") or stripped.startswith("#### "):
            if current_p:
                paragraphs.append(" ".join(current_p))
                current_p = []
            heading_content = stripped.lstrip("#").strip()
            paragraphs.append(f"<b><font size=12 color='#1e1b4b'>{heading_content}</font></b>")
        elif stripped.startswith("- ") or stripped.startswith("• "):
            if current_p:
                paragraphs.append(" ".join(current_p))
                current_p = []
            bullet_content = stripped[2:].strip()
            paragraphs.append(f"&bull; {bullet_content}")
        else:
            current_p.append(stripped)
            
    if current_p:
        paragraphs.append(" ".join(current_p))
        
    return paragraphs or [text]


def generate_conversation_docx(
    messages: List[Dict[str, Any]],
    candidate_name: str = "Candidate",
    target_role: str = "Software Engineer Intern",
    date_str: Optional[str] = None
) -> io.BytesIO:
    """Generate a high-quality Microsoft Word (.docx) transcript."""
    if not date_str:
        date_str = datetime.now().strftime("%B %d, %Y at %I:%M %p")

    doc = docx.Document()

    # Set standard margins (1 inch)
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.9)
        section.right_margin = Inches(0.9)

    # 1. Document Title
    title_p = doc.add_paragraph()
    title_run = title_p.add_run("TalentSprint AI — Career Companion Transcript")
    title_run.font.name = "Calibri"
    title_run.font.size = Pt(20)
    title_run.font.bold = True
    title_run.font.color.rgb = RGBColor(79, 70, 229)  # Indigo
    title_p.paragraph_format.space_after = Pt(2)

    # Subtitle
    sub_p = doc.add_paragraph()
    sub_run = sub_p.add_run("AI-Powered Mentorship, Role Matching & Interview Preparation")
    sub_run.font.name = "Calibri"
    sub_run.font.size = Pt(11)
    sub_run.font.italic = True
    sub_run.font.color.rgb = RGBColor(100, 116, 139)  # Slate
    sub_p.paragraph_format.space_after = Pt(14)

    # 2. Metadata Table
    table = doc.add_table(rows=2, cols=2)
    table.style = 'Table Grid'
    
    hdr_cells = table.rows[0].cells
    hdr_cells[0].text = f"Candidate: {candidate_name}"
    hdr_cells[1].text = f"Target Role: {target_role}"
    
    row2_cells = table.rows[1].cells
    row2_cells[0].text = f"Date: {date_str}"
    row2_cells[1].text = f"Total Exchanges: {len(messages)} messages"

    # Style metadata cells
    for row in table.rows:
        for cell in row.cells:
            tcPr = cell._tc.get_or_add_tcPr()
            shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="F8FAFC"/>')
            tcPr.append(shd)
            for p in cell.paragraphs:
                p.paragraph_format.space_after = Pt(2)
                p.paragraph_format.space_before = Pt(2)
                for run in p.runs:
                    run.font.name = "Calibri"
                    run.font.size = Pt(10)
                    run.font.color.rgb = RGBColor(51, 65, 85)

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # 3. Message Sequence
    for idx, m in enumerate(messages, 1):
        role = m.get("role", "user")
        content = m.get("content", "")
        is_user = role == "user"

        # Role Header
        role_p = doc.add_paragraph()
        role_p.paragraph_format.space_before = Pt(14)
        role_p.paragraph_format.space_after = Pt(4)

        if is_user:
            role_badge = role_p.add_run(f"[{idx}] 🧑 Candidate (You)")
            role_badge.font.name = "Calibri"
            role_badge.font.size = Pt(11.5)
            role_badge.font.bold = True
            role_badge.font.color.rgb = RGBColor(2, 132, 199)  # Sky Blue
        else:
            role_badge = role_p.add_run(f"[{idx}] 🤖 AI Career Companion Agent")
            role_badge.font.name = "Calibri"
            role_badge.font.size = Pt(11.5)
            role_badge.font.bold = True
            role_badge.font.color.rgb = RGBColor(79, 70, 229)  # Indigo

        # Message Content Paragraphs
        raw_lines = content.split("\n")
        for line in raw_lines:
            s = line.strip()
            if not s:
                continue
            
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(3)

            if s.startswith("### ") or s.startswith("#### "):
                h_text = s.lstrip("#").strip()
                r = p.add_run(h_text)
                r.font.name = "Calibri"
                r.font.size = Pt(12)
                r.font.bold = True
                r.font.color.rgb = RGBColor(15, 23, 42)
            elif s.startswith("- ") or s.startswith("• "):
                bullet_text = s[2:].strip()
                p.paragraph_format.left_indent = Inches(0.25)
                # Parse bold tags in bullet points
                parts = re.split(r'(\b\*\*[^*]+\*\*\b)', bullet_text)
                bullet_run = p.add_run("• ")
                bullet_run.font.color.rgb = RGBColor(79, 70, 229) if not is_user else RGBColor(2, 132, 199)
                for part in parts:
                    if part.startswith("**") and part.endswith("**"):
                        run = p.add_run(part[2:-2])
                        run.font.bold = True
                        run.font.color.rgb = RGBColor(15, 23, 42)
                    else:
                        run = p.add_run(part)
                        run.font.color.rgb = RGBColor(51, 65, 85)
                    run.font.name = "Calibri"
                    run.font.size = Pt(10.5)
            else:
                parts = re.split(r'(\b\*\*[^*]+\*\*\b)', s)
                for part in parts:
                    if part.startswith("**") and part.endswith("**"):
                        run = p.add_run(part[2:-2])
                        run.font.bold = True
                        run.font.color.rgb = RGBColor(15, 23, 42)
                    else:
                        run = p.add_run(part)
                        run.font.color.rgb = RGBColor(51, 65, 85)
                    run.font.name = "Calibri"
                    run.font.size = Pt(10.5)

    buffer = io.BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    return buffer


def generate_conversation_pdf(
    messages: List[Dict[str, Any]],
    candidate_name: str = "Candidate",
    target_role: str = "Software Engineer Intern",
    date_str: Optional[str] = None
) -> io.BytesIO:
    """Generate a clean, professional PDF transcript using ReportLab."""
    if not date_str:
        date_str = datetime.now().strftime("%B %d, %Y at %I:%M %p")

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#4f46e5'),
        spaceAfter=4
    )
    
    sub_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=13,
        textColor=colors.HexColor('#64748b'),
        spaceAfter=12
    )

    meta_style = ParagraphStyle(
        'MetaStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor('#334155')
    )

    user_hdr_style = ParagraphStyle(
        'UserHdr',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=colors.HexColor('#0284c7'),
        spaceBefore=10,
        spaceAfter=4
    )

    ai_hdr_style = ParagraphStyle(
        'AiHdr',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=colors.HexColor('#4338ca'),
        spaceBefore=12,
        spaceAfter=4
    )

    body_style = ParagraphStyle(
        'BodyMsg',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#1e293b'),
        spaceAfter=5
    )

    bullet_style = ParagraphStyle(
        'BulletMsg',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        leftIndent=15,
        textColor=colors.HexColor('#334155'),
        spaceAfter=4
    )

    story = []

    # Title & Subtitle
    story.append(Paragraph("TalentSprint AI — Career Companion Transcript", title_style))
    story.append(Paragraph("AI-Powered Preparation Agent for Internship Matching & Interview Preparation", sub_style))

    # Metadata Table
    meta_data = [
        [
            Paragraph(f"<b>Candidate:</b> {candidate_name}", meta_style),
            Paragraph(f"<b>Target Role:</b> {target_role}", meta_style)
        ],
        [
            Paragraph(f"<b>Date:</b> {date_str}", meta_style),
            Paragraph(f"<b>Total Exchanges:</b> {len(messages)} messages", meta_style)
        ]
    ]
    meta_table = Table(meta_data, colWidths=[260, 260])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 14))

    # Messages
    for idx, m in enumerate(messages, 1):
        role = m.get("role", "user")
        content = m.get("content", "")
        is_user = role == "user"

        msg_flowables = []
        if is_user:
            msg_flowables.append(Paragraph(f"[{idx}] 🧑 Candidate (You):", user_hdr_style))
        else:
            msg_flowables.append(Paragraph(f"[{idx}] 🤖 AI Career Companion Agent:", ai_hdr_style))

        formatted_paras = _format_markdown_for_reportlab(content)
        for p_text in formatted_paras:
            if p_text.startswith("&bull; "):
                msg_flowables.append(Paragraph(p_text, bullet_style))
            else:
                msg_flowables.append(Paragraph(p_text, body_style))

        msg_flowables.append(HRFlowable(
            width="100%", thickness=0.5, color=colors.HexColor('#e2e8f0'), spaceBefore=8, spaceAfter=8
        ))

        story.append(KeepTogether(msg_flowables))

    doc.build(story)
    buffer.seek(0)
    return buffer


def generate_conversation_markdown(
    messages: List[Dict[str, Any]],
    candidate_name: str = "Candidate",
    target_role: str = "Software Engineer Intern",
    date_str: Optional[str] = None
) -> str:
    """Generate clean, formatted Markdown (.md) text."""
    if not date_str:
        date_str = datetime.now().strftime("%B %d, %Y at %I:%M %p")

    lines = [
        f"# TalentSprint AI — Career Companion Transcript",
        f"",
        f"- **Candidate:** {candidate_name}",
        f"- **Target Role:** {target_role}",
        f"- **Export Date:** {date_str}",
        f"- **Total Messages:** {len(messages)}",
        f"",
        f"---",
        f""
    ]

    for idx, m in enumerate(messages, 1):
        role = m.get("role", "user")
        content = m.get("content", "").strip()
        if role == "user":
            lines.append(f"### [{idx}] 🧑 Candidate")
        else:
            lines.append(f"### [{idx}] 🤖 AI Career Companion Agent")
        lines.append("")
        lines.append(content)
        lines.append("")
        lines.append("---")
        lines.append("")

    return "\n".join(lines)


def generate_conversation_text(
    messages: List[Dict[str, Any]],
    candidate_name: str = "Candidate",
    target_role: str = "Software Engineer Intern",
    date_str: Optional[str] = None
) -> str:
    """Generate formatted Plain Text (.txt) representation."""
    if not date_str:
        date_str = datetime.now().strftime("%B %d, %Y at %I:%M %p")

    separator = "=" * 64
    lines = [
        separator,
        "TALENTSPRINT AI — CAREER COMPANION TRANSCRIPT",
        f"Candidate:   {candidate_name}",
        f"Target Role: {target_role}",
        f"Date:        {date_str}",
        f"Exchanges:   {len(messages)} messages",
        separator,
        ""
    ]

    for idx, m in enumerate(messages, 1):
        role = m.get("role", "user")
        content = _clean_markdown_for_text(m.get("content", ""))
        speaker = "🧑 Candidate" if role == "user" else "🤖 AI Career Companion Agent"
        lines.append(f"[{idx}] {speaker}:")
        lines.append(content)
        lines.append("")
        lines.append("-" * 40)
        lines.append("")

    return "\n".join(lines)
