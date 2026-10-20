import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getTemplates } from "@/lib/templates";
import { getSettings } from "@/lib/settings";
import { BookingCard, Field } from "@/components/admin-ui";
import { saveCustomer } from "../../actions";

export const dynamic = "force-dynamic";

export default async function CustomerPage({ params }) {
  const c = await db.customer.findUnique({
    where: { id: params.id },
    include: { bookings: { orderBy: { pickupAt: "desc" }, include: { payments: true } } },
  });
  if (!c) notFound();
  const [templates, s] = await Promise.all([getTemplates(), getSettings()]);
  return (
    <div className="max-w-4xl space-y-5">
      <Link href="/admin/customers" className="text-sm text-gray-500">← All customers</Link>
      <div className="bg-white rounded-2xl border p-5">
        <h1 className="text-xl font-bold">{c.name}</h1>
        <p className="text-sm text-gray-500 mb-4">+{c.phone}</p>
        <form action={saveCustomer} className="grid sm:grid-cols-2 gap-3">
          <input type="hidden" name="id" value={c.id} />
          <Field label="Name"><input name="name" defaultValue={c.name} className="form-field" /></Field>
          <Field label="Your notes about this customer"><input name="notes" defaultValue={c.notes || ""} className="form-field" /></Field>
          <div><button className="btn-primary rounded-xl px-5 py-2 text-sm">Save</button></div>
        </form>
      </div>
      <h2 className="font-bold">Previous bookings ({c.bookings.length})</h2>
      <div className="space-y-3">
        {c.bookings.map((b) => <BookingCard key={b.id} b={b} templates={templates} business={s.businessName} showMoney />)}
      </div>
    </div>
  );
}
