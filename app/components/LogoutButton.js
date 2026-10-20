"use client";

export default function LogoutButton() {
  return (
    <button
      className="text-sm text-gray-500"
      onClick={async () => { await fetch("/api/admin/logout", { method: "POST" }); window.location.href = "/admin/login"; }}
    >
      Log out
    </button>
  );
}
