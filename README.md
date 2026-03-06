<<<<<<< HEAD
# Mini-Project

Employees
     ↓
Skills
     ↓
Employee-Skill Mapping
     ↓
Skill Distribution
     ↓
Skill Gap Analysis
     ↓
Recommendation Engine
     ↓
ML Forecast
=======
# 🚀 Dakshtra AI Workforce Platform

> An intelligent workforce skill management and demand forecasting system powered by Machine Learning

## 📋 Overview

Dakshtra is a comprehensive AI-powered platform for managing employee skills, identifying skill gaps, and predicting future skill demands using advanced machine learning algorithms. The platform helps organizations make data-driven decisions about workforce training and hiring needs.

## ✨ Key Features

### 📊 Analytics & Visualization
- **Real-time Dashboard** with key metrics (employees, skills, coverage, critical gaps)
- **Skill Distribution Analysis** - Visual breakdown of skills across the workforce
- **Proficiency Level Distribution** - Track skill maturity levels (Beginner to Expert)
- **Experience Distribution** - Employee categorization by years of experience
- **Skill Category Breakdown** - Analysis by skill categories (Programming, Cloud, AI, etc.)
- **Department-wise Analytics** - Skill distribution across different departments

### 🤖 Machine Learning Models
- **Demand Forecasting Model** - Random Forest Regressor for multi-month skill demand prediction
- **Turnover Prediction Model** - Gradient Boosting Classifier for employee attrition risk
- **Real-time Dataset Generation** - Synthetic historical data generation for training
- **Feature Importance Analysis** - Understand what drives skill demand

### 📈 Forecasting Capabilities
- **Multi-month Predictions** - Forecast skill demand for 3, 6, or 12 months ahead
- **Department-specific Forecasting** - Tailored predictions per department
- **Supply vs Demand Analysis** - Visualize skill gaps over time
- **Simple & Advanced Modes** - Choose between linear regression or ML-powered forecasts

### 🎯 Skill Gap Analysis
- **Current vs Required** skill analysis
- **Gap Identification** - Detect critical skill shortages
- **Actionable Recommendations** - AI-driven hiring/training suggestions
- **Proficiency Tracking** - Monitor skill levels (1-5 scale)

### 👥 Employee Management
- **Employee Registration** - Add employees with department, role, experience
- **Skill Assignment** - Map skills to employees with proficiency levels
- **Employee Skill Profiles** - View individual skill portfolios
- **Bulk Data Seeding** - Quick setup with 150+ sample employees

## 🛠️ Tech Stack

### Backend
- **Framework:** FastAPI (Python 3.10+)
- **Database:** SQLAlchemy ORM with SQLite
- **ML Libraries:** 
  - scikit-learn (Random Forest, Gradient Boosting)
  - NumPy, Pandas
  - joblib (Model persistence)
- **Data Generation:** Faker (Indian names and data)
- **Server:** Uvicorn (ASGI)

### Frontend
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **UI Libraries:**
  - TailwindCSS (Styling)
  - Framer Motion (Animations)
  - Recharts (Data Visualization)
  - Lucide React (Icons)
- **State Management:** Zustand
- **HTTP Client:** Axios
- **Notifications:** React Hot Toast

## 📁 Project Structure

```
Mini-Project/
├── backend/
│   ├── __init__.py
│   ├── app.py                    # FastAPI application entry point
│   ├── all_api.py                # All API endpoints
│   ├── database.py               # Database configuration
│   ├── model.py                  # SQLAlchemy models
│   ├── schemas.py                # Pydantic schemas
│   ├── ml_model.py               # ML models & forecasting logic
│   ├── seed.py                   # Basic data seeding
│   └── seed_advance.py           # Advanced data seeding (150 employees)
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/           # Layout components
│   │   │   └── ui/               # Reusable UI components
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx     # Main dashboard with analytics
│   │   │   ├── Employees.tsx     # Employee management
│   │   │   ├── Skills.tsx        # Skill management
│   │   │   ├── Forecast.tsx      # ML-powered forecasting
│   │   │   ├── SkillGap.tsx      # Gap analysis
│   │   │   └── Recommendations.tsx # AI recommendations
│   │   ├── lib/
│   │   │   ├── api.ts            # API client functions
│   │   │   └── utils.ts          # Utility functions
│   │   ├── store/
│   │   │   └── useStore.ts       # Zustand state management
│   │   ├── types/
│   │   │   └── index.ts          # TypeScript type definitions
│   │   ├── App.tsx               # Root component
│   │   └── main.tsx              # Application entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
│
├── requirements.txt              # Python dependencies
├── .gitignore
└── README.md
```

## 🚀 Installation & Setup

### Prerequisites
- Python 3.10 or higher
- Node.js 18 or higher
- npm or yarn

### Backend Setup

1. **Navigate to project directory:**
   ```bash
   cd Mini-Project
   ```

2. **Create and activate virtual environment:**
   ```bash
   # Create virtual environment
   python -m venv env

   # Activate (Windows)
   .\env\Scripts\Activate.ps1

   # Activate (Linux/Mac)
   source env/bin/activate
   ```

3. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Seed database with sample data:**
   ```bash
   # Advanced seeding (150 employees, 17 skills, imbalanced assignments)
   python -m backend.seed_advance

   # OR basic seeding (fewer records)
   python -m backend.seed
   ```

5. **Start the backend server:**
   ```bash
   # From project root
   uvicorn backend.app:app --reload --port 8000
   ```
   Backend will run at: `http://127.0.0.1:8000`

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install Node dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   ```
   Frontend will run at: `http://localhost:5173`

## 📡 API Endpoints

### Employee Management
- `POST /employees` - Add new employee
- `GET /employees` - Get all employees
- `GET /employee-skills/{employee_id}` - Get employee skill profile

