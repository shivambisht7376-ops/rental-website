import { db } from "./db";
import { fmtDate, fmtTime, inr, balanceOf } from "./format";

export const TEMPLATE_KEYS = {
  received: "Booking request received (Customer)",
  confirmed: "Booking confirmed (Customer)",
  rejected: "Booking rejected (Customer)",
  reminder: "Upcoming trip reminder (Customer)",
  completed: "Trip completed (Customer)",
  driver_assignment: "Trip duty slip (Driver)",
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
  driver_assignment:
    "🚖 TRIP DUTY SLIP — {business}\n━━━━━━━━━━━━━━━━━━\n📋 Booking ID: {bookingId}\n👤 Customer: {name}\n📞 Customer Phone: +{customerPhone}\n📍 Pickup: {pickup}\n📍 Destination: {destination}\n📅 Date & Time: {date}, {time}\n🚗 Vehicle: {vehicle}\n👥 Passengers: {passengers}\n📝 Special Notes: {notes}\n━━━━━━━━━━━━━━━━━━\nPlease arrive 10 minutes early. Safe driving!",
};

export const VARIABLES = ["name", "customerPhone", "pickup", "destination", "date", "time", "fare", "advance", "balance", "bookingId", "vehicle", "passengers", "notes", "driverName", "business"];

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
    customerPhone: b.phone,
    pickup: b.pickup,
    destination: b.destination || "-",
    date: fmtDate(b.pickupAt),
    time: fmtTime(b.pickupAt),
    fare: b.agreedFare != null ? inr(b.agreedFare) : "to be confirmed",
    advance: inr(paid),
    balance: b.agreedFare != null ? inr(balanceOf(b)) : "-",
    bookingId: b.bookingId || "(pending)",
    vehicle: b.vehicleName || "as assigned",
    passengers: b.passengers || 1,
    notes: b.notes || "None",
    driverName: b.driver?.name || "Driver",
    business,
  };
  return (body || "").replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
}

export const waLink = (phone, text) => {
  const cleanPhone = String(phone || "").replace(/\D/g, "");
  const formatted = cleanPhone.startsWith("91") ? cleanPhone : (cleanPhone.length === 10 ? "91" + cleanPhone : cleanPhone);
  return `https://wa.me/${formatted}?text=${encodeURIComponent(text)}`;
};
