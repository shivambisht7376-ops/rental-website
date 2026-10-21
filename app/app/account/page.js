import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getUserSession } from "@/lib/auth";
import { STATUS_LABEL, STATUS_COLOR, fmtDateTime, inr, paidTotal } from "@/lib/format";
import { userLogout } from "../auth-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "My bookings" };

export default async function Account() {
  const sess = await getUserSession();
  if (!sess) redirect("/login");
  const user = await db.user.findUnique({ where: { id: sess.sub } });
  if (!user) redirect("/login");

  // Bookings made while logged in, plus earlier ones on the same phone number.
  const phone = user.phone ? "91" + user.phone : null;
  const bookings = await db.booking.findMany({
    where: { OR: [{ userId: user.id }, ...(phone ? [{ phone }] : [])] },
    orderBy: { createdAt: "desc" },
    include: { payments: true },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="font-bold text-[#c41e5b]">← Website</Link>
          <form action={userLogout}><button className="text-sm text-gray-500">Log out</button></form>
        </div>
      </header>
      <main className="max-w-3xl mx-auto p-4 sm:p-6 space-y-5">
        <div>
          <h1 className="text-2xl font-bold">Hello, {user.name}</h1>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
        <Link href="/#book" className="btn-primary inline-block rounded-xl px-6 py-3 text-sm">Book a new ride</Link>
        <h2 className="font-bold">My bookings</h2>
        {bookings.length === 0 && <div className="bg-white border border-dashed rounded-2xl p-8 text-center text-sm text-gray-500">You have no bookings yet.</div>}
        <div className="space-y-3">
          {bookings.map((b) => (
            <div key={b.id} className="bg-white rounded-2xl border p-4">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLOR[b.status]}`}>{STATUS_LABEL[b.status]}</span>
                <b>{b.bookingId || `Request #${b.requestNo}`}</b>
              </div>
              <p className="text-sm">{b.pickup} → {b.destination}</p>
              <p className="text-sm text-gray-500">{fmtDateTime(b.pickupAt)} · {b.passengers} passengers{b.vehicleName ? ` · ${b.vehicleName}` : ""}</p>
              {b.agreedFare != null && <p className="text-sm mt-1">Fare {inr(b.agreedFare)} · Paid {inr(paidTotal(b))} · Balance {inr(b.agreedFare - paidTotal(b))}</p>}
              {["NEW", "AWAITING"].includes(b.status) && <p className="text-xs text-amber-700 mt-1">Awaiting confirmation from our team.</p>}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
