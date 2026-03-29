import { Navigate, Route, Routes } from "react-router-dom";

import Navbar from "./components/layout/Navbar";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import Sidebar from "./components/layout/Sidebar";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import ForecastDemand from "./pages/ForecastDemand";
import Login from "./pages/Login";
import Recommendations from "./pages/Recommendations";
import Reports from "./pages/Reports";
import ResumeParser from "./pages/ResumeParser";
import Settings from "./pages/Settings";
import Signup from "./pages/Signup";
import SkillGapAnalysis from "./pages/SkillGapAnalysis";
import SkillMatrix from "./pages/SkillMatrix";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <Sidebar />
      <main className="min-h-screen flex-1 p-4">
        <Navbar />
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route path="/dashboard" element={<ProtectedRoute><Shell><Dashboard /></Shell></ProtectedRoute>} />
      <Route path="/employees" element={<ProtectedRoute><Shell><Employees /></Shell></ProtectedRoute>} />
      <Route path="/skill-matrix" element={<ProtectedRoute><Shell><SkillMatrix /></Shell></ProtectedRoute>} />
      <Route path="/skill-gap" element={<ProtectedRoute><Shell><SkillGapAnalysis /></Shell></ProtectedRoute>} />
      <Route path="/forecast" element={<ProtectedRoute><Shell><ForecastDemand /></Shell></ProtectedRoute>} />
      <Route path="/resume" element={<ProtectedRoute><Shell><ResumeParser /></Shell></ProtectedRoute>} />
      <Route path="/recommendations" element={<ProtectedRoute><Shell><Recommendations /></Shell></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><Shell><Reports /></Shell></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Shell><Settings /></Shell></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
