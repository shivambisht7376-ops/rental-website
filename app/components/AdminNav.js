"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminNav({ items }) {
  const pathname = usePathname();

  return (
    <nav className="max-w-7xl mx-auto px-4 flex gap-1.5 overflow-x-auto pb-2 text-sm whitespace-nowrap">
      {items.map(([href, label]) => {
        const isActive = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`px-3.5 py-1.5 rounded-full border text-xs sm:text-sm font-medium transition-all ${
              isActive
                ? "bg-[#c41e5b] text-white border-[#c41e5b] shadow-sm font-semibold"
                : "bg-white text-gray-700 border-gray-200 hover:bg-pink-50 hover:text-[#c41e5b]"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
