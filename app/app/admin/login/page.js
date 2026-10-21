"use client";
import { useEffect, useState } from "react";
import { GoogleButton, ERRORS } from "@/components/auth-ui";

export default function Login() {
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("reset")) setNote("Password changed. Please log in.");
    if (q.get("error")) setErr(ERRORS[q.get("error")] || "Login failed");
  }, []);
  async function submit(e) {
    e.preventDefault();
    const res = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(e.target))) });
    if (res.ok) window.location.href = "/admin";
    else setErr("Wrong email or password");
  }
  return (
    <div className="min-h-screen hero-bg grid place-items-center p-6">
      <div className="bg-white rounded-3xl p-8 w-full max-w-sm space-y-4 shadow-2xl">
        <h1 className="text-xl font-bold">Owner Login</h1>
        {note && <p className="text-green-700 text-sm">{note}</p>}
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <GoogleButton role="admin" label="Owner login with Google" />
        <p className="text-center text-xs text-gray-400">or</p>
        <form onSubmit={submit} className="space-y-3">
          <input name="email" type="email" required placeholder="Email" className="form-field" />
          <input name="password" type="password" required placeholder="Password" className="form-field" />
          <button className="btn-primary w-full rounded-xl py-3">Log in</button>
        </form>
        <div className="flex justify-between text-sm">
          <a href="/admin/forgot" className="text-[#c41e5b]">Forgot password?</a>
          <a href="/admin/signup" className="text-gray-500">Owner sign-up</a>
        </div>
      </div>
    </div>
  );
}
