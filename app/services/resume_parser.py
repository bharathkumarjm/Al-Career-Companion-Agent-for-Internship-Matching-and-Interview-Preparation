import os

from pypdf import PdfReader
from docx import Document


def extract_text_from_pdf(file_path: str) -> str:
    text = ""

    reader = PdfReader(file_path)

    for page in reader.pages:
        page_text = page.extract_text()

        if page_text:
            text += page_text + "\n"

    return text.strip()


def extract_text_from_docx(file_path: str) -> str:
    document = Document(file_path)

    text = ""

    for paragraph in document.paragraphs:
        if paragraph.text.strip():
            text += paragraph.text + "\n"

    return text.strip()


def extract_resume_text(
    file_path: str,
    file_extension: str
) -> str:

    if file_extension == ".pdf":
        return extract_text_from_pdf(file_path)

    elif file_extension == ".docx":
        return extract_text_from_docx(file_path)

    else:
        raise ValueError(
            "Unsupported file format"
        )