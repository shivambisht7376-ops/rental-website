import { db } from "@/lib/db";
import BookingRow from "@/components/BookingRow";

export const dynamic = "force-dynamic";

export default async function Admin({ searchParams }) {
  const status = searchParams?.status;
  const where = status ? { status } : {};
  const [bookings, total, pending, today] = await Promise.all([
    db.booking.findMany({ where, orderBy: { pickupAt: "asc" }, take: 200, include: { messages: { orderBy: { createdAt: "desc" }, take: 3 } } }),
    db.booking.count(),
    db.booking.count({ where: { status: "PENDING" } }),
    db.booking.count({ where: { pickupAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)), lt: new Date(new Date().setHours(24, 0, 0, 0)) } } }),
  ]);
  const tabs = ["", "PENDING", "CONFIRMED", "ASSIGNED", "COMPLETED", "CANCELLED"];
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 h-14 flex items-center justify-between">
        <b className="text-[#c41e5b]">Admin · Bookings</b>
        <a href="/" className="text-sm text-gray-500">View site</a>
      </header>
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[["Total bookings", total], ["Pending", pending], ["Trips today", today]].map(([l, v]) => (
            <div key={l} className="card p-5"><p className="text-sm text-gray-500">{l}</p><p className="text-3xl font-bold">{v}</p></div>
          ))}
        </div>
        <div className="flex gap-2 mb-4 flex-wrap">
          {tabs.map((t) => (
            <a key={t} href={t ? `?status=${t}` : "?"} className={`px-4 py-1.5 rounded-full text-sm border ${(status || "") === t ? "bg-[#c41e5b] text-white border-[#c41e5b]" : "bg-white"}`}>{t || "ALL"}</a>
          ))}
        </div>
        <div className="space-y-3">
          {bookings.length === 0 && <p className="text-gray-500">No bookings.</p>}
          {bookings.map((b) => <BookingRow key={b.id} b={JSON.parse(JSON.stringify(b))} />)}
        </div>
      </div>
    </div>
  );
}
