<<<<<<< HEAD
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, Numeric, String, Text, func, Index, UniqueConstraint
=======
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, func
>>>>>>> 3bcda08 (Updated backend files)
from backend.database import Base

class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
<<<<<<< HEAD
    employee_code = Column(String(50), unique=True, index=True, nullable=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=True)
    department = Column(String(100), nullable=False, index=True)
=======
    employee_code = Column(String(50), index=True, nullable=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), index=True, nullable=True)
    department = Column(String(100), nullable=False)
>>>>>>> 3bcda08 (Updated backend files)
    role = Column(String(100), nullable=False)
    year_exp = Column(Integer, default=0, nullable=False)
    join_date = Column(DateTime(timezone=True), server_default=func.now(), nullable=True)
    manager_name = Column(String(100), nullable=True)
    performance_score = Column(Integer, default=70, nullable=True)
<<<<<<< HEAD
    team_name = Column(String(100), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Composite indexes for common queries
    __table_args__ = (
        Index('idx_emp_department_team', 'department', 'team_name'),
    )
=======
    team_name = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
>>>>>>> 3bcda08 (Updated backend files)


class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
<<<<<<< HEAD
    skill_name = Column(String(100), nullable=False, unique=True, index=True)
    category = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Index for efficient category lookups
    __table_args__ = (
        Index('idx_skill_category', 'category'),
    )
=======
    skill_name = Column(String(100), nullable=False)
    category = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
>>>>>>> 3bcda08 (Updated backend files)


class EmployeeSkill(Base):
    __tablename__ = "employee_skills"

    id = Column(Integer, primary_key=True, index=True)
<<<<<<< HEAD
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False)
    proficiency_level = Column(Integer, nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Composite unique constraint to prevent duplicate skill assignments
    # Composite index for efficient lookups by employee or skill
    __table_args__ = (
        UniqueConstraint('employee_id', 'skill_id', name='uq_employee_skill'),
        Index('idx_emp_skill_emp_id', 'employee_id'),
        Index('idx_emp_skill_skill_id', 'skill_id'),
    )

=======
    employee_id = Column(Integer, ForeignKey("employees.id"))
    skill_id = Column(Integer, ForeignKey("skills.id"))
    proficiency_level = Column(Integer)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

>>>>>>> 3bcda08 (Updated backend files)

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
    role = Column(String(50), default="employee", nullable=False)  # admin, hr_manager, employee
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    last_login = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class JobRole(Base):
    __tablename__ = "job_roles"

    id = Column(Integer, primary_key=True, index=True)
    role_name = Column(String(120), unique=True, nullable=False, index=True)
    department = Column(String(100), nullable=False)
    required_skills_json = Column(Text, nullable=False, default="[]")
    target_headcount = Column(Integer, nullable=False, default=0)
    planning_horizon_months = Column(Integer, nullable=False, default=6)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class PredictionSnapshot(Base):
    __tablename__ = "prediction_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False, index=True)
    department = Column(String(100), nullable=False, index=True)
    scenario = Column(String(30), nullable=False, default="balanced")
    horizon_month = Column(Integer, nullable=False)
    forecast_date = Column(DateTime(timezone=True), nullable=False)
    predicted_demand = Column(Integer, nullable=False)
    predicted_supply = Column(Integer, nullable=False)
    predicted_gap = Column(Integer, nullable=False)
    model_version = Column(String(80), nullable=True)
    confidence = Column(Numeric(5, 2), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class RecommendationLog(Base):
    __tablename__ = "recommendation_logs"

    id = Column(Integer, primary_key=True, index=True)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False, index=True)
    department = Column(String(100), nullable=True, index=True)
    team_name = Column(String(100), nullable=True, index=True)
    required_count = Column(Integer, nullable=False, default=0)
    current_count = Column(Integer, nullable=False, default=0)
    gap = Column(Integer, nullable=False, default=0)
    hire_count = Column(Integer, nullable=False, default=0)
    upskill_count = Column(Integer, nullable=False, default=0)
    transfer_count = Column(Integer, nullable=False, default=0)
    decision = Column(String(120), nullable=False)
    rationale_json = Column(Text, nullable=False, default="[]")
    created_by = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
