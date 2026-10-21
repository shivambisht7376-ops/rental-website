import Link from "next/link";
import { STATUS_LABEL, STATUS_COLOR, fmtDateTime, inr, paidTotal } from "@/lib/format";

export const Badge = ({ status }) => (
  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLOR[status]}`}>{STATUS_LABEL[status]}</span>
);

export const PageTitle = ({ title, hint, children }) => (
  <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1 className="text-2xl font-bold">{title}</h1>
      {hint && <p className="text-sm text-gray-500 mt-1 max-w-2xl">{hint}</p>}
    </div>
    <div className="flex gap-2">{children}</div>
  </div>
);

export const Empty = ({ children }) => (
  <div className="bg-white border border-dashed rounded-2xl p-8 text-center text-gray-500 text-sm">{children}</div>
);

export const Field = ({ label, children, hint }) => (
  <label className="block">
    <span className="block text-xs font-semibold text-gray-600 mb-1">{label}</span>
    {children}
    {hint && <span className="block text-[11px] text-gray-400 mt-1">{hint}</span>}
  </label>
);

// One booking, shown as a card. Used by most dashboard lists.
export function BookingCard({ b, templates, business, showMoney }) {
  const paid = paidTotal(b);
  return (
    <div className="bg-white rounded-2xl border p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <Badge status={b.status} />
          <b>{b.bookingId || `Request #${b.requestNo}`}</b>
          {b.flagged && <span title={b.flagReason} className="text-xs bg-orange-100 text-orange-800 rounded-full px-2 py-0.5">⚠ Check</span>}
        </div>
        <p className="font-semibold">{b.customerName} <span className="text-gray-400 font-normal">· +{b.phone}</span></p>
        <p className="text-sm text-gray-600">{b.pickup}{b.destination ? ` → ${b.destination}` : ""}</p>
        <p className="text-sm text-gray-500">{fmtDateTime(b.pickupAt)} · {b.passengers} passengers{b.vehicleName ? ` · ${b.vehicleName}` : ""}</p>
        {showMoney && b.agreedFare != null && (
          <p className="text-sm mt-1">Fare {inr(b.agreedFare)} · Paid {inr(paid)} · <b className={b.agreedFare - paid > 0 ? "text-red-600" : "text-green-700"}>Balance {inr(b.agreedFare - paid)}</b></p>
        )}
      </div>
      <div className="flex gap-2 shrink-0">
        <Link href={`/admin/bookings/${b.id}#whatsapp`} className="rounded-xl bg-green-600 text-white text-sm font-semibold px-4 py-2 hover:bg-green-700">WhatsApp</Link>
        <Link href={`/admin/bookings/${b.id}`} className="btn-primary rounded-xl text-sm px-4 py-2">Open</Link>
      </div>
    </div>
  );
}
