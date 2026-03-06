import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AppLayout from '@/components/layout/AppLayout';
import Dashboard from '@/pages/Dashboard';
import Employees from '@/pages/Employees';
import Skills from '@/pages/Skills';
import SkillGap from '@/pages/SkillGap';
import Recommendations from '@/pages/Recommendations';
import Forecast from '@/pages/Forecast';

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(15, 15, 25, 0.95)',
            color: '#f8fafc',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            backdropFilter: 'blur(24px)',
            fontSize: '14px',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#0a0a0f' },
          },
          error: {
            iconTheme: { primary: '#f43f5e', secondary: '#0a0a0f' },
          },
        }}
      />
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/skills" element={<Skills />} />
          <Route path="/gap" element={<SkillGap />} />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/forecast" element={<Forecast />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
