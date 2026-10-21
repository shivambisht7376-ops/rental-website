"use client";
import { useEffect, useRef, useState } from "react";

export default function BookingForm({ vehicles, defaultVehicleId = "" }) {
  const [state, setState] = useState({ loading: false, error: "", requestNo: null, duplicate: false });
  const startedAt = useRef(Date.now());
  const cfRef = useRef(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey) return;
    const sc = document.createElement("script");
    sc.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    sc.async = true;
    document.head.appendChild(sc);
  }, [siteKey]);

  // Pre-fill name/phone for logged-in customers.
  const [me, setMe] = useState(null);
  useEffect(() => {
    fetch("/api/me").then((r) => r.json()).then((j) => setMe(j.user)).catch(() => {});
  }, []);

  const today = new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10);

  async function submit(e) {
    e.preventDefault();
    const form = e.target;
    setState({ loading: true, error: "", requestNo: null, duplicate: false });

    try {
      const data = Object.fromEntries(new FormData(form));
      data.startedAt = startedAt.current;
      data.cfToken = data["cf-turnstile-response"] || "";

      const ctrl = new AbortController();
      const timeoutId = setTimeout(() => ctrl.abort(), 20000);

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        signal: ctrl.signal,
      });
      clearTimeout(timeoutId);

      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (typeof window !== "undefined" && window.turnstile) window.turnstile.reset();
        return setState({
          loading: false,
          error: j.error || "Could not complete request. Please try again or WhatsApp us directly.",
          requestNo: null,
          duplicate: false,
        });
      }
      form.reset();
      setState({ loading: false, error: "", requestNo: j.requestNo, duplicate: !!j.duplicate });
    } catch (err) {
      console.error("Booking submission error:", err);
      setState({
        loading: false,
        error: err.name === "AbortError"
          ? "Request timed out due to slow network. Please check WhatsApp or retry."
          : (err.message || "Connection error. Please try again."),
        requestNo: null,
        duplicate: false,
      });
    }
  }

  if (state.requestNo !== null)
    return (
      <div className="bg-white rounded-3xl p-8 text-center shadow-2xl text-gray-900">
        <div className="text-5xl mb-3">📩</div>
        <h3 className="text-xl font-bold">{state.duplicate ? "We already have your request" : "Your request has been received"}</h3>
        <p className="text-gray-600 mt-3 text-sm">
          Your request #{state.requestNo} is <b>awaiting confirmation</b> from our team. We will contact you on WhatsApp / phone shortly to confirm your fare and booking.
        </p>
        <p className="text-xs text-gray-500 mt-3">A Booking ID is issued only after we confirm your trip.</p>
        <button onClick={() => { startedAt.current = Date.now(); setState({ loading: false, error: "", requestNo: null, duplicate: false }); }} className="mt-5 text-sm text-[#c41e5b] font-semibold underline">Make another request</button>
      </div>
    );

  return (
    <form id="book" onSubmit={submit} className="bg-white rounded-3xl p-6 shadow-2xl space-y-3 text-left text-gray-900">
      <h3 className="font-bold text-lg">Request a booking</h3>
      <input name="website" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <select name="tripType" required className="form-field" defaultValue="OUTSTATION">
        <option value="OUTSTATION">Outstation / Intercity</option>
        <option value="AIRPORT">Airport Transfer</option>
        <option value="LOCAL">Local Hourly Rental</option>
        <option value="CORPORATE">Corporate Travel</option>
        <option value="PACKAGE">Tour Package</option>
      </select>
      <input name="pickup" required placeholder="Pickup location" className="form-field" />
      <input name="destination" required placeholder="Destination" className="form-field" />
      <div className="grid grid-cols-2 gap-3">
        <input name="date" type="date" required min={today} className="form-field" aria-label="Travel date" />
        <input name="time" type="time" required className="form-field" aria-label="Travel time" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <select name="vehicleId" defaultValue={defaultVehicleId} className="form-field">
          <option value="">Any vehicle</option>
          {vehicles.map((v) => <option key={v.id} value={v.id}>{v.name} ({v.seats} seats, {v.ac ? "AC" : "Non-AC"})</option>)}
        </select>
        <input name="passengers" type="number" min="1" max="60" defaultValue="2" className="form-field" aria-label="Passengers" />
      </div>
      <input key={`n-${me?.name || ""}`} name="name" required defaultValue={me?.name || ""} placeholder="Your name" className="form-field" />
      <div className="flex gap-2">
        <span className="form-field !w-auto">+91</span>
        <input key={`p-${me?.phone || ""}`} name="phone" required defaultValue={me?.phone || ""} inputMode="numeric" pattern="[6-9][0-9]{9}" maxLength={10} placeholder="Mobile number" className="form-field" />
      </div>
      <textarea name="notes" rows={2} placeholder="Anything else? (optional)" className="form-field" />
      {siteKey && <div ref={cfRef} className="cf-turnstile" data-sitekey={siteKey} />}
      {state.error && <p className="text-red-600 text-sm font-medium">{state.error}</p>}
      <button disabled={state.loading} className="btn-primary w-full rounded-xl py-3 font-semibold text-white">
        {state.loading ? "Sending request…" : "Send booking request"}
      </button>
      <p className="text-xs text-gray-500 text-center">This is a request. Your booking is confirmed only after our team replies.</p>
    </form>
  );
}
