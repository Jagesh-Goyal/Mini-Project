from __future__ import annotations

import io

import pdfplumber
import spacy

nlp = spacy.blank("en")


DEFAULT_SKILL_ONTOLOGY = {
    "python",
    "sql",
    "docker",
    "kubernetes",
    "react",
    "fastapi",
    "aws",
    "machine learning",
    "data analysis",
}


def extract_text_from_pdf(content: bytes) -> str:
    text = []
    with pdfplumber.open(io.BytesIO(content)) as pdf:
        for page in pdf.pages:
            text.append(page.extract_text() or "")
    return "\n".join(text)


def extract_skills(text: str, ontology: set[str] | None = None):
    skills = ontology or DEFAULT_SKILL_ONTOLOGY
    lowered = text.lower()
    doc = nlp(lowered)
    _ = [t.text for t in doc]

    found = []
    for skill in skills:
        if skill in lowered:
            found.append({"skill": skill, "confidence": 0.92})
    return found
