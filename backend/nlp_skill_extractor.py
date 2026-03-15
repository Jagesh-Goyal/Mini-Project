<<<<<<< HEAD
"""
NLP Skill Extractor for Resume Parsing
Extracts skills from resume text using pattern matching and keyword detection
"""

import re
from typing import List, Tuple, Set
from sqlalchemy.orm import Session
from backend.model import Skill


# Define skill keywords and synonyms
SKILL_PATTERNS = {
    # Programming Languages
    "python": r"\b(python|py)\b",
    "javascript": r"\b(javascript|js|node\.?js)\b",
    "java": r"\b(java)\b",
    "cpp": r"\b(c\+\+|cpp)\b",
    "csharp": r"\b(c#|csharp|\.net)\b",
    "php": r"\b(php)\b",
    "ruby": r"\b(ruby|rails)\b",
    "go": r"\b(golang|go lang)\b",
    "rust": r"\b(rust)\b",
    "sql": r"\b(sql|pl/sql|tsql|mysql|postgresql)\b",
    
    # Frontend
    "react": r"\b(react|reactjs|react\.js)\b",
    "angular": r"\b(angular|angularjs)\b",
    "vue": r"\b(vue|vuejs)\b",
    "typescript": r"\b(typescript|ts)\b",
    "html": r"\b(html|html5)\b",
    "css": r"\b(css|css3|scss|sass)\b",
    
    # Backend Frameworks
    "django": r"\b(django)\b",
    "fastapi": r"\b(fastapi|fast api)\b",
    "flask": r"\b(flask)\b",
    "spring": r"\b(spring|spring boot)\b",
    "express": r"\b(express|expressjs)\b",
    
    # Cloud & DevOps
    "aws": r"\b(aws|amazon web services|ec2|s3|lambda|dynamodb)\b",
    "azure": r"\b(azure|microsoft azure)\b",
    "gcp": r"\b(gcp|google cloud|bigquery)\b",
    "docker": r"\b(docker|dockerize)\b",
    "kubernetes": r"\b(kubernetes|k8s|helm)\b",
    "terraform": r"\b(terraform|iac)\b",
    "ci/cd": r"\b(ci/cd|cicd|jenkins|gitlab ci|github actions)\b",
    
    # Databases
    "postgresql": r"\b(postgresql|postgres|pg)\b",
    "mysql": r"\b(mysql)\b",
    "mongodb": r"\b(mongodb|mongo)\b",
    "redis": r"\b(redis)\b",
    "elasticsearch": r"\b(elasticsearch|elastic)\b",
    "cassandra": r"\b(cassandra)\b",
    
    # AI/ML
    "machine learning": r"\b(machine learning|ml)\b",
    "artificial intelligence": r"\b(artificial intelligence|ai)\b",
    "tensorflow": r"\b(tensorflow|tf)\b",
    "pytorch": r"\b(pytorch)\b",
    "keras": r"\b(keras)\b",
    "scikit-learn": r"\b(scikit-learn|scikit learn|sklearn)\b",
    "nlp": r"\b(nlp|natural language processing)\b",
    "deep learning": r"\b(deep learning|neural networks)\b",
    
    # Data & Analytics
    "pandas": r"\b(pandas)\b",
    "numpy": r"\b(numpy)\b",
    "spark": r"\b(spark|apache spark|pyspark)\b",
    "hadoop": r"\b(hadoop)\b",
    "power bi": r"\b(power bi|powerbi)\b",
    "tableau": r"\b(tableau)\b",
    "data analysis": r"\b(data analysis|data analyst)\b",
    
    # Security
    "cybersecurity": r"\b(cybersecurity|security|information security|infosec)\b",
    "cloud security": r"\b(cloud security|cloud automation security)\b",
    
    # Others
    "git": r"\b(git|github|gitlab)\b",
    "rest api": r"\b(rest|rest api|restful)\b",
    "graphql": r"\b(graphql)\b",
    "microservices": r"\b(microservices)\b",
    "agile": r"\b(agile|scrum|kanban)\b",
}


