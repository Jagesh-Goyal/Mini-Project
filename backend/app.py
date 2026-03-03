from fastapi import FastAPI
from database import engine
import model 
from model import Employee, Skill, EmployeeSkill

model.Base.metadata.create_all(bind=engine)

app = FastAPI()

@app.get("/")
def root():
    return {
    "status": "success",
    "server": "running",
    "database": "connected"
}


from pydantic import BaseModel
from sqlalchemy.orm import Session
from fastapi import Depends
from database import SessionLocal

#db dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        
#schema for employee data
class EmployeeCreate(BaseModel):
    name: str
    department: str
    role: str
    year_exp: int

#create employee api
@app.post("/employees")
def add_employee(employee: EmployeeCreate, db: Session = Depends(get_db)):
    new_emp = Employee(
        name=employee.name,
        department=employee.department,
        role=employee.role,
        year_exp=employee.year_exp #year of experience
    )
    db.add(new_emp)
    db.commit()
    db.refresh(new_emp)
    return new_emp

@app.get("/employees")
def get_all_employees(db: Session = Depends(get_db)):
    employees = db.query(Employee).all()
    return employees