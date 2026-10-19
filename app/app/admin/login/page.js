"use client";
import { useState } from "react";

export default function Login() {
  const [err, setErr] = useState("");
  async function submit(e) {
    e.preventDefault();
    const res = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(e.target))) });
    if (res.ok) window.location.href = "/admin";
    else setErr("Invalid email or password");
  }
  return (
    <div className="min-h-screen hero-bg grid place-items-center p-6">
      <form onSubmit={submit} className="bg-white rounded-3xl p-8 w-full max-w-sm space-y-4 shadow-2xl">
        <h1 className="text-xl font-bold">Admin Login</h1>
        <input name="email" type="email" required placeholder="Email" className="form-field" />
        <input name="password" type="password" required placeholder="Password" className="form-field" />
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <button className="btn-primary w-full rounded-xl py-3">Sign in</button>
      </form>
    </div>
  );
}
