from sqlalchemy.orm import Session

from backend.models.skill import Skill


def list_skills(db: Session) -> list[Skill]:
    return db.query(Skill).order_by(Skill.name.asc()).all()


def get_by_id(db: Session, skill_id: int) -> Skill | None:
    return db.query(Skill).filter(Skill.id == skill_id).first()


def get_by_name(db: Session, name: str) -> Skill | None:
    return db.query(Skill).filter(Skill.name.ilike(name)).first()


def create(db: Session, skill: Skill) -> Skill:
    db.add(skill)
    db.commit()
    db.refresh(skill)
    return skill
