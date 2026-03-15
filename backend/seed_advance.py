<<<<<<< HEAD
"""
Advanced Database Seeding Script
Seeds 150+ employees with imbalanced skill assignments (realistic distribution)
17 core skills across multiple categories
"""

from faker import Faker
import random
from sqlalchemy.orm import Session

from backend.database import SessionLocal, Base, engine
from backend.model import Employee, Skill, EmployeeSkill

fake = Faker("en_IN")  # Indian locale for realistic names

# Define 17 core skills
SKILLS = [
    ("Python", "Programming"),
    ("SQL", "Programming"),
    ("JavaScript", "Programming"),
    ("TypeScript", "Frontend"),
    ("React", "Frontend"),
    ("AWS", "Cloud"),
    ("Azure", "Cloud"),
    ("Docker", "DevOps"),
    ("Kubernetes", "DevOps"),
    ("Machine Learning", "AI/ML"),
    ("Artificial Intelligence", "AI/ML"),
    ("TensorFlow", "AI/ML"),
    ("Cybersecurity", "Security"),
    ("Cloud Security", "Security"),
    ("Power BI", "Analytics"),
    ("Tableau", "Analytics"),
    ("Data Analysis", "Analytics"),
]

DEPARTMENTS = [
    "Engineering",
    "Data Science",
    "DevOps",
    "Backend",
    "Frontend",
    "Security",
    "DevOps",
]

ROLES = [
    "Senior Engineer",
    "Engineer",
    "Junior Engineer",
    "Data Scientist",
    "ML Engineer",
    "DevOps Engineer",
    "Security Engineer",
    "Tech Lead",
    "Architect",
]


