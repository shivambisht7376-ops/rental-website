export const TZ = "Asia/Kolkata";

export const STATUS_LABEL = {
  NEW: "New Request",
  AWAITING: "Awaiting Confirmation",
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  REJECTED: "Rejected",
};

export const STATUS_COLOR = {
  NEW: "bg-blue-100 text-blue-800",
  AWAITING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-green-100 text-green-800",
  COMPLETED: "bg-gray-200 text-gray-800",
  CANCELLED: "bg-red-100 text-red-800",
  REJECTED: "bg-red-100 text-red-800",
};

export const inr = (n) => (n == null ? "-" : "₹" + Number(n).toLocaleString("en-IN"));

export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { timeZone: TZ, day: "2-digit", month: "short", year: "numeric" }) : "-";

export const fmtTime = (d) =>
  d ? new Date(d).toLocaleTimeString("en-IN", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: true }) : "-";

export const fmtDateTime = (d) => (d ? `${fmtDate(d)}, ${fmtTime(d)}` : "-");

// Build a Date from a yyyy-mm-dd and HH:MM entered in Indian time.
export function istDate(date, time) {
  return new Date(`${date}T${time || "00:00"}:00+05:30`);
}

// yyyy-mm-dd / HH:MM parts of a date, in IST (for form defaults).
export function istParts(d) {
  const p = new Date(d).toLocaleString("sv-SE", { timeZone: TZ }); // "2026-10-20 23:00:58"
  return { date: p.slice(0, 10), time: p.slice(11, 16) };
}

export const paidTotal = (b) => (b.payments || []).reduce((s, p) => s + p.amount, 0);
export const balanceOf = (b) => (b.agreedFare ?? 0) - paidTotal(b);
