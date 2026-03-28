import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AppLayout from '@/components/layout/AppLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import Dashboard from '@/pages/Dashboard';
import Employees from '@/pages/Employees';
import Skills from '@/pages/Skills';
import SkillHeatmap from '@/pages/SkillHeatmap';
import SkillGap from '@/pages/SkillGap';
import Forecast from '@/pages/Forecast';
import WorkforceRisk from '@/pages/WorkforceRisk';
import ResumeParser from '@/pages/ResumeParser';
import Recommendations from '@/pages/Recommendations';
import JDParser from '@/pages/JDParser';
import Reports from '@/pages/Reports';
import Advisor from '@/pages/Advisor';
import ModelPerformance from '@/pages/ModelPerformance';

function App() {
  return (
    <BrowserRouter>
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: 'rgba(9, 27, 39, 0.92)',
                  color: '#e9f7ff',
                  border: '1px solid rgba(147, 191, 220, 0.28)',
                  borderRadius: '12px',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 16px 34px rgba(0,0,0,0.35)',
                },
              }}
            />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/skills" element={<Skills />} />
          <Route path="/heatmap" element={<SkillHeatmap />} />
          <Route path="/gap" element={<SkillGap />} />
          <Route path="/forecast" element={<Forecast />} />
          <Route path="/risk" element={<WorkforceRisk />} />
          <Route path="/resume-parser" element={<ResumeParser />} />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/jd-parser" element={<JDParser />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/advisor" element={<Advisor />} />
          <Route path="/model-performance" element={<ModelPerformance />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
