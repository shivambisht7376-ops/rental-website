import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getTemplates, renderTemplate, defaultTemplateFor, TEMPLATE_KEYS, waLink } from "@/lib/templates";
import { getSettings } from "@/lib/settings";
import { STATUS_LABEL, fmtDateTime, inr, paidTotal, balanceOf } from "@/lib/format";
import { Badge, Field } from "@/components/admin-ui";
import WhatsAppBox from "@/components/WhatsAppBox";
import { confirmBooking, rejectBooking, setStatus, updateBookingDetails, addPayment, deletePayment, markMessageSent } from "../../actions";

export const dynamic = "force-dynamic";

export default async function BookingDetail({ params }) {
  const b = await db.booking.findUnique({
    where: { id: params.id },
    include: { payments: { orderBy: { paidAt: "asc" } }, driver: true, vehicle: true, messages: { orderBy: { createdAt: "desc" }, take: 5 }, customer: true },
  });
  if (!b) notFound();
  const [vehicles, drivers, templates, s, route] = await Promise.all([
    db.vehicle.findMany({ where: { OR: [{ active: true }, { id: b.vehicleId || "none" }] }, orderBy: { sortOrder: "asc" } }),
    db.driver.findMany({ where: { OR: [{ active: true }, { id: b.driverId || "none" }] } }),
    getTemplates(),
    getSettings(),
    db.route.findFirst({
      where: { from: { equals: b.pickup.trim(), mode: "insensitive" }, to: { equals: (b.destination || "").trim(), mode: "insensitive" } },
      include: { fares: true },
    }),
  ]);
  const suggested = route && b.vehicleId ? route.fares.find((f) => f.vehicleId === b.vehicleId)?.fare : null;
  const messages = Object.fromEntries(Object.keys(TEMPLATE_KEYS).map((k) => [k, renderTemplate(templates[k], b, s.businessName)]));
  const sentLog = b.messages.map((m) => ({ id: m.id, template: m.template, when: fmtDateTime(m.createdAt) }));
  const canDecide = ["NEW", "AWAITING"].includes(b.status);
  const paid = paidTotal(b);

  return (
    <div className="max-w-4xl space-y-5">
      <Link href="/admin/bookings" className="text-sm text-gray-500 hover:text-gray-900">← All bookings</Link>

      <div className="bg-white rounded-2xl border p-5">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <Badge status={b.status} />
          <h1 className="text-xl font-bold">{b.bookingId || `Request #${b.requestNo}`}</h1>
          {!b.bookingId && <span className="text-xs text-gray-500">(Booking ID will be created when you confirm)</span>}
        </div>
        {b.flagged && (
          <div className="bg-orange-50 border border-orange-200 text-orange-900 text-sm rounded-xl p-3 mb-3">
            ⚠ <b>Please check this request:</b> {b.flagReason}
          </div>
        )}
        <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <div><dt className="text-gray-500">Customer</dt><dd className="font-semibold"><Link className="text-[#c41e5b]" href={`/admin/customers/${b.customerId}`}>{b.customerName}</Link></dd></div>
          <div><dt className="text-gray-500">Mobile</dt><dd className="font-semibold">+{b.phone}</dd></div>
          <div><dt className="text-gray-500">Trip type</dt><dd>{b.tripType}</dd></div>
          <div><dt className="text-gray-500">Travel date and time</dt><dd>{fmtDateTime(b.pickupAt)}</dd></div>
          <div><dt className="text-gray-500">Pickup</dt><dd>{b.pickup}</dd></div>
          <div><dt className="text-gray-500">Destination</dt><dd>{b.destination || "-"}</dd></div>
          <div><dt className="text-gray-500">Passengers</dt><dd>{b.passengers}</dd></div>
          <div><dt className="text-gray-500">Vehicle requested</dt><dd>{b.vehicleName || "Any"}</dd></div>
          {b.notes && <div className="sm:col-span-2"><dt className="text-gray-500">Customer notes</dt><dd>{b.notes}</dd></div>}
          <div><dt className="text-gray-500">Request received</dt><dd>{fmtDateTime(b.createdAt)}</dd></div>
          {b.confirmedAt && <div><dt className="text-gray-500">Confirmed on</dt><dd>{fmtDateTime(b.confirmedAt)}</dd></div>}
        </dl>
      </div>

      {canDecide && (
        <div className="bg-white rounded-2xl border p-5">
          <h2 className="font-bold mb-1">Decide on this request</h2>
          <p className="text-sm text-gray-500 mb-4">Enter the agreed fare. It is saved with this booking and will not change if you edit prices later.</p>
          <form action={confirmBooking} className="grid sm:grid-cols-2 gap-3">
            <input type="hidden" name="id" value={b.id} />
            <Field label="Agreed total fare (₹) *" hint={suggested ? `Your listed fare for this route and vehicle: ${inr(suggested)}` : route ? "Route found, but no fare set for this vehicle" : undefined}>
              <input name="fare" type="number" min="0" required defaultValue={suggested ?? ""} className="form-field" />
            </Field>
            <Field label="Advance received now (₹)">
              <input name="advance" type="number" min="0" className="form-field" placeholder="0" />
            </Field>
            <Field label="Vehicle">
              <select name="vehicleId" defaultValue={b.vehicleId || ""} className="form-field">
                <option value="">Not assigned yet</option>
                {vehicles.map((v) => <option key={v.id} value={v.id}>{v.name} ({v.seats} seats)</option>)}
              </select>
            </Field>
            <Field label="Driver">
              <select name="driverId" className="form-field">
                <option value="">Not assigned yet</option>
                {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}{d.phone ? ` (${d.phone})` : ""}</option>)}
              </select>
            </Field>
            <Field label="Advance payment mode">
              <select name="mode" className="form-field"><option>Cash</option><option>UPI</option><option>Bank transfer</option><option>Card</option></select>
            </Field>
            <div className="sm:col-span-2"><button className="bg-green-600 text-white font-semibold rounded-xl px-6 py-3 w-full sm:w-auto">✔ Confirm booking and create Booking ID</button></div>
          </form>
          <form action={rejectBooking} className="mt-4 pt-4 border-t flex flex-wrap gap-2 items-end">
            <input type="hidden" name="id" value={b.id} />
            <div className="flex-1 min-w-[200px]"><Field label="Reject (optional reason, only you see this)"><input name="reason" className="form-field" /></Field></div>
            <button className="border border-red-300 text-red-700 rounded-xl px-5 py-2.5 text-sm font-semibold">✖ Reject request</button>
          </form>
          {b.status === "NEW" && (
            <form action={setStatus} className="mt-3">
              <input type="hidden" name="id" value={b.id} /><input type="hidden" name="status" value="AWAITING" />
              <button className="text-sm text-gray-600 underline">Mark as “Awaiting Confirmation” (e.g. waiting to hear from the customer)</button>
            </form>
          )}
        </div>
      )}

      {b.status !== "NEW" && b.status !== "AWAITING" && b.status !== "REJECTED" && (
        <div className="bg-white rounded-2xl border p-5">
          <h2 className="font-bold mb-3">Trip details</h2>
          <form action={updateBookingDetails} className="grid sm:grid-cols-2 gap-3">
            <input type="hidden" name="id" value={b.id} />
            <Field label="Vehicle">
              <select name="vehicleId" defaultValue={b.vehicleId || ""} className="form-field">
                <option value="">Not assigned</option>
                {vehicles.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </Field>
            <Field label="Driver">
              <select name="driverId" defaultValue={b.driverId || ""} className="form-field">
                <option value="">Not assigned</option>
                {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}{d.phone ? ` (${d.phone})` : ""}</option>)}
              </select>
            </Field>
            <Field label="Agreed fare (₹)" hint="Changing this edits only this booking.">
              <input name="fare" type="number" min="0" defaultValue={b.agreedFare ?? ""} className="form-field" />
            </Field>
            <Field label="Your private notes"><input name="ownerNotes" defaultValue={b.ownerNotes || ""} className="form-field" /></Field>
            <div className="sm:col-span-2"><button className="btn-primary rounded-xl px-6 py-2.5 text-sm">Save changes</button></div>
          </form>
        </div>
      )}

      {b.driver && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg">🚖</span>
                <h3 className="font-bold text-emerald-950">Driver Assigned: {b.driver.name}</h3>
              </div>
              <p className="text-sm text-emerald-800 mt-0.5">
                {b.driver.phone ? `Phone: +${b.driver.phone}` : "No mobile number on file for this driver"}
              </p>
              <p className="text-xs text-emerald-700 mt-1">
                One-click: opens WhatsApp with pre-filled duty slip (pickup, drop, customer phone, date & vehicle).
              </p>
            </div>
            {b.driver.phone ? (
              <a
                href={waLink(b.driver.phone, renderTemplate(templates.driver_assignment, b, s.businessName))}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white font-semibold px-5 py-3 text-sm shadow hover:bg-emerald-700 shrink-0"
              >
                <span>📲 Send Duty Slip on WhatsApp</span>
              </a>
            ) : (
              <Link href="/admin/vehicles" className="text-xs text-emerald-900 underline font-semibold">
                Add driver phone number in Vehicles & Drivers →
              </Link>
            )}
          </div>
        </div>
      )}

      {b.status === "REJECTED" && b.ownerNotes && <p className="text-sm text-gray-500">Your note: {b.ownerNotes}</p>}

      {b.agreedFare != null && (
        <div className="bg-white rounded-2xl border p-5">
          <h2 className="font-bold mb-3">Payments</h2>
          <div className="grid grid-cols-3 gap-3 text-center mb-4">
            <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-500">Total fare</p><p className="font-bold">{inr(b.agreedFare)}</p></div>
            <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-500">Paid</p><p className="font-bold text-green-700">{inr(paid)}</p></div>
            <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-500">Balance</p><p className={`font-bold ${balanceOf(b) > 0 ? "text-red-600" : "text-green-700"}`}>{inr(balanceOf(b))}</p></div>
          </div>
          <ul className="text-sm divide-y mb-4">
            {b.payments.map((p) => (
              <li key={p.id} className="py-2 flex items-center justify-between gap-2">
                <span>{fmtDateTime(p.paidAt)} · <b>{inr(p.amount)}</b> · {p.mode}{p.note ? ` · ${p.note}` : ""}</span>
                <form action={deletePayment}><input type="hidden" name="id" value={p.id} /><button className="text-xs text-red-600">Remove</button></form>
              </li>
            ))}
            {b.payments.length === 0 && <li className="py-2 text-gray-500">No payments recorded yet.</li>}
          </ul>
          <form action={addPayment} className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-end">
            <input type="hidden" name="id" value={b.id} />
            <Field label="Amount (₹)"><input name="amount" type="number" min="1" required className="form-field" /></Field>
            <Field label="Mode"><select name="mode" className="form-field"><option>Cash</option><option>UPI</option><option>Bank transfer</option><option>Card</option></select></Field>
            <Field label="Note"><input name="note" className="form-field" placeholder="e.g. advance" /></Field>
            <button className="btn-primary rounded-xl py-2.5 text-sm">Add payment</button>
          </form>
        </div>
      )}

      <div id="whatsapp" className="bg-white rounded-2xl border p-5 scroll-mt-20">
        <h2 className="font-bold mb-3">Message the customer on WhatsApp</h2>
        <WhatsAppBox bookingId={b.id} phone={b.phone} messages={messages} labels={TEMPLATE_KEYS} defaultKey={defaultTemplateFor(b.status)} sentLog={sentLog} markSent={markMessageSent} />
      </div>

      <div className="bg-white rounded-2xl border p-5">
        <h2 className="font-bold mb-3">Change status</h2>
        <form action={setStatus} className="flex flex-wrap gap-2">
          <input type="hidden" name="id" value={b.id} />
          <select name="status" defaultValue={b.status} className="form-field !w-auto">
            {Object.entries(STATUS_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <button className="btn-primary rounded-xl px-5 py-2 text-sm">Update status</button>
        </form>
        <p className="text-xs text-gray-500 mt-2">To confirm a request, use the “Decide on this request” form, which asks for the fare and creates the Booking ID.</p>
        {b.flagged && (
          <form action={updateBookingDetails} className="mt-3">
            <input type="hidden" name="id" value={b.id} /><input type="hidden" name="unflag" value="1" />
            <input type="hidden" name="vehicleId" value={b.vehicleId || ""} /><input type="hidden" name="driverId" value={b.driverId || ""} />
            <button className="text-sm underline text-gray-600">This request looks genuine. Remove the warning</button>
          </form>
        )}
      </div>
    </div>
  );
}
