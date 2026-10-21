"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { GoogleButton, ERRORS } from "@/components/auth-ui";

export default function Login() {
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");
  const [setupRequired, setSetupRequired] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("reset")) setNote("Password changed. Please log in.");
    if (q.get("error")) setErr(ERRORS[q.get("error")] || "Login failed");
  }, []);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setSetupRequired(false);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(e.target))),
    });
    const j = await res.json().catch(() => ({}));
    if (res.ok) {
      window.location.href = "/admin";
    } else {
      setErr(j.error || "Wrong email or password");
      if (j.setupRequired) setSetupRequired(true);
    }
  }

  return (
    <div className="min-h-screen hero-bg grid place-items-center p-6">
      <div className="bg-white rounded-3xl p-8 w-full max-w-sm space-y-4 shadow-2xl">
        <h1 className="text-xl font-bold">Owner Login</h1>
        {note && <p className="text-green-700 text-sm">{note}</p>}
        {err && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3">
            <p>{err}</p>
            {setupRequired && (
              <Link href="/admin/signup" className="inline-block mt-2 font-semibold text-[#c41e5b] underline">
                Go to Initial Owner Setup →
              </Link>
            )}
          </div>
        )}
        <GoogleButton role="admin" label="Owner login with Google" />
        <p className="text-center text-xs text-gray-400">or</p>
        <form onSubmit={submit} className="space-y-3">
          <input name="email" type="email" required placeholder="Email" className="form-field" />
          <input name="password" type="password" required placeholder="Password" className="form-field" />
          <button className="btn-primary w-full rounded-xl py-3">Log in</button>
        </form>
        <div className="flex justify-between text-sm">
          <Link href="/admin/forgot" className="text-[#c41e5b]">Forgot password?</Link>
          <Link href="/admin/signup" className="text-gray-500">Owner sign-up / Setup</Link>
        </div>
      </div>
    </div>
  );
}
