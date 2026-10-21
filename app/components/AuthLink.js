"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function AuthLink() {
  const [data, setData] = useState(undefined);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((j) => setData(j))
      .catch(() => setData({ user: null, admin: null }));
  }, []);

  if (data === undefined) return <span className="w-24" />;

  const { user, admin } = data;

  if (admin) {
    return (
      <div className="flex items-center gap-3">
        {user && (
          <Link href="/account" className="text-xs sm:text-sm font-semibold text-gray-700 hover:text-[#c41e5b]">
            My bookings
          </Link>
        )}
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#c41e5b] to-[#891740] text-white text-xs sm:text-sm font-semibold px-4 py-2 shadow hover:opacity-90 transition-all"
        >
          <span>⚡ Owner Dashboard</span>
        </Link>
      </div>
    );
  }

  if (user) {
    return (
      <Link href="/account" className="text-sm font-semibold text-[#c41e5b] hover:underline">
        My bookings
      </Link>
    );
  }

  return (
    <span className="flex items-center gap-3 text-sm">
      <Link href="/login" className="font-semibold hover:text-[#c41e5b]">
        Log in
      </Link>
      <Link href="/admin/login" className="hidden sm:inline font-semibold text-gray-500 hover:text-[#c41e5b]">
        Admin
      </Link>
    </span>
  );
}
