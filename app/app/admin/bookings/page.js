import { db } from "@/lib/db";
import { getTemplates } from "@/lib/templates";
import { getSettings } from "@/lib/settings";
import { BookingCard, PageTitle, Empty } from "@/components/admin-ui";
import { STATUS_LABEL } from "@/lib/format";
import { searchWhere } from "@/lib/search";

export const dynamic = "force-dynamic";

export default async function AllBookings({ searchParams }) {
  const q = (searchParams?.q || "").trim();
  const status = searchParams?.status || "";
  const where = { ...searchWhere(q), ...(status ? { status } : {}) };
  const [list, templates, s] = await Promise.all([
    db.booking.findMany({ where, orderBy: { createdAt: "desc" }, take: 200, include: { payments: true } }),
    getTemplates(),
    getSettings(),
  ]);
  return (
    <>
      <PageTitle title="All Bookings" hint="Every request from the website, including rejected and cancelled ones.">
        <a href="/api/admin/export?type=bookings" className="border rounded-xl px-4 py-2 text-sm bg-white">⬇ Download Excel/CSV</a>
      </PageTitle>
      <form className="flex flex-wrap gap-2 mb-4">
        <input name="q" defaultValue={q} placeholder="Search name, phone or Booking ID" className="form-field !w-auto flex-1 min-w-[220px]" />
        <select name="status" defaultValue={status} className="form-field !w-auto">
          <option value="">All statuses</option>
          {Object.entries(STATUS_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <button className="btn-primary rounded-xl px-5 py-2 text-sm">Search</button>
      </form>
      <div className="space-y-3">
        {list.length === 0 && <Empty>No bookings found.</Empty>}
        {list.map((b) => <BookingCard key={b.id} b={b} templates={templates} business={s.businessName} showMoney />)}
      </div>
    </>
  );
}

