"""
ML Package — Workforce Intelligence
=====================================
Structure:
    ml/
    ├── model.py          → Demand Forecasting (Random Forest)
    │                       Turnover Prediction (Gradient Boosting)
    ├── nlp_extractor.py  → NLP-based resume skill extraction
    └── models/           → Saved .pkl model files (auto-created at runtime)

Usage (from anywhere in the project):
    from ml.model import ml_models
    from ml.nlp_extractor import extract_skills_from_resume
"""

from ml.model import MLModels, ml_models
from ml.nlp_extractor import NLPSkillExtractor, extract_skills_from_resume, SKILL_PATTERNS

__all__ = [
    "MLModels",
    "ml_models",
    "NLPSkillExtractor",
    "extract_skills_from_resume",
    "SKILL_PATTERNS",
]
