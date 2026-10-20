import { db } from "@/lib/db";
import { getTemplates, renderTemplate, waLink } from "@/lib/templates";
import { getSettings } from "@/lib/settings";
import { PageTitle, Empty } from "@/components/admin-ui";
import Link from "next/link";
import { fmtDate, fmtTime, inr, balanceOf } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Upcoming() {
  const [list, templates, s] = await Promise.all([
    db.booking.findMany({
      where: { status: "CONFIRMED", pickupAt: { gte: new Date(Date.now() - 3 * 3600 * 1000) } },
      orderBy: { pickupAt: "asc" },
      include: { payments: true, driver: true },
    }),
    getTemplates(),
    getSettings(),
  ]);
  const groups = {};
  for (const b of list) (groups[fmtDate(b.pickupAt)] ||= []).push(b);
  return (
    <>
      <PageTitle title="Upcoming Trips" hint="Confirmed trips in date order. Use the reminder button to message the customer before the trip." />
      {list.length === 0 && <Empty>No upcoming confirmed trips.</Empty>}
      {Object.entries(groups).map(([day, items]) => (
        <div key={day} className="mb-6">
          <h2 className="font-bold mb-2">{day}</h2>
          <div className="space-y-3">
            {items.map((b) => (
              <div key={b.id} className="bg-white rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="font-semibold">{fmtTime(b.pickupAt)} · {b.customerName} <span className="text-gray-400 font-normal">({b.bookingId})</span></p>
                  <p className="text-sm text-gray-600">{b.pickup} → {b.destination}</p>
                  <p className="text-sm text-gray-500">{b.vehicleName || "Vehicle not assigned"} · {b.driver ? `Driver: ${b.driver.name}` : "Driver not assigned"}</p>
                  <p className="text-sm">Balance due: <b className={balanceOf(b) > 0 ? "text-red-600" : "text-green-700"}>{inr(balanceOf(b))}</b></p>
                </div>
                <div className="flex gap-2">
                  <a target="_blank" rel="noreferrer" href={waLink(b.phone, renderTemplate(templates.reminder, b, s.businessName))} className="rounded-xl bg-green-600 text-white text-sm font-semibold px-4 py-2">Send reminder</a>
                  <Link href={`/admin/bookings/${b.id}`} className="btn-primary rounded-xl text-sm px-4 py-2">Open</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
