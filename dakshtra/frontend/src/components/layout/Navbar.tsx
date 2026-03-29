import { Bell } from "lucide-react";

export default function Navbar() {
  return (
    <header className="mb-4 flex items-center justify-between rounded-2xl bg-white p-4 shadow-md">
      <h1 className="text-xl font-bold">Dakshtra</h1>
      <button className="rounded-full bg-slate-100 p-2">
        <Bell size={16} />
      </button>
    </header>
  );
}
