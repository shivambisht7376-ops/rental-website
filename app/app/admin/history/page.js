import { db } from "@/lib/db";
import { getTemplates } from "@/lib/templates";
import { getSettings } from "@/lib/settings";
import { BookingCard, PageTitle, Empty } from "@/components/admin-ui";
import { searchWhere } from "@/lib/search";

export const dynamic = "force-dynamic";

export default async function History({ searchParams }) {
  const q = (searchParams?.q || "").trim();
  const [list, templates, s] = await Promise.all([
    db.booking.findMany({
      where: { status: { in: ["COMPLETED", "CANCELLED", "REJECTED"] }, ...searchWhere(q) },
      orderBy: { pickupAt: "desc" },
      take: 300,
      include: { payments: true },
    }),
    getTemplates(),
    getSettings(),
  ]);
  return (
    <>
      <PageTitle title="Booking History" hint="Completed, cancelled and rejected bookings. The fare shown is the fare agreed at the time." />
      <form className="flex gap-2 mb-4">
        <input name="q" defaultValue={q} placeholder="Search name, phone or Booking ID" className="form-field flex-1" />
        <button className="btn-primary rounded-xl px-5 py-2 text-sm">Search</button>
      </form>
      <div className="space-y-3">
        {list.length === 0 && <Empty>Nothing here yet.</Empty>}
        {list.map((b) => <BookingCard key={b.id} b={b} templates={templates} business={s.businessName} showMoney />)}
      </div>
    </>
  );
}
