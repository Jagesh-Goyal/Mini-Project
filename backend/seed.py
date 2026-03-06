from backend.database import SessionLocal
from backend.model import Employee, Skill, EmployeeSkill

def seed_database():
    """Populate database with sample employees, skills, and assignments"""
    db = SessionLocal()
    
    # Check if data already exists
    if db.query(Employee).first() is not None:
        print("✅ Database already seeded. Skipping...")
        db.close()
        return
    
    # Sample Skills
    skills_data = [
        {"skill_name": "Python", "category": "Programming"},
        {"skill_name": "React", "category": "Frontend"},
        {"skill_name": "AWS", "category": "Cloud"},
        {"skill_name": "Machine Learning", "category": "AI/ML"},
        {"skill_name": "Docker", "category": "DevOps"},
        {"skill_name": "SQL", "category": "Database"},
        {"skill_name": "JavaScript", "category": "Programming"},
        {"skill_name": "Kubernetes", "category": "DevOps"},
        {"skill_name": "TensorFlow", "category": "AI/ML"},
        {"skill_name": "FastAPI", "category": "Backend"},
    ]
    
    skills = []
    for s in skills_data:
        skill = Skill(**s)
        db.add(skill)
        skills.append(skill)
    db.flush()
    
    # Sample Employees
    employees_data = [
        {"name": "Arjun Kumar", "department": "Engineering", "role": "Senior Developer", "year_exp": 8},
        {"name": "Priya Singh", "department": "Data Science", "role": "ML Engineer", "year_exp": 5},
        {"name": "Rashid Ahmed", "department": "Engineering", "role": "Frontend Developer", "year_exp": 3},
        {"name": "Neha Verma", "department": "DevOps", "role": "DevOps Engineer", "year_exp": 6},
        {"name": "Amit Patel", "department": "Data Science", "role": "Data Analyst", "year_exp": 4},
        {"name": "Sophia Chen", "department": "Engineering", "role": "Backend Developer", "year_exp": 7},
        {"name": "Vikram Reddy", "department": "Engineering", "role": "Junior Developer", "year_exp": 1},
        {"name": "Aisha Khan", "department": "Data Science", "role": "AI Researcher", "year_exp": 6},
        {"name": "Rohan Das", "department": "DevOps", "role": "Cloud Architect", "year_exp": 9},
        {"name": "Maya Gupta", "department": "Engineering", "role": "Full Stack Developer", "year_exp": 4},
    ]
    
    employees = []
    for e in employees_data:
        emp = Employee(**e)
        db.add(emp)
        employees.append(emp)
    db.flush()
    
    # Skill Assignments (Employee -> Skills with proficiency)
    proficiency_map = {
        "Beginner": 1,
        "Intermediate": 2,
        "Advanced": 3,
        "Expert": 4
    }
    
    assignments = [
        # Arjun Kumar (Senior Developer)
        (0, 0, "Expert"),      # Python
        (0, 6, "Advanced"),    # JavaScript
        (0, 5, "Advanced"),    # SQL
        (0, 9, "Advanced"),    # FastAPI
        
        # Priya Singh (ML Engineer)
        (1, 0, "Advanced"),    # Python
        (1, 3, "Expert"),      # Machine Learning
        (1, 8, "Advanced"),    # TensorFlow
        (1, 5, "Intermediate"),# SQL
        
        # Rashid Ahmed (Frontend Developer)
        (2, 1, "Expert"),      # React
        (2, 6, "Advanced"),    # JavaScript
        (2, 5, "Intermediate"),# SQL
        
        # Neha Verma (DevOps Engineer)
        (3, 4, "Expert"),      # Docker
        (3, 7, "Advanced"),    # Kubernetes
        (3, 2, "Advanced"),    # AWS
        
        # Amit Patel (Data Analyst)
        (4, 0, "Intermediate"),# Python
        (4, 5, "Advanced"),    # SQL
        (4, 3, "Intermediate"),# Machine Learning
        
        # Sophia Chen (Backend Developer)
        (5, 0, "Advanced"),    # Python
        (5, 9, "Expert"),      # FastAPI
        (5, 5, "Advanced"),    # SQL
        (5, 2, "Intermediate"),# AWS
        
        # Vikram Reddy (Junior Developer)
        (6, 0, "Intermediate"),# Python
        (6, 1, "Intermediate"),# React
        (6, 6, "Intermediate"),# JavaScript
        
        # Aisha Khan (AI Researcher)
        (7, 0, "Advanced"),    # Python
        (7, 3, "Expert"),      # Machine Learning
        (7, 8, "Expert"),      # TensorFlow
        
        # Rohan Das (Cloud Architect)
        (8, 2, "Expert"),      # AWS
        (8, 4, "Advanced"),    # Docker
        (8, 7, "Advanced"),    # Kubernetes
        
        # Maya Gupta (Full Stack Developer)
        (9, 0, "Advanced"),    # Python
        (9, 1, "Advanced"),    # React
        (9, 9, "Advanced"),    # FastAPI
        (9, 5, "Advanced"),    # SQL
    ]
    
    for emp_idx, skill_idx, proficiency in assignments:
        assignment = EmployeeSkill(
            employee_id=employees[emp_idx].id,
            skill_id=skills[skill_idx].id,
            proficiency_level=proficiency_map.get(proficiency, 2)
        )
        db.add(assignment)
    
    db.commit()
    print("✅ Database seeded with 10 employees and 10 skills!")
    db.close()

if __name__ == "__main__":
    seed_database()
