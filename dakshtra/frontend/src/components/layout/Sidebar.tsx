import { Link } from "react-router-dom";

const links = [
  ["/dashboard", "Dashboard"],
  ["/employees", "Employees"],
  ["/skill-matrix", "Skill Matrix"],
  ["/skill-gap", "Skill Gap"],
  ["/forecast", "Forecast"],
  ["/resume", "Resume Parser"],
  ["/recommendations", "Recommendations"],
  ["/reports", "Reports"],
  ["/settings", "Settings"]
];

export default function Sidebar() {
  return (
    <aside className="min-h-screen w-64 bg-sidebar p-4 text-white">
      <p className="mb-6 text-2xl font-bold">Dakshtra</p>
      <nav className="space-y-2">
        {links.map(([to, label]) => (
          <Link key={to} className="block rounded-xl px-3 py-2 hover:bg-white/10" to={to}>
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