class NLPSkillExtractor:
    """Extract skills from resume text using pattern matching."""
    
    def __init__(self, db: Session = None):
        self.db = db
        self.skill_patterns = SKILL_PATTERNS
        self.extracted_skills_cache = {}
    
    def extract_skills_from_text(self, text: str) -> List[str]:
        """
        Extract skills from resume text using regex patterns.
        
        Args:
            text: Resume text content
            
        Returns:
            List of extracted skill names
        """
        if not text:
            return []
        
        text_lower = text.lower()
        extracted = set()
        
        # Match patterns and extract skill names
        for skill_name, pattern in self.skill_patterns.items():
            if re.search(pattern, text_lower, re.IGNORECASE):
                extracted.add(skill_name)
        
        return sorted(list(extracted))
    
    def match_skills_to_database(self, extracted_skills: List[str], db: Session) -> List[Tuple[str, int]]:
        """
        Match extracted skills to database skills.
        
        Args:
            extracted_skills: List of extracted skill names
            db: Database session
            
        Returns:
            List of (skill_name, skill_id) tuples
        """
        matched = []
        
        for skill_name in extracted_skills:
            # Try exact match first
            db_skill = db.query(Skill).filter(
                Skill.skill_name.ilike(skill_name)
            ).first()
            
            if db_skill:
                matched.append((skill_name, db_skill.id))
            else:
                # Try partial match
                similar_skills = db.query(Skill).filter(
                    Skill.skill_name.ilike(f"%{skill_name}%")
                ).all()
                
                if similar_skills:
                    for db_skill in similar_skills:
                        matched.append((db_skill.skill_name, db_skill.id))
                        break  # Take first match
        
        return matched
    
    def parse_resume_text(self, text: str, db: Session) -> dict:
        """
        Full pipeline: Extract skills and parse resume info.
        
        Args:
            text: Resume text content
            db: Database session
            
        Returns:
            Dictionary with extracted info
        """
        # Extract skills
        extracted_skills = self.extract_skills_from_text(text)
        
        # Match to database
        matched_skills = self.match_skills_to_database(extracted_skills, db)
        
        # Extract basic info
        parsed_info = self._extract_basic_info(text)
        
        return {
            "name": parsed_info.get("name", "Unknown"),
            "extracted_skills": extracted_skills,
            "mapped_skills": [
                {
                    "skill_name": skill[0],
                    "skill_id": skill[1]
                }
                for skill in matched_skills
            ],
            "experience_years": parsed_info.get("experience_years", 0),
        }
    
    def _extract_basic_info(self, text: str) -> dict:
        """Extract name and experience from text."""
        info = {}
        text_lower = text.lower()
        
        # Try to extract years of experience
        exp_patterns = [
            r"(\d+)\+?\s*years?\s*(?:of\s*)?(?:experience|exp)",
            r"(?:experience|exp)[:\s]+(\d+)\+?\s*years?",
        ]
        
        for pattern in exp_patterns:
            match = re.search(pattern, text_lower)
            if match:
                try:
                    info["experience_years"] = int(match.group(1))
                    break
                except (ValueError, IndexError):
                    pass
        
        if "experience_years" not in info:
            info["experience_years"] = 0
        
        # Name extraction (usually first line or after header)
        lines = text.split('\n')
        for line in lines[:5]:  # Check first 5 lines
            line_clean = line.strip()
            if line_clean and len(line_clean) < 50 and not any(
                keyword in line_clean.lower() 
                for keyword in ["email", "phone", "address", "@", "http"]
            ):
                info["name"] = line_clean
                break
        
        return info


def extract_skills_from_resume(resume_text: str, db: Session) -> dict:
    """Convenience function to extract skills from resume text."""
    extractor = NLPSkillExtractor(db)
    return extractor.parse_resume_text(resume_text, db)
