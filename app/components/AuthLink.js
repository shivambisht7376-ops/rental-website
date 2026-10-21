"use client";
import { useEffect, useState } from "react";

export default function AuthLink() {
  const [user, setUser] = useState(undefined);
  useEffect(() => {
    fetch("/api/me").then((r) => r.json()).then((j) => setUser(j.user)).catch(() => setUser(null));
  }, []);
  if (user === undefined) return <span className="w-24" />;
  return user ? (
    <a href="/account" className="text-sm font-semibold text-[#c41e5b]">My bookings</a>
  ) : (
    <span className="flex items-center gap-3 text-sm">
      <a href="/login" className="font-semibold hover:text-[#c41e5b]">Log in</a>
      <a href="/signup" className="hidden sm:inline font-semibold text-[#c41e5b]">Sign up</a>
    </span>
  );
}
