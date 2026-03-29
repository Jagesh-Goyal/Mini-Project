import bleach
from sqlalchemy.orm import Session

from backend.models.skill import Skill
from backend.repositories.skill_repo import SkillRepository


class SkillService:
    def __init__(self, db: Session):
        self.repo = SkillRepository(db)

    def list_skills(self):
        return self.repo.list_all()

    def create_skill(self, name: str, category: str, description: str):
        skill = Skill(
            name=bleach.clean(name, strip=True),
            category=bleach.clean(category, strip=True),
            description=bleach.clean(description, strip=True),
        )
        return self.repo.create(skill)
