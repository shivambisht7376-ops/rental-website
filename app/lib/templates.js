import { db } from "./db";
import { fmtDate, fmtTime, inr, balanceOf } from "./format";

export const TEMPLATE_KEYS = {
  received: "Booking request received",
  confirmed: "Booking confirmed",
  rejected: "Booking rejected",
  reminder: "Upcoming trip reminder",
  completed: "Trip completed",
};

export const DEFAULT_TEMPLATES = {
  received:
    "Hello {name}, we have received your cab request from {pickup} to {destination} on {date} at {time}. We will confirm shortly after checking availability. - {business}",
  confirmed:
    "Hello {name}, your booking is confirmed!\nBooking ID: {bookingId}\nTrip: {pickup} to {destination}\nDate: {date}, {time}\nVehicle: {vehicle}\nFare: {fare}\nAdvance paid: {advance}\nBalance: {balance}\nThank you for choosing {business}.",
  rejected:
    "Hello {name}, sorry, we are unable to take your request from {pickup} to {destination} on {date}. Please contact us for other options. - {business}",
  reminder:
    "Hello {name}, a reminder of your trip ({bookingId}) from {pickup} to {destination} on {date} at {time}. Driver details will be shared before pickup. - {business}",
  completed:
    "Hello {name}, thank you for travelling with {business}. We hope you had a safe and comfortable trip (Booking {bookingId}). We would love to serve you again!",
};

export const VARIABLES = ["name", "pickup", "destination", "date", "time", "fare", "advance", "balance", "bookingId", "vehicle", "business"];

export async function getTemplates() {
  const out = { ...DEFAULT_TEMPLATES };
  try {
    const rows = await db.messageTemplate.findMany();
    for (const r of rows) out[r.key] = r.body;
  } catch {}
  return out;
}

export function defaultTemplateFor(status) {
  if (status === "CONFIRMED") return "confirmed";
  if (status === "REJECTED" || status === "CANCELLED") return "rejected";
  if (status === "COMPLETED") return "completed";
  return "received";
}

export function renderTemplate(body, b, business) {
  const paid = (b.payments || []).reduce((s, p) => s + p.amount, 0);
  const vars = {
    name: b.customerName,
    pickup: b.pickup,
    destination: b.destination || "-",
    date: fmtDate(b.pickupAt),
    time: fmtTime(b.pickupAt),
    fare: b.agreedFare != null ? inr(b.agreedFare) : "to be confirmed",
    advance: inr(paid),
    balance: b.agreedFare != null ? inr(balanceOf(b)) : "-",
    bookingId: b.bookingId || "(pending)",
    vehicle: b.vehicleName || "as assigned",
    business,
  };
  return body.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
}

export const waLink = (phone, text) => `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
