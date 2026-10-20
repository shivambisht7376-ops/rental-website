"use client";
import { useState } from "react";

export default function Login() {
  const [err, setErr] = useState("");
  const reset = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("reset");
  async function submit(e) {
    e.preventDefault();
    const res = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(e.target))) });
    if (res.ok) window.location.href = "/admin";
    else setErr("Wrong email or password");
  }
  return (
    <div className="min-h-screen hero-bg grid place-items-center p-6">
      <form onSubmit={submit} className="bg-white rounded-3xl p-8 w-full max-w-sm space-y-4 shadow-2xl">
        <h1 className="text-xl font-bold">Owner Login</h1>
        {reset && <p className="text-green-700 text-sm">Password changed. Please log in.</p>}
        <input name="email" type="email" required placeholder="Email" className="form-field" />
        <input name="password" type="password" required placeholder="Password" className="form-field" />
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <button className="btn-primary w-full rounded-xl py-3">Log in</button>
        <a href="/admin/forgot" className="block text-center text-sm text-[#c41e5b]">Forgot password?</a>
      </form>
    </div>
  );
}