### Skill Management
- `POST /skills` - Add new skill
- `GET /skills` - Get all skills
- `POST /assign-skill` - Assign skill to employee with proficiency level

### Analytics
- `GET /skill-distribution` - Get skill distribution across workforce
- `GET /analytics/department-skills` - Department-wise skill breakdown
- `GET /analytics/proficiency-distribution` - Proficiency level distribution
- `GET /analytics/skill-categories` - Category-wise skill data
- `GET /analytics/experience-distribution` - Experience level distribution

### Skill Gap Analysis
- `POST /skill-gap` - Calculate skill gap (required vs current)
- `GET /recommendation/{skill_name}` - Get AI recommendations

### Machine Learning
- `POST /ml/train` - Train ML models with real-time generated data
- `GET /ml/forecast/{skill_name}` - Multi-month demand forecast
  - Query params: `department`, `months_ahead` (3/6/12)
- `GET /ml/feature-importance` - Get ML model feature importance

### Legacy Forecast
- `GET /forecast/{skill_name}` - Simple linear regression forecast

## 🎯 Usage Guide

### 1. Initial Setup
1. Start both backend and frontend servers
2. Access the app at `http://localhost:5173`
3. The database will be pre-populated with 150 employees and 17 skills

### 2. Train ML Models
1. Go to **Dashboard**
2. Click **"Train Models"** button in the ML Training section
3. Wait for training to complete (~5-10 seconds)
4. View model metrics:
   - Demand Model R² Score
   - Turnover Prediction Accuracy
   - Training Records Count

### 3. Add Employees & Skills
1. Navigate to **Employees** page
2. Fill in employee details (name, department, role, experience)
3. Navigate to **Skills** page to add new skills
4. Assign skills to employees with proficiency levels (1-5)

### 4. Analyze Skill Gaps
1. Go to **Skill Gap** page
2. Select a skill
3. Enter required employee count
4. View current count, gap, and actionable recommendations

### 5. Forecast Future Demand
1. Navigate to **Forecast** page
2. Choose between:
   - **ML Forecast (Advanced)** - Random Forest predictions
   - **Simple Forecast** - Linear regression
3. Enter skill name and select department
4. Choose forecast period (3/6/12 months)
5. Click **"Generate Forecast"**
6. Analyze demand, supply, and gap trends

### 6. View Analytics
- **Dashboard** - Overview metrics and charts
- **Employees** - Employee list with filtering
- **Skills** - Skill inventory
- **Recommendations** - AI-driven hiring/training suggestions

## 🤖 Machine Learning Details

### Demand Forecasting Model
- **Algorithm:** Random Forest Regressor
- **Features:** 
  - Month, Quarter, Year
  - Skill (encoded)
  - Department (encoded)
  - Current Supply
  - Trend Score
- **Training Data:** 24 months of synthetic historical data
- **Output:** Predicted skill demand for future months

### Turnover Prediction Model
- **Algorithm:** Gradient Boosting Classifier
- **Features:**
  - Years of experience
  - Skill count
  - Average proficiency
  - Department
- **Output:** Binary turnover risk (0 = Low, 1 = High)

### Data Generation Strategy
- **Trending Skills:** AI, ML, Kubernetes, Cloud (50% growth simulation)
- **Seasonal Patterns:** Higher hiring in Q1 and Q3
- **Department Correlations:** Skill-department affinity modeling
- **Realistic Noise:** Gaussian noise for natural variation

## 📊 Sample Skills Included

### Programming
- Python, SQL

### Cloud
- AWS, Azure

### DevOps
- Docker, Kubernetes

### AI/ML
- Machine Learning, Artificial Intelligence, Prompt Engineering

### Security
- Cybersecurity, Cloud Security

### Analytics
- Power BI, Tableau, Data Analysis

### Frontend
- React

### Soft Skills
- Leadership, Communication

## 🎨 UI Features

- **Dark Mode Design** - Modern glassmorphism UI
- **Smooth Animations** - Framer Motion transitions
- **Responsive Layout** - Works on desktop, tablet, mobile
- **Interactive Charts** - Bar, Pie, Line, Area charts
- **Real-time Updates** - Instant data refresh
- **Loading States** - Skeleton screens and spinners
- **Toast Notifications** - User feedback for actions

## 🔮 Future Enhancements

- [ ] User authentication and role-based access
- [ ] CSV/Excel data import/export
- [ ] Advanced filtering and search
- [ ] Email notifications for critical gaps
- [ ] Integration with HR systems
- [ ] Deep learning models (LSTM for time series)
- [ ] Multi-tenant support
- [ ] Performance optimization for large datasets
- [ ] Real-time collaboration features
- [ ] Mobile app (React Native)

## 🐛 Troubleshooting

### Backend Issues
- **Port already in use:** Change port in uvicorn command
  ```bash
  uvicorn backend.app:app --reload --port 8001
  ```
- **Module not found:** Ensure virtual environment is activated
- **Database errors:** Delete `*.db` files and re-run seeding

### Frontend Issues
- **API connection failed:** Verify backend is running on port 8000
- **Dependency errors:** Delete `node_modules` and run `npm install` again
- **Build errors:** Clear cache: `npm run build --force`

### ML Model Issues
- **"Please train model first" error:** Click "Train Models" on Dashboard
- **Low accuracy:** Generate more training data in `ml_model.py`
- **Missing models:** Check `backend/models/` directory exists

## 📄 License

This project is created for educational and demonstration purposes.

## 👨‍💻 Developer

Built with ❤️ using FastAPI, React, and Machine Learning

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📞 Support

For questions or support, please create an issue in the repository.

---

**Made in 2026** | Powered by AI & ML 🚀
>>>>>>> 5afef37 (initial comit)
