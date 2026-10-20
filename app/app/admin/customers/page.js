import Link from "next/link";
import { db } from "@/lib/db";
import { PageTitle, Empty } from "@/components/admin-ui";
import { fmtDate, inr } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Customers({ searchParams }) {
  const q = (searchParams?.q || "").trim();
  const digits = q.replace(/\D/g, "");
  const where = q
    ? { OR: [{ name: { contains: q, mode: "insensitive" } }, ...(digits.length >= 3 ? [{ phone: { contains: digits } }] : []), { bookings: { some: { bookingId: { contains: q, mode: "insensitive" } } } }] }
    : {};
  const list = await db.customer.findMany({ where, orderBy: { createdAt: "desc" }, take: 200, include: { bookings: true } });
  return (
    <>
      <PageTitle title="Customer Records" hint="Everyone who has requested a booking. Open a customer to see their previous trips.">
        <a href="/api/admin/export?type=customers" className="border rounded-xl px-4 py-2 text-sm bg-white">⬇ Download Excel/CSV</a>
      </PageTitle>
      <form className="flex gap-2 mb-4">
        <input name="q" defaultValue={q} placeholder="Search name, phone or Booking ID" className="form-field flex-1" />
        <button className="btn-primary rounded-xl px-5 py-2 text-sm">Search</button>
      </form>
      <div className="space-y-2">
        {list.length === 0 && <Empty>No customers found.</Empty>}
        {list.map((c) => {
          const trips = c.bookings.filter((b) => ["CONFIRMED", "COMPLETED"].includes(b.status));
          return (
            <Link key={c.id} href={`/admin/customers/${c.id}`} className="bg-white rounded-2xl border p-4 flex items-center justify-between hover:border-[#c41e5b]">
              <div>
                <p className="font-semibold">{c.name}</p>
                <p className="text-sm text-gray-500">+{c.phone} · customer since {fmtDate(c.createdAt)}</p>
              </div>
              <div className="text-right text-sm">
                <p>{c.bookings.length} request{c.bookings.length === 1 ? "" : "s"}</p>
                <p className="text-gray-500">{trips.length} trips · {inr(trips.reduce((s, b) => s + (b.agreedFare || 0), 0))}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
