import { db } from "@/lib/db";
import { STATUS_LABEL, fmtDateTime, paidTotal } from "@/lib/format";

export const dynamic = "force-dynamic";

const esc = (v) => {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const csv = (rows) => "\uFEFF" + rows.map((r) => r.map(esc).join(",")).join("\r\n");

export async function GET(req) {
  const type = new URL(req.url).searchParams.get("type") || "bookings";
  let rows;
  if (type === "customers") {
    const cs = await db.customer.findMany({ include: { bookings: { include: { payments: true } } }, orderBy: { createdAt: "desc" } });
    rows = [["Name", "Phone", "Total bookings", "Confirmed/completed trips", "Total fare", "Total paid", "Notes"]];
    for (const c of cs) {
      const done = c.bookings.filter((b) => ["CONFIRMED", "COMPLETED"].includes(b.status));
      rows.push([
        c.name, c.phone, c.bookings.length, done.length,
        done.reduce((s, b) => s + (b.agreedFare || 0), 0),
        c.bookings.reduce((s, b) => s + paidTotal(b), 0),
        c.notes,
      ]);
    }
  } else {
    const bs = await db.booking.findMany({ include: { payments: true, driver: true }, orderBy: { createdAt: "desc" } });
    rows = [["Booking ID", "Request #", "Status", "Customer", "Phone", "Trip type", "Pickup", "Destination", "Travel date", "Passengers", "Vehicle", "Driver", "Agreed fare", "Paid", "Balance", "Flagged", "Created"]];
    for (const b of bs) {
      rows.push([
        b.bookingId || "", b.requestNo, STATUS_LABEL[b.status], b.customerName, b.phone, b.tripType, b.pickup, b.destination,
        fmtDateTime(b.pickupAt), b.passengers, b.vehicleName, b.driver?.name,
        b.agreedFare ?? "", paidTotal(b), b.agreedFare != null ? b.agreedFare - paidTotal(b) : "",
        b.flagged ? b.flagReason : "", fmtDateTime(b.createdAt),
      ]);
    }
  }
  return new Response(csv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${type}-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
