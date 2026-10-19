"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUSES = ["PENDING", "CONFIRMED", "ASSIGNED", "COMPLETED", "CANCELLED"];

export default function BookingRow({ b }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({ quote: b.quote ?? "", driverName: b.driverName ?? "", driverPhone: b.driverPhone ?? "" });

  async function patch(body) {
    setBusy(true);
    await fetch(`/api/admin/bookings/${b.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="bg-white rounded-2xl border p-4 grid lg:grid-cols-[1.4fr_1fr_1.4fr] gap-4 text-sm">
      <div>
        <p className="font-bold">{b.name} <span className="text-gray-400 font-normal">· {b.ref}</span></p>
        <a href={`https://wa.me/${b.phone}`} className="text-green-600">+{b.phone}</a>
        <p className="mt-1">{b.tripType}: {b.pickup}{b.drop ? ` → ${b.drop}` : ""}</p>
        <p className="text-gray-500">{new Date(b.pickupAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} · {b.passengers} pax</p>
        <p className="text-xs text-gray-400 mt-1">
          Confirmation: {b.confirmationSentAt ? "sent" : "not sent"} · Reminder: {b.reminderSentAt ? "sent" : "pending"}
        </p>
      </div>
      <div className="space-y-2">
        <select value={b.status} disabled={busy} onChange={(e) => patch({ status: e.target.value })} className="form-field">
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <input value={f.quote} onChange={(e) => setF({ ...f, quote: e.target.value })} placeholder="Quote ₹" className="form-field" />
      </div>
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <input value={f.driverName} onChange={(e) => setF({ ...f, driverName: e.target.value })} placeholder="Driver name" className="form-field" />
          <input value={f.driverPhone} onChange={(e) => setF({ ...f, driverPhone: e.target.value })} placeholder="Driver phone" className="form-field" />
        </div>
        <div className="flex flex-wrap gap-2">
          <button disabled={busy} onClick={() => patch({ ...f, status: f.driverName ? "ASSIGNED" : b.status })} className="btn-primary rounded-lg px-3 py-1.5">Save</button>
          <button disabled={busy} onClick={() => patch({ action: "resend_confirmation" })} className="border rounded-lg px-3 py-1.5">Resend confirmation</button>
          <button disabled={busy} onClick={() => patch({ action: "send_reminder" })} className="border rounded-lg px-3 py-1.5">Send reminder</button>
        </div>
      </div>
    </div>
  );
}
