"use client";
import { useState } from "react";

export default function BookingForm({ vehicles }) {
  const [state, setState] = useState({ loading: false, error: "", ref: "" });

  async function submit(e) {
    e.preventDefault();
    setState({ loading: true, error: "", ref: "" });
    const data = Object.fromEntries(new FormData(e.target));
    if (data.pickupAt) data.pickupAt = new Date(data.pickupAt).toISOString();
    const res = await fetch("/api/bookings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) return setState({ loading: false, error: j.error || "Something went wrong", ref: "" });
    e.target.reset();
    setState({ loading: false, error: "", ref: j.ref });
  }

  if (state.ref)
    return (
      <div className="bg-white rounded-3xl p-8 text-center shadow-2xl">
        <div className="text-5xl mb-3">✅</div>
        <h3 className="text-xl font-bold">Booking received!</h3>
        <p className="text-gray-600 mt-2 text-sm">Reference <b>{state.ref}</b>. We have sent a confirmation on WhatsApp and will send a reminder before your trip.</p>
        <button onClick={() => setState({ loading: false, error: "", ref: "" })} className="mt-5 text-sm text-[#c41e5b] font-semibold">Book another ride</button>
      </div>
    );

  return (
    <form onSubmit={submit} className="bg-white rounded-3xl p-6 shadow-2xl space-y-3 text-left">
      <h3 className="font-bold text-lg">Book your cab</h3>
      <input name="website" className="hidden" tabIndex={-1} autoComplete="off" />
      <select name="tripType" required className="form-field" defaultValue="OUTSTATION">
        <option value="OUTSTATION">Outstation</option>
        <option value="AIRPORT">Airport Transfer</option>
        <option value="LOCAL">Local Hourly Rental</option>
        <option value="CORPORATE">Corporate Travel</option>
        <option value="PACKAGE">Tour Package</option>
      </select>
      <input name="pickup" required placeholder="Pickup location" className="form-field" />
      <input name="drop" placeholder="Drop location" className="form-field" />
      <input name="pickupAt" type="datetime-local" required className="form-field" />
      <div className="grid grid-cols-2 gap-3">
        <select name="vehicleId" className="form-field">
          <option value="">Any vehicle</option>
          {vehicles.map((v) => <option key={v.id} value={v.id}>{v.name} ({v.seats} seats)</option>)}
        </select>
        <input name="passengers" type="number" min="1" max="60" defaultValue="2" className="form-field" />
      </div>
      <input name="name" required placeholder="Your name" className="form-field" />
      <div className="flex gap-2">
        <span className="form-field !w-auto">+91</span>
        <input name="phone" required inputMode="numeric" pattern="\d{10}" placeholder="WhatsApp number" className="form-field" />
      </div>
      {state.error && <p className="text-red-600 text-sm">{state.error}</p>}
      <button disabled={state.loading} className="btn-primary w-full rounded-xl py-3">{state.loading ? "Booking…" : "Get Quote & Book"}</button>
      <p className="text-xs text-gray-500 text-center">Confirmation and reminders are sent on WhatsApp.</p>
    </form>
  );
}
