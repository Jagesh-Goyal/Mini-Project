"""
NLP Skill Extractor — Resume Parsing
--------------------------------------
Extracts skills from resume text using regex pattern matching.

Usage:
    from ml.nlp_extractor import extract_skills_from_resume
    result = extract_skills_from_resume(resume_text, db)
"""

import re
from typing import Any, List, Tuple
from sqlalchemy.orm import Session

from backend.model import Skill


# ── Skill patterns ─────────────────────────────────────────────────────────────
# Each key is the canonical skill name; value is the regex to detect it.
SKILL_PATTERNS = {
    # Programming Languages
    "python":      r"\b(python|py)\b",
    "javascript":  r"\b(javascript|js|node\.?js)\b",
    "java":        r"\b(java)\b",
    "cpp":         r"\b(c\+\+|cpp)\b",
    "csharp":      r"\b(c#|csharp|\.net)\b",
    "php":         r"\b(php)\b",
    "ruby":        r"\b(ruby|rails)\b",
    "go":          r"\b(golang|go lang)\b",
    "rust":        r"\b(rust)\b",
    "sql":         r"\b(sql|pl/sql|tsql|mysql|postgresql)\b",

    # Frontend
    "react":       r"\b(react|reactjs|react\.js)\b",
    "angular":     r"\b(angular|angularjs)\b",
    "vue":         r"\b(vue|vuejs)\b",
    "typescript":  r"\b(typescript|ts)\b",
    "html":        r"\b(html|html5)\b",
    "css":         r"\b(css|css3|scss|sass)\b",

    # Backend Frameworks
    "django":      r"\b(django)\b",
    "fastapi":     r"\b(fastapi|fast api)\b",
    "flask":       r"\b(flask)\b",
    "spring":      r"\b(spring|spring boot)\b",
    "express":     r"\b(express|expressjs)\b",

    # Cloud & DevOps
    "aws":         r"\b(aws|amazon web services|ec2|s3|lambda|dynamodb)\b",
    "azure":       r"\b(azure|microsoft azure)\b",
    "gcp":         r"\b(gcp|google cloud|bigquery)\b",
    "docker":      r"\b(docker|dockerize)\b",
    "kubernetes":  r"\b(kubernetes|k8s|helm)\b",
    "terraform":   r"\b(terraform|iac)\b",
    "ci/cd":       r"\b(ci/cd|cicd|jenkins|gitlab ci|github actions)\b",

    # Databases
    "postgresql":     r"\b(postgresql|postgres|pg)\b",
    "mysql":          r"\b(mysql)\b",
    "mongodb":        r"\b(mongodb|mongo)\b",
    "redis":          r"\b(redis)\b",
    "elasticsearch":  r"\b(elasticsearch|elastic)\b",
    "cassandra":      r"\b(cassandra)\b",

    # AI / ML
    "machine learning":       r"\b(machine learning|ml)\b",
    "artificial intelligence": r"\b(artificial intelligence|ai engineering|genai|generative ai)\b",
    "tensorflow":  r"\b(tensorflow|tf)\b",
    "pytorch":     r"\b(pytorch)\b",
    "keras":       r"\b(keras)\b",
    "scikit-learn":r"\b(scikit-learn|scikit learn|sklearn)\b",
    "nlp":         r"\b(nlp|natural language processing)\b",
    "deep learning":r"\b(deep learning|neural networks)\b",

    # Data & Analytics
    "pandas":        r"\b(pandas)\b",
    "numpy":         r"\b(numpy)\b",
    "spark":         r"\b(spark|apache spark|pyspark)\b",
    "hadoop":        r"\b(hadoop)\b",
    "power bi":      r"\b(power bi|powerbi)\b",
    "tableau":       r"\b(tableau)\b",
    "data analysis": r"\b(data analysis|data analyst)\b",

    # Security
    "cybersecurity": r"\b(cybersecurity|information security|infosec|application security|appsec)\b",
    "cloud security":r"\b(cloud security|cloud automation security)\b",

    # General
    "git":          r"\b(git|github|gitlab)\b",
    "rest api":     r"\b(rest api|restful api|restful)\b",
    "graphql":      r"\b(graphql)\b",
    "microservices":r"\b(microservices)\b",
    "agile":        r"\b(agile|scrum|kanban)\b",
}

