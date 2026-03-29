import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { registerApi } from "../api/authApi";
import Button from "../components/ui/Button";

export default function Signup() {
  const nav = useNavigate();
  const [form, setForm] = useState({ full_name: "", email: "", password: "", confirm: "", role: "EMPLOYEE" });
  const [error, setError] = useState("");

  const strength = form.password.length > 10 ? "strong" : form.password.length > 7 ? "medium" : "weak";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) return setError("Passwords must match");
    try {
      await registerApi({ full_name: form.full_name, email: form.email, password: form.password, role: form.role }, "dev-csrf-token");
      nav("/login");
    } catch {
      setError("Signup failed");
    }
  };

  return (
    <div className="mx-auto max-w-xl p-6">
      <form onSubmit={submit} className="card space-y-3">
        <h2 className="text-2xl font-bold">Create Account</h2>
        <input className="input" placeholder="Full name" onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        <input className="input" placeholder="Email" onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="input" placeholder="Password" type="password" onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <input className="input" placeholder="Confirm password" type="password" onChange={(e) => setForm({ ...form, confirm: e.target.value })} />
        <select className="input" onChange={(e) => setForm({ ...form, role: e.target.value })}>
          <option>EMPLOYEE</option>
          <option>TEAM_LEAD</option>
          <option>HR_MANAGER</option>
          <option>ADMIN</option>
        </select>
        <p className="text-sm">Password strength: <span className="font-semibold">{strength}</span></p>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <Button type="submit">Create Account</Button>
        <Link to="/login" className="text-primary">Back to login</Link>
      </form>
    </div>
  );
}
