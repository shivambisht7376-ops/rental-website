"use client";
import { useEffect, useRef, useState } from "react";

// Polls for new requests and tells the owner right away, even if another tab is in front.
export default function NewAlert({ initial }) {
  const [count, setCount] = useState(initial);
  const [toast, setToast] = useState(false);
  const last = useRef(initial);

  useEffect(() => {
    const base = document.title;
    const t = setInterval(async () => {
      try {
        const r = await fetch("/api/admin/new-count", { cache: "no-store" });
        if (!r.ok) return;
        const { count } = await r.json();
        if (count > last.current) {
          setToast(true);
          setTimeout(() => setToast(false), 8000);
        }
        last.current = count;
        setCount(count);
        document.title = count ? `(${count}) New requests | ${base.replace(/^\(\d+\) New requests \| /, "")}` : base.replace(/^\(\d+\) New requests \| /, "");
      } catch {}
    }, 30000);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      <a href="/admin" className="relative inline-flex items-center gap-1 text-sm font-semibold">
        🔔 New
        {count > 0 && <span className="bg-red-600 text-white rounded-full text-xs px-2 py-0.5">{count}</span>}
      </a>
      {toast && (
        <a href="/admin" className="fixed top-3 left-1/2 -translate-x-1/2 z-50 bg-[#c41e5b] text-white rounded-xl px-5 py-3 shadow-xl text-sm font-semibold">
          🔔 A new booking request has arrived. Tap to view
        </a>
      )}
    </>
  );
}