=======
"""
Backward-compatibility shim.
NLP logic has been moved to the top-level ml/ package.
    ml/nlp_extractor.py → NLPSkillExtractor, extract_skills_from_resume, SKILL_PATTERNS
"""
# Re-export everything so existing imports like
#   from backend.nlp_skill_extractor import extract_skills_from_resume
# keep working without changes.
from ml.nlp_extractor import (  # noqa: F401
    NLPSkillExtractor,
    extract_skills_from_resume,
    SKILL_PATTERNS,
)


# Define skill keywords and synonyms
SKILL_PATTERNS = {
    # Programming Languages
    "python": r"\b(python|py)\b",
    "javascript": r"\b(javascript|js|node\.?js)\b",
    "java": r"\b(java)\b",
    "cpp": r"\b(c\+\+|cpp)\b",
    "csharp": r"\b(c#|csharp|\.net)\b",
    "php": r"\b(php)\b",
    "ruby": r"\b(ruby|rails)\b",
    "go": r"\b(golang|go lang)\b",
    "rust": r"\b(rust)\b",
    "sql": r"\b(sql|pl/sql|tsql|mysql|postgresql)\b",
    
    # Frontend
    "react": r"\b(react|reactjs|react\.js)\b",
    "angular": r"\b(angular|angularjs)\b",
    "vue": r"\b(vue|vuejs)\b",
    "typescript": r"\b(typescript|ts)\b",
    "html": r"\b(html|html5)\b",
    "css": r"\b(css|css3|scss|sass)\b",
    
    # Backend Frameworks
    "django": r"\b(django)\b",
    "fastapi": r"\b(fastapi|fast api)\b",
    "flask": r"\b(flask)\b",
    "spring": r"\b(spring|spring boot)\b",
    "express": r"\b(express|expressjs)\b",
    
    # Cloud & DevOps
    "aws": r"\b(aws|amazon web services|ec2|s3|lambda|dynamodb)\b",
    "azure": r"\b(azure|microsoft azure)\b",
    "gcp": r"\b(gcp|google cloud|bigquery)\b",
    "docker": r"\b(docker|dockerize)\b",
    "kubernetes": r"\b(kubernetes|k8s|helm)\b",
    "terraform": r"\b(terraform|iac)\b",
    "ci/cd": r"\b(ci/cd|cicd|jenkins|gitlab ci|github actions)\b",
    
    # Databases
    "postgresql": r"\b(postgresql|postgres|pg)\b",
    "mysql": r"\b(mysql)\b",
    "mongodb": r"\b(mongodb|mongo)\b",
    "redis": r"\b(redis)\b",
    "elasticsearch": r"\b(elasticsearch|elastic)\b",
    "cassandra": r"\b(cassandra)\b",
    
    # AI/ML
    "machine learning": r"\b(machine learning|ml)\b",
    "artificial intelligence": r"\b(artificial intelligence|ai)\b",
    "tensorflow": r"\b(tensorflow|tf)\b",
    "pytorch": r"\b(pytorch)\b",
    "keras": r"\b(keras)\b",
    "scikit-learn": r"\b(scikit-learn|scikit learn|sklearn)\b",
    "nlp": r"\b(nlp|natural language processing)\b",
    "deep learning": r"\b(deep learning|neural networks)\b",
    
    # Data & Analytics
    "pandas": r"\b(pandas)\b",
    "numpy": r"\b(numpy)\b",
    "spark": r"\b(spark|apache spark|pyspark)\b",
    "hadoop": r"\b(hadoop)\b",
    "power bi": r"\b(power bi|powerbi)\b",
    "tableau": r"\b(tableau)\b",
    "data analysis": r"\b(data analysis|data analyst)\b",
    
    # Security
    "cybersecurity": r"\b(cybersecurity|security|information security|infosec)\b",
    "cloud security": r"\b(cloud security|cloud automation security)\b",
    
    # Others
    "git": r"\b(git|github|gitlab)\b",
    "rest api": r"\b(rest|rest api|restful)\b",
    "graphql": r"\b(graphql)\b",
    "microservices": r"\b(microservices)\b",
    "agile": r"\b(agile|scrum|kanban)\b",
}


