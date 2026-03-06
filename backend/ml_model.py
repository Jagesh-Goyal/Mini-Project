"""
ML Model for Skill Gap Analysis and Demand Forecasting
Real-time dataset generation and model training
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_squared_error, r2_score, accuracy_score, classification_report
import joblib
from datetime import datetime, timedelta
import random
from typing import Dict, List, Tuple
from sqlalchemy.orm import Session
from backend.model import Employee, Skill, EmployeeSkill
import os


class SkillDemandForecaster:
    """
    Real-time ML model for skill demand forecasting and gap analysis
    """
    
    def __init__(self):
        self.demand_model = None
        self.turnover_model = None
        self.skill_encoder = LabelEncoder()
        self.dept_encoder = LabelEncoder()
        self.model_dir = "backend/models"
        os.makedirs(self.model_dir, exist_ok=True)
        
    def generate_historical_data(self, db: Session, months: int = 24) -> pd.DataFrame:
        """
        Generate synthetic historical data for training based on current DB state
        Simulates past 24 months of skill demand and hiring patterns
        """
        
        # Get all skills and departments from DB
        skills = db.query(Skill).all()
        employees = db.query(Employee).all()
        
        skill_names = [s.skill_name for s in skills]
        departments = list(set([e.department for e in employees]))
        
        # Generate historical records
        records = []
        base_date = datetime.now() - timedelta(days=30*months)
        
        for i in range(months):
            month_date = base_date + timedelta(days=30*i)
            quarter = (month_date.month - 1) // 3 + 1
            
            for skill_name in skill_names:
                for dept in departments:
                    # Simulate realistic patterns
                    # Trending skills (AI, Cloud) have increasing demand
                    trend_multiplier = 1.0
                    if skill_name in ["Machine Learning", "Artificial Intelligence", "Kubernetes", "Prompt Engineering"]:
                        trend_multiplier = 1.0 + (i / months) * 0.5  # 50% growth over period
                    elif skill_name in ["AWS", "Azure", "Docker", "Cloud Security"]:
                        trend_multiplier = 1.0 + (i / months) * 0.3  # 30% growth
                    
                    # Seasonal patterns (more hiring in Q1 and Q3)
                    seasonal_factor = 1.0
                    if quarter in [1, 3]:
                        seasonal_factor = 1.2
                    
                    # Department-specific patterns
                    dept_factor = 1.0
                    if dept == "Engineering" and skill_name in ["Python", "Docker", "Kubernetes"]:
                        dept_factor = 1.5
                    elif dept == "Data Science" and skill_name in ["Machine Learning", "Python", "SQL"]:
                        dept_factor = 1.5
                    elif dept == "Security" and skill_name in ["Cybersecurity", "Cloud Security"]:
                        dept_factor = 1.5
                    
                    # Calculate demand with noise
                    base_demand = random.randint(3, 15)
                    demand = int(base_demand * trend_multiplier * seasonal_factor * dept_factor + random.gauss(0, 2))
                    demand = max(1, demand)  # At least 1
                    
                    # Current supply (with some correlation to past demand)
                    supply = int(demand * random.uniform(0.6, 1.2))
                    
                    # Gap
                    gap = demand - supply
                    
                    # Hiring/training action taken (binary)
                    action_taken = 1 if gap > 2 else 0
                    
                    # Turnover rate (attrition simulation)
                    turnover = random.uniform(0.05, 0.15)  # 5-15% annual turnover
                    
                    records.append({
                        'month': month_date.month,
                        'quarter': quarter,
                        'year': month_date.year,
                        'skill_name': skill_name,
                        'department': dept,
                        'demand': demand,
                        'supply': supply,
                        'gap': gap,
                        'action_taken': action_taken,
                        'turnover_rate': turnover,
                        'trend_score': i / months  # 0 to 1 indicating progress through time
                    })
        
        return pd.DataFrame(records)
    
    def generate_employee_features(self, db: Session) -> pd.DataFrame:
        """
        Generate features from current employee data for turnover prediction
        """
        employees = db.query(Employee).all()
        
        records = []
        for emp in employees:
            # Get employee skills
            emp_skills = db.query(EmployeeSkill).filter(EmployeeSkill.employee_id == emp.id).all()
            
            avg_proficiency = np.mean([es.proficiency_level for es in emp_skills]) if emp_skills else 0
            skill_count = len(emp_skills)
            
            # Simulate turnover risk (higher for low experience + low skills)
            turnover_risk = 0
            if emp.year_exp < 2:
                turnover_risk = 1  # High risk
            elif emp.year_exp < 5 and skill_count < 4:
                turnover_risk = 1
            elif emp.year_exp > 10:
                turnover_risk = 0  # Low risk (stable seniors)
            else:
                turnover_risk = random.choice([0, 1])  # Medium risk
            
            records.append({
                'employee_id': emp.id,
                'department': emp.department,
                'year_exp': emp.year_exp,
                'skill_count': skill_count,
                'avg_proficiency': avg_proficiency,
                'turnover_risk': turnover_risk
            })
        
        return pd.DataFrame(records)
    
    def train_demand_forecasting_model(self, historical_data: pd.DataFrame) -> Dict:
        """
        Train Random Forest model to predict skill demand
        """
        # Encode categorical features
        data = historical_data.copy()
        data['skill_encoded'] = self.skill_encoder.fit_transform(data['skill_name'])
        data['dept_encoded'] = self.dept_encoder.fit_transform(data['department'])
        
        # Features for demand prediction
        features = ['month', 'quarter', 'year', 'skill_encoded', 'dept_encoded', 'supply', 'trend_score']
        X = data[features]
        y = data['demand']
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Train model
        self.demand_model = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            random_state=42,
            n_jobs=-1
        )
        self.demand_model.fit(X_train, y_train)
        
        # Evaluate
        y_pred = self.demand_model.predict(X_test)
        mse = mean_squared_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        # Save model
        joblib.dump(self.demand_model, f"{self.model_dir}/demand_model.pkl")
        joblib.dump(self.skill_encoder, f"{self.model_dir}/skill_encoder.pkl")
        joblib.dump(self.dept_encoder, f"{self.model_dir}/dept_encoder.pkl")
        
        return {
            'mse': float(mse),
            'r2_score': float(r2),
            'rmse': float(np.sqrt(mse)),
            'training_samples': len(X_train),
            'test_samples': len(X_test)
        }
    
    def train_turnover_prediction_model(self, employee_data: pd.DataFrame) -> Dict:
        """
        Train Gradient Boosting model to predict employee turnover risk
        """
        data = employee_data.copy()
        data['dept_encoded'] = self.dept_encoder.transform(data['department'])
        
        features = ['year_exp', 'skill_count', 'avg_proficiency', 'dept_encoded']
        X = data[features]
        y = data['turnover_risk']
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Train model
        self.turnover_model = GradientBoostingClassifier(
            n_estimators=100,
            max_depth=5,
            random_state=42
        )
        self.turnover_model.fit(X_train, y_train)
        
        # Evaluate
        y_pred = self.turnover_model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        
        # Save model
        joblib.dump(self.turnover_model, f"{self.model_dir}/turnover_model.pkl")
        
        return {
            'accuracy': float(accuracy),
            'training_samples': len(X_train),
            'test_samples': len(X_test)
        }
    
    def predict_skill_demand(self, skill_name: str, department: str, months_ahead: int = 3) -> List[Dict]:
        """
        Predict skill demand for next N months
        """
        if not self.demand_model:
            self.load_models()
        
        current_date = datetime.now()
        predictions = []
        
        for i in range(1, months_ahead + 1):
            future_date = current_date + timedelta(days=30*i)
            
            skill_encoded = self.skill_encoder.transform([skill_name])[0]
            dept_encoded = self.dept_encoder.transform([department])[0]
            
            # Estimate current supply (could be from DB)
            supply = random.randint(5, 20)
            trend_score = 0.5 + (i / 12)  # Assume mid-trend
            
            features = [[
                future_date.month,
                (future_date.month - 1) // 3 + 1,
                future_date.year,
                skill_encoded,
                dept_encoded,
                supply,
                trend_score
            ]]
            
            demand = int(self.demand_model.predict(features)[0])
            
            predictions.append({
                'month': future_date.strftime('%Y-%m'),
                'predicted_demand': max(1, demand),
                'estimated_supply': supply,
                'predicted_gap': max(1, demand) - supply
            })
        
        return predictions
    
    def load_models(self):
        """Load saved models"""
        try:
            self.demand_model = joblib.load(f"{self.model_dir}/demand_model.pkl")
            self.skill_encoder = joblib.load(f"{self.model_dir}/skill_encoder.pkl")
            self.dept_encoder = joblib.load(f"{self.model_dir}/dept_encoder.pkl")
            self.turnover_model = joblib.load(f"{self.model_dir}/turnover_model.pkl")
        except FileNotFoundError:
            print("Models not found. Please train models first.")
    
    def get_feature_importance(self) -> Dict:
        """Get feature importance from demand model"""
        if not self.demand_model:
            self.load_models()
        
        feature_names = ['month', 'quarter', 'year', 'skill', 'department', 'supply', 'trend_score']
        importances = self.demand_model.feature_importances_
        
        return {
            name: float(imp) 
            for name, imp in sorted(zip(feature_names, importances), key=lambda x: x[1], reverse=True)
        }


# Singleton instance
forecaster = SkillDemandForecaster()