def seed_database():
    """Create all tables and seed with advanced data."""
    
    print("🔄 Creating database schema...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Clear existing data
        db.query(EmployeeSkill).delete()
        db.query(Employee).delete()
        db.query(Skill).delete()
        db.commit()
        print("✅ Cleared existing data")
        
        # Seed Skills
        print("📚 Seeding 17 skills...")
        skills_map = {}
        for skill_name, category in SKILLS:
            skill = Skill(skill_name=skill_name, category=category)
            db.add(skill)
            db.flush()
            skills_map[skill_name] = skill.id
        db.commit()
        print(f"✅ Added {len(SKILLS)} skills")
        
        # Seed 150 Employees
        print("👥 Seeding 150 employees...")
        employees = []
        for i in range(150):
            emp = Employee(
                name=fake.name(),
                department=random.choice(DEPARTMENTS),
                role=random.choice(ROLES),
                year_exp=random.randint(0, 15),
            )
            db.add(emp)
            employees.append(emp)
        db.commit()
        print(f"✅ Added {len(employees)} employees")
        
        # Assign Skills with realistic/imbalanced distribution
        print("🔗 Assigning skills to employees (imbalanced distribution)...")
        
        # Define skill popularity (realistic distribution)
        skill_popularity = {
            "Python": 0.85,           # 85% of workforce
            "SQL": 0.75,              # 75%
            "React": 0.45,            # 45%
            "AWS": 0.50,              # 50%
            "Docker": 0.40,           # 40%
            "JavaScript": 0.35,
            "Machine Learning": 0.25,
            "Kubernetes": 0.20,
            "TypeScript": 0.30,
            "Data Analysis": 0.30,
            "Cloud Security": 0.15,
            "Azure": 0.20,
            "Cybersecurity": 0.10,    # Rare skill
            "TensorFlow": 0.12,
            "Tableau": 0.15,
            "Power BI": 0.18,
            "Artificial Intelligence": 0.10,
        }
        
        assignments = 0
        for emp in employees:
            # Each employee gets 1-5 skills (realistic)
            num_skills = random.choices([1, 2, 3, 4, 5], weights=[15, 25, 30, 20, 10])[0]
            
            # Pick skills based on popularity
            selected_skills = random.sample(SKILLS, min(num_skills, len(SKILLS)))
            
            for skill_name, category in selected_skills:
                # Only assign if passes probability check
                if random.random() < skill_popularity.get(skill_name, 0.5):
                    proficiency = random.randint(1, 5)  # 1-5 scale
                    
                    emp_skill = EmployeeSkill(
                        employee_id=emp.id,
                        skill_id=skills_map[skill_name],
                        proficiency_level=proficiency,
                    )
                    db.add(emp_skill)
                    assignments += 1
        
        db.commit()
        print(f"✅ Added {assignments} skill assignments")
        
        # Print statistics
        print("\n📊 Seeding Summary:")
        print(f"   - Employees: {len(employees)}")
        print(f"   - Skills: {len(SKILLS)}")
        print(f"   - Skill Assignments: {assignments}")
        print(f"   - Avg skills per employee: {assignments / len(employees):.2f}")
        
        # Print skill distribution
        print("\n📈 Skill Distribution (Top 5):")
        for skill_name, count in sorted(
            [(s[0], len([a for a in db.query(EmployeeSkill).all() 
                        if db.query(Skill).filter_by(id=a.skill_id).first().skill_name == s[0]])) 
             for s in SKILLS], 
            key=lambda x: x[1], 
            reverse=True
        )[:5]:
            percentage = (count / len(employees)) * 100
            print(f"   - {skill_name}: {count} employees ({percentage:.1f}%)")
        
        print("\n✨ Database seeding complete!")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error during seeding: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
=======
"""
Advanced Database Seeding Script
Seeds 150+ employees with imbalanced skill assignments (realistic distribution)
17 core skills across multiple categories
"""

from faker import Faker
import random
from sqlalchemy.orm import Session

from backend.database import SessionLocal, Base, engine
from backend.model import Employee, Skill, EmployeeSkill

fake = Faker("en_IN")  # Indian locale for realistic names

# Define 17 core skills
SKILLS = [
    ("Python", "Programming"),
    ("SQL", "Programming"),
    ("JavaScript", "Programming"),
    ("TypeScript", "Frontend"),
    ("React", "Frontend"),
    ("AWS", "Cloud"),
    ("Azure", "Cloud"),
    ("Docker", "DevOps"),
    ("Kubernetes", "DevOps"),
    ("Machine Learning", "AI/ML"),
    ("Artificial Intelligence", "AI/ML"),
    ("TensorFlow", "AI/ML"),
    ("Cybersecurity", "Security"),
    ("Cloud Security", "Security"),
    ("Power BI", "Analytics"),
    ("Tableau", "Analytics"),
    ("Data Analysis", "Analytics"),
]

DEPARTMENTS = [
    "Engineering",
    "Data Science",
    "DevOps",
    "Backend",
    "Frontend",
    "Security",
    "DevOps",
]

ROLES = [
    "Senior Engineer",
    "Engineer",
    "Junior Engineer",
    "Data Scientist",
    "ML Engineer",
    "DevOps Engineer",
    "Security Engineer",
    "Tech Lead",
    "Architect",
]


def seed_database():
    """Create all tables and seed with advanced data."""
    
    print("🔄 Creating database schema...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Clear existing data
        db.query(EmployeeSkill).delete()
        db.query(Employee).delete()
        db.query(Skill).delete()
        db.commit()
        print("✅ Cleared existing data")
        
        # Seed Skills
        print("📚 Seeding 17 skills...")
        skills_map = {}
        for skill_name, category in SKILLS:
            skill = Skill(skill_name=skill_name, category=category)
            db.add(skill)
            db.flush()
            skills_map[skill_name] = skill.id
        db.commit()
        print(f"✅ Added {len(SKILLS)} skills")
        
        # Seed 150 Employees
        print("👥 Seeding 150 employees...")
        employees = []
        for i in range(150):
            emp = Employee(
                name=fake.name(),
                department=random.choice(DEPARTMENTS),
                role=random.choice(ROLES),
                year_exp=random.randint(0, 15),
            )
            db.add(emp)
            employees.append(emp)
        db.commit()
        print(f"✅ Added {len(employees)} employees")
        
        # Assign Skills with realistic/imbalanced distribution
        print("🔗 Assigning skills to employees (imbalanced distribution)...")
        
        # Define skill popularity (realistic distribution)
        skill_popularity = {
            "Python": 0.85,           # 85% of workforce
            "SQL": 0.75,              # 75%
            "React": 0.45,            # 45%
            "AWS": 0.50,              # 50%
            "Docker": 0.40,           # 40%
            "JavaScript": 0.35,
            "Machine Learning": 0.25,
            "Kubernetes": 0.20,
            "TypeScript": 0.30,
            "Data Analysis": 0.30,
            "Cloud Security": 0.15,
            "Azure": 0.20,
            "Cybersecurity": 0.10,    # Rare skill
            "TensorFlow": 0.12,
            "Tableau": 0.15,
            "Power BI": 0.18,
            "Artificial Intelligence": 0.10,
        }
        
        assignments = 0
        for emp in employees:
            # Each employee gets 1-5 skills (realistic)
            num_skills = random.choices([1, 2, 3, 4, 5], weights=[15, 25, 30, 20, 10])[0]
            
            # Pick skills based on popularity
            selected_skills = random.sample(SKILLS, min(num_skills, len(SKILLS)))
            
            for skill_name, category in selected_skills:
                # Only assign if passes probability check
                if random.random() < skill_popularity.get(skill_name, 0.5):
                    proficiency = random.randint(1, 5)  # 1-5 scale
                    
                    emp_skill = EmployeeSkill(
                        employee_id=emp.id,
                        skill_id=skills_map[skill_name],
                        proficiency_level=proficiency,
                    )
                    db.add(emp_skill)
                    assignments += 1
        
        db.commit()
        print(f"✅ Added {assignments} skill assignments")
        
        # Print statistics
        print("\n📊 Seeding Summary:")
        print(f"   - Employees: {len(employees)}")
        print(f"   - Skills: {len(SKILLS)}")
        print(f"   - Skill Assignments: {assignments}")
        print(f"   - Avg skills per employee: {assignments / len(employees):.2f}")
        
        # Print skill distribution
        print("\n📈 Skill Distribution (Top 5):")
        for skill_name, count in sorted(
            [(s[0], len([a for a in db.query(EmployeeSkill).all() 
                        if db.query(Skill).filter_by(id=a.skill_id).first().skill_name == s[0]])) 
             for s in SKILLS], 
            key=lambda x: x[1], 
            reverse=True
        )[:5]:
            percentage = (count / len(employees)) * 100
            print(f"   - {skill_name}: {count} employees ({percentage:.1f}%)")
        
        print("\n✨ Database seeding complete!")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error during seeding: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
>>>>>>> 74efafe (add backend)
