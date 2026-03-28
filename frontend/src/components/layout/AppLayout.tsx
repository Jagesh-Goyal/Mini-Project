import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export default function AppLayout() {
  return (
    <div className="relative flex min-h-screen overflow-hidden bg-slate-950">
      <Sidebar />
      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-900/10 via-transparent to-transparent" />
        <div className="pointer-events-none absolute -top-32 right-0 h-72 w-72 rounded-full bg-blue-500/8 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-8 h-56 w-56 rounded-full bg-cyan-500/6 blur-3xl" />
        <Navbar />
        <main className="relative flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="mx-auto w-full max-w-[90rem]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
