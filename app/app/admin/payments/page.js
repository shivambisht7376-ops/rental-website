import Link from "next/link";
import { db } from "@/lib/db";
import { PageTitle, Empty } from "@/components/admin-ui";
import { fmtDateTime, inr, paidTotal } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Payments({ searchParams }) {
  const onlyDue = searchParams?.due === "1";
  const bookings = await db.booking.findMany({
    where: { agreedFare: { not: null }, status: { in: ["CONFIRMED", "COMPLETED", "CANCELLED"] } },
    orderBy: { pickupAt: "desc" },
    include: { payments: true },
    take: 300,
  });
  const rows = bookings.filter((b) => !onlyDue || b.agreedFare - paidTotal(b) > 0);
  const totalDue = bookings.reduce((s, b) => (b.status === "CANCELLED" ? s : s + Math.max(0, b.agreedFare - paidTotal(b))), 0);
  const totalPaid = bookings.reduce((s, b) => s + paidTotal(b), 0);
  return (
    <>
      <PageTitle title="Payment Records" hint="Fare, advance and balance for every confirmed booking.">
        <Link href={onlyDue ? "/admin/payments" : "/admin/payments?due=1"} className="border rounded-xl px-4 py-2 text-sm bg-white">{onlyDue ? "Show all" : "Show only balance due"}</Link>
      </PageTitle>
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-white border rounded-2xl p-4"><p className="text-sm text-gray-500">Total received</p><p className="text-2xl font-bold text-green-700">{inr(totalPaid)}</p></div>
        <div className="bg-white border rounded-2xl p-4"><p className="text-sm text-gray-500">Balance still to collect</p><p className="text-2xl font-bold text-red-600">{inr(totalDue)}</p></div>
      </div>
      {rows.length === 0 && <Empty>No payment records yet.</Empty>}
      <div className="space-y-2">
        {rows.map((b) => (
          <Link key={b.id} href={`/admin/bookings/${b.id}`} className="bg-white rounded-2xl border p-4 flex flex-wrap items-center justify-between gap-2 hover:border-[#c41e5b]">
            <div>
              <p className="font-semibold">{b.bookingId} · {b.customerName}</p>
              <p className="text-sm text-gray-500">{b.pickup} → {b.destination} · {fmtDateTime(b.pickupAt)}</p>
            </div>
            <div className="text-sm text-right">
              <p>Fare {inr(b.agreedFare)} · Paid {inr(paidTotal(b))}</p>
              <p className={b.agreedFare - paidTotal(b) > 0 ? "font-bold text-red-600" : "font-bold text-green-700"}>Balance {inr(b.agreedFare - paidTotal(b))}</p>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
