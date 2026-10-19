import { db } from "./db";

const API = "https://graph.facebook.com/v20.0";

// Format a Date in IST for message bodies.
export function fmtIST(d) {
  return new Date(d).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

/**
 * Send a pre-approved template message. Required because confirmations and
 * reminders are business-initiated (outside the 24h customer window).
 * Templates to create in Meta Business Manager (language en):
 *  booking_confirmation: {{1}} name, {{2}} ref, {{3}} pickup time, {{4}} pickup location
 *  trip_reminder:        {{1}} name, {{2}} ref, {{3}} pickup time, {{4}} driver/vehicle info
 */
export async function sendTemplate(to, template, params) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  if (!token || !phoneId) {
    console.log("[whatsapp:dry-run]", to, template, params);
    return { ok: true, response: "dry-run (WHATSAPP_TOKEN not set)" };
  }
  const res = await fetch(`${API}/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: template,
        language: { code: "en" },
        components: [
          { type: "body", parameters: params.map((text) => ({ type: "text", text: String(text) })) },
        ],
      },
    }),
  });
  const text = await res.text();
  return { ok: res.ok, response: text.slice(0, 1000) };
}

async function log(bookingId, kind, r) {
  await db.messageLog.create({ data: { bookingId, kind, ok: r.ok, response: r.response } });
}

export async function sendConfirmation(booking) {
  const r = await sendTemplate(booking.phone, "booking_confirmation", [
    booking.name,
    booking.ref,
    fmtIST(booking.pickupAt),
    booking.pickup,
  ]);
  await log(booking.id, "CONFIRMATION", r);
  if (r.ok) await db.booking.update({ where: { id: booking.id }, data: { confirmationSentAt: new Date() } });
  return r;
}

export async function sendReminder(booking) {
  const info = booking.driverName
    ? `Driver ${booking.driverName} (${booking.driverPhone || "-"})`
    : "Driver details will be shared shortly";
  const r = await sendTemplate(booking.phone, "trip_reminder", [
    booking.name,
    booking.ref,
    fmtIST(booking.pickupAt),
    info,
  ]);
  await log(booking.id, "REMINDER", r);
  if (r.ok) await db.booking.update({ where: { id: booking.id }, data: { reminderSentAt: new Date() } });
  return r;
}
