from sqlalchemy.orm import Session

from backend.models.skill import RoleRequirement, Skill


class SkillRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_all(self):
        return self.db.query(Skill).all()

    def create(self, skill: Skill) -> Skill:
        self.db.add(skill)
        self.db.commit()
        self.db.refresh(skill)
        return skill

    def get(self, skill_id: int) -> Skill | None:
        return self.db.query(Skill).filter(Skill.id == skill_id).first()

    def list_requirements(self, role_name: str):
        return self.db.query(RoleRequirement).filter(RoleRequirement.role_name == role_name).all()
