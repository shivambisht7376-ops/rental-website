"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminBanner() {
  const [admin, setAdmin] = useState(null);
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((j) => setAdmin(j.admin))
      .catch(() => {});
  }, []);

  if (!admin || pathname?.startsWith("/admin")) return null;

  return (
    <div className="bg-[#1e0818] text-white text-xs sm:text-sm py-2 px-4 border-b border-pink-900/40 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>
            Logged in as Admin (<b>{admin.email}</b>)
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="font-bold text-[#f6a8c4] hover:text-white underline flex items-center gap-1"
          >
            <span>Go to Owner Dashboard</span> →
          </Link>
          <a href="/api/admin/logout" className="text-gray-400 hover:text-white text-xs">
            Log out
          </a>
        </div>
      </div>
    </div>
  );
}