class NLPSkillExtractor:
    """Extract skills from resume text using pattern matching."""
    
    def __init__(self, db: Session = None):
        self.db = db
        self.skill_patterns = SKILL_PATTERNS
        self.extracted_skills_cache = {}
    
    def extract_skills_from_text(self, text: str) -> List[str]:
        """
        Extract skills from resume text using regex patterns.
        
        Args:
            text: Resume text content
            
        Returns:
            List of extracted skill names
        """
        if not text:
            return []
        
        text_lower = text.lower()
        extracted = set()
        
        # Match patterns and extract skill names
        for skill_name, pattern in self.skill_patterns.items():
            if re.search(pattern, text_lower, re.IGNORECASE):
                extracted.add(skill_name)
        
        return sorted(list(extracted))
    
    def match_skills_to_database(self, extracted_skills: List[str], db: Session) -> List[Tuple[str, int]]:
        """
        Match extracted skills to database skills.
        
        Args:
            extracted_skills: List of extracted skill names
            db: Database session
            
        Returns:
            List of (skill_name, skill_id) tuples
        """
        matched = []
        
        for skill_name in extracted_skills:
            # Try exact match first
            db_skill = db.query(Skill).filter(
                Skill.skill_name.ilike(skill_name)
            ).first()
            
            if db_skill:
                matched.append((skill_name, db_skill.id))
            else:
                # Try partial match
                similar_skills = db.query(Skill).filter(
                    Skill.skill_name.ilike(f"%{skill_name}%")
                ).all()
                
                if similar_skills:
                    for db_skill in similar_skills:
                        matched.append((db_skill.skill_name, db_skill.id))
                        break  # Take first match
        
        return matched
    
    def parse_resume_text(self, text: str, db: Session) -> dict:
        """
        Full pipeline: Extract skills and parse resume info.
        
        Args:
            text: Resume text content
            db: Database session
            
        Returns:
            Dictionary with extracted info
        """
        # Extract skills
        extracted_skills = self.extract_skills_from_text(text)
        
        # Match to database
        matched_skills = self.match_skills_to_database(extracted_skills, db)
        
        # Extract basic info
        parsed_info = self._extract_basic_info(text)
        
        return {
            "name": parsed_info.get("name", "Unknown"),
            "extracted_skills": extracted_skills,
            "mapped_skills": [
                {
                    "skill_name": skill[0],
                    "skill_id": skill[1]
                }
                for skill in matched_skills
            ],
            "experience_years": parsed_info.get("experience_years", 0),
        }
    
    def _extract_basic_info(self, text: str) -> dict:
        """Extract name and experience from text."""
        info = {}
        text_lower = text.lower()
        
        # Try to extract years of experience
        exp_patterns = [
            r"(\d+)\+?\s*years?\s*(?:of\s*)?(?:experience|exp)",
            r"(?:experience|exp)[:\s]+(\d+)\+?\s*years?",
        ]
        
        for pattern in exp_patterns:
            match = re.search(pattern, text_lower)
            if match:
                try:
                    info["experience_years"] = int(match.group(1))
                    break
                except (ValueError, IndexError):
                    pass
        
        if "experience_years" not in info:
            info["experience_years"] = 0
        
        # Name extraction (usually first line or after header)
        lines = text.split('\n')
        for line in lines[:5]:  # Check first 5 lines
            line_clean = line.strip()
            if line_clean and len(line_clean) < 50 and not any(
                keyword in line_clean.lower() 
                for keyword in ["email", "phone", "address", "@", "http"]
            ):
                info["name"] = line_clean
                break
        
        return info


def extract_skills_from_resume(resume_text: str, db: Session) -> dict:
    """Convenience function to extract skills from resume text."""
    extractor = NLPSkillExtractor(db)
    return extractor.parse_resume_text(resume_text, db)
>>>>>>> 74efafe (add backend)
