from io import BytesIO

import pdfplumber
import spacy

from backend.models.skill import Skill

nlp = spacy.load("en_core_web_sm")


def extract_text_from_pdf(content: bytes) -> str:
    pages: list[str] = []
    with pdfplumber.open(BytesIO(content)) as pdf:
        for page in pdf.pages:
            pages.append(page.extract_text() or "")
    return "\n".join(pages)


def extract_skills(text: str, ontology: list[str]) -> list[dict]:
    doc = nlp(text.lower())
    noun_tokens = {token.text.strip().lower() for token in doc if token.pos_ in {"NOUN", "PROPN"}}
    detected = []
    for skill in ontology:
        skill_l = skill.lower()
        if skill_l in text.lower() or skill_l in noun_tokens:
            detected.append({"skill": skill, "confidence": 0.92})
    return detected


def parse_resume(pdf_bytes: bytes, known_skills: list[Skill]) -> list[dict]:
    text = extract_text_from_pdf(pdf_bytes)
    return extract_skills(text, [row.name for row in known_skills])