SKILL_CONFIDENCE_BOOSTS = {
    "machine learning": 0.08,
    "artificial intelligence": 0.08,
    "cloud security": 0.08,
    "kubernetes": 0.06,
    "aws": 0.05,
    "python": 0.04,
}

SKILL_ALIASES = {
    "cpp": ["c++", "cpp"],
    "csharp": ["c#", "csharp", ".net"],
    "ci/cd": ["cicd", "ci/cd", "jenkins", "github actions", "gitlab ci"],
    "artificial intelligence": ["ai", "genai", "generative ai"],
    "machine learning": ["ml", "machine learning"],
    "rest api": ["rest api", "restful api", "restful"],
}


# ── Extractor class ────────────────────────────────────────────────────────────

class NLPSkillExtractor:
    """Extract skills from resume text using regex pattern matching."""

    def __init__(self, db: Session = None):
        self.db = db
        self.skill_patterns = SKILL_PATTERNS

    @staticmethod
    def _normalize_skill_key(value: str) -> str:
        normalized = re.sub(r"[^a-z0-9]+", " ", value.lower()).strip()
        return re.sub(r"\s+", " ", normalized)

    @staticmethod
    def _extract_evidence_snippet(text: str, start: int, end: int, window: int = 48) -> str:
        left = max(0, start - window)
        right = min(len(text), end + window)
        snippet = text[left:right].replace("\n", " ").strip()
        return re.sub(r"\s+", " ", snippet)

    def extract_skill_signals(self, text: str) -> dict[str, dict[str, Any]]:
        """
        Extract skills with confidence and evidence snippets.

        Returns:
            {
                "python": {
                    "confidence_score": 0.83,
                    "mentions": 3,
                    "aliases_detected": ["python"],
                    "evidence": ["..."]
                },
                ...
            }
        """
        if not text:
            return {}

        signals: dict[str, dict[str, Any]] = {}

        for skill_name, pattern in self.skill_patterns.items():
            matches = list(re.finditer(pattern, text, re.IGNORECASE))
            if not matches:
                continue

            aliases_detected = sorted({match.group(0).strip().lower() for match in matches if match.group(0).strip()})
            evidence = [
                self._extract_evidence_snippet(text, match.start(), match.end())
                for match in matches[:3]
            ]
            unique_alias_hits = len(aliases_detected)
            mentions = len(matches)

            confidence_score = min(
                0.99,
                round(
                    0.42
                    + (0.16 * min(unique_alias_hits, 3))
                    + (0.08 if mentions > 1 else 0)
                    + SKILL_CONFIDENCE_BOOSTS.get(skill_name, 0),
                    3,
                ),
            )

            signals[skill_name] = {
                "confidence_score": confidence_score,
                "mentions": mentions,
                "aliases_detected": aliases_detected,
                "evidence": evidence,
            }

        return signals

    def extract_skills_from_text(self, text: str) -> List[str]:
        """
        Scan text for known skill patterns.

        Returns:
            Sorted list of canonical skill names found.
        """
        if not text:
            return []

        return sorted(self.extract_skill_signals(text).keys())

    def match_skills_to_database(self, extracted_skills: List[str], db: Session) -> List[Tuple[str, int]]:
        """
        Map extracted skill names to rows in the Skill table.

        Returns:
            List of (canonical_name, skill_id) tuples.
        """
        db_skills = db.query(Skill).all()
        exact_index = {self._normalize_skill_key(skill.skill_name): skill for skill in db_skills}

        matched: list[tuple[str, int]] = []
        seen_skill_ids: set[int] = set()

        for skill_name in extracted_skills:
            normalized_skill = self._normalize_skill_key(skill_name)

            exact_match = exact_index.get(normalized_skill)
            if exact_match and exact_match.id not in seen_skill_ids:
                matched.append((skill_name, exact_match.id))
                seen_skill_ids.add(exact_match.id)
                continue

            aliases = SKILL_ALIASES.get(skill_name, [skill_name])
            alias_matches = [
                skill
                for skill in db_skills
                if any(
                    alias.lower() in skill.skill_name.lower() or skill.skill_name.lower() in alias.lower()
                    for alias in aliases
                )
            ]
            if alias_matches:
                alias_matches.sort(key=lambda item: len(item.skill_name))
                alias_match = alias_matches[0]
                if alias_match.id not in seen_skill_ids:
                    matched.append((skill_name, alias_match.id))
                    seen_skill_ids.add(alias_match.id)
                continue

            # Fall back to partial token overlap matching.
            tokens = set(normalized_skill.split())
            if not tokens:
                continue

            scored_candidates: list[tuple[float, Skill]] = []
            for candidate in db_skills:
                candidate_tokens = set(self._normalize_skill_key(candidate.skill_name).split())
                if not candidate_tokens:
                    continue
                overlap = len(tokens.intersection(candidate_tokens))
                if overlap == 0:
                    continue
                score = overlap / max(len(tokens), len(candidate_tokens))
                scored_candidates.append((score, candidate))

            if scored_candidates:
                scored_candidates.sort(key=lambda item: item[0], reverse=True)
                best_score, best_candidate = scored_candidates[0]
                if best_score >= 0.5 and best_candidate.id not in seen_skill_ids:
                    matched.append((skill_name, best_candidate.id))
                    seen_skill_ids.add(best_candidate.id)

        return matched

    def _extract_basic_info(self, text: str) -> dict:
        """Extract candidate name and years of experience from text."""
        info      = {}
        text_lower = text.lower()

        exp_patterns = [
            r"(\d+)\+?\s*years?\s*(?:of\s*)?(?:experience|exp)",
            r"(?:experience|exp)[:\s]+(\d+)\+?\s*years?",
        ]
        for pattern in exp_patterns:
            m = re.search(pattern, text_lower)
            if m:
                try:
                    info["experience_years"] = int(m.group(1))
                    break
                except (ValueError, IndexError):
                    pass

        info.setdefault("experience_years", 0)

        # Name: usually one of the first 5 non-contact lines
        for line in text.split("\n")[:5]:
            line_clean = line.strip()
            if (
                line_clean
                and len(line_clean) < 50
                and not any(kw in line_clean.lower() for kw in ["email", "phone", "address", "@", "http"])
            ):
                info["name"] = line_clean
                break

        return info

    def parse_resume_text(self, text: str, db: Session) -> dict:
        """
        Full pipeline: extract skills and basic info from resume text.

        Returns:
            {
                "name": str,
                "extracted_skills": [str, ...],
                "mapped_skills": [{"skill_name": str, "skill_id": int}, ...],
                "experience_years": int,
            }
        """
        skill_signals = self.extract_skill_signals(text)
        extracted_skills = sorted(skill_signals.keys())
        matched_skills = self.match_skills_to_database(extracted_skills, db)
        parsed_info = self._extract_basic_info(text)

        matched_skill_map = {skill_name: skill_id for skill_name, skill_id in matched_skills}
        mapped_skills = []
        for skill_name in extracted_skills:
            skill_id = matched_skill_map.get(skill_name)
            if skill_id is None:
                continue

            signal = skill_signals.get(skill_name, {})
            mapped_skills.append(
                {
                    "skill_name": skill_name,
                    "skill_id": skill_id,
                    "confidence_score": signal.get("confidence_score", 0.5),
                    "mentions": signal.get("mentions", 1),
                    "evidence": signal.get("evidence", [])[:2],
                }
            )

        skill_intelligence = [
            {
                "skill_name": skill_name,
                "confidence_score": payload.get("confidence_score", 0.5),
                "mentions": payload.get("mentions", 1),
                "aliases_detected": payload.get("aliases_detected", []),
                "evidence": payload.get("evidence", []),
            }
            for skill_name, payload in sorted(
                skill_signals.items(),
                key=lambda item: item[1].get("confidence_score", 0),
                reverse=True,
            )
        ]

        return {
            "name":             parsed_info.get("name", "Unknown"),
            "extracted_skills": extracted_skills,
            "mapped_skills":    mapped_skills,
            "skill_intelligence": skill_intelligence,
            "experience_years": parsed_info.get("experience_years", 0),
        }


# ── Convenience function ───────────────────────────────────────────────────────

def extract_skills_from_resume(resume_text: str, db: Session) -> dict:
    """Convenience wrapper — parse a resume and return extracted skill info."""
    return NLPSkillExtractor(db).parse_resume_text(resume_text, db)
