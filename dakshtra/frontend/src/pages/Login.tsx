import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { loginApi } from "../api/authApi";
import Button from "../components/ui/Button";
import { useAuth } from "../hooks/useAuth";

export default function Login() {
  const nav = useNavigate();
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@") || password.length < 8) {
      setError("Invalid email/password");
      return;
    }

    try {
      const res = await loginApi({ email, password }, "dev-csrf-token");
      auth.login(res.data.role, res.data.csrf_token);
      nav("/dashboard");
    } catch {
      setError("Login failed");
    }
  };

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">
      <div className="hidden bg-gradient-to-br from-primary to-secondary p-12 text-white md:block">
        <h1 className="text-4xl font-extrabold">Dakshtra</h1>
        <p className="mt-3 max-w-md">AI-Based Workforce Planning and Skill Gap Intelligence Platform.</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <form className="w-full max-w-md space-y-4 card" onSubmit={submit}>
          <h2 className="text-2xl font-bold">Login</h2>
          <input className="input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="input" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button type="submit">Sign In</Button>
        </form>
      </div>
    </div>
  );
}
