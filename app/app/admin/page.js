import { db } from "@/lib/db";
import { getTemplates } from "@/lib/templates";
import { getSettings } from "@/lib/settings";
import { BookingCard, PageTitle, Empty } from "@/components/admin-ui";

export default async function NewRequests() {
  const [list, templates, s] = await Promise.all([
    db.booking.findMany({ where: { status: { in: ["NEW", "AWAITING"] } }, orderBy: { createdAt: "desc" } }),
    getTemplates(),
    getSettings(),
  ]);
  return (
    <>
      <PageTitle title="New Booking Requests" hint="Open a request to confirm or reject it. A Booking ID is created only when you confirm." />
      <div className="space-y-3">
        {list.length === 0 && <Empty>No new requests right now. New website requests will appear here.</Empty>}
        {list.map((b) => <BookingCard key={b.id} b={b} templates={templates} business={s.businessName} />)}
      </div>
    </>
  );
}
