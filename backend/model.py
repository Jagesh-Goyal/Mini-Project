from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, func
from backend.database import Base

class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    employee_code = Column(String(50), index=True, nullable=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), index=True, nullable=True)
    department = Column(String(100), nullable=False)
    role = Column(String(100), nullable=False)
    year_exp = Column(Integer, default=0, nullable=False)
    join_date = Column(DateTime(timezone=True), server_default=func.now(), nullable=True)
    manager_name = Column(String(100), nullable=True)
    performance_score = Column(Integer, default=70, nullable=True)
    team_name = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    skill_name = Column(String(100), nullable=False)
    category = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class EmployeeSkill(Base):
    __tablename__ = "employee_skills"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"))
    skill_id = Column(Integer, ForeignKey("skills.id"))
    proficiency_level = Column(Integer)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class TrainingHistory(Base):
    __tablename__ = "training_history"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    training_name = Column(String(150), nullable=False)
    provider = Column(String(150), nullable=True)
    status = Column(String(50), nullable=False, default="Planned")
    focus_skill = Column(String(100), nullable=True)
    duration_hours = Column(Integer, nullable=True)
    completion_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(512), nullable=False)
    role = Column(String(50), default="user", nullable=False)  # user, admin, manager
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
