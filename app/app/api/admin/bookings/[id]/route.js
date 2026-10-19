import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { sendConfirmation, sendReminder } from "@/lib/whatsapp";

export async function PATCH(req, { params }) {
  try { await requireAdmin(); } catch (r) { return r; }
  const body = await req.json();
  const { action, ...fields } = body;

  const allowed = {};
  for (const k of ["status", "quote", "driverName", "driverPhone", "vehicleId", "notes"]) {
    if (k in fields) allowed[k] = fields[k] === "" ? null : fields[k];
  }
  if (allowed.quote != null) allowed.quote = Number(allowed.quote);

  const booking = await db.booking.update({ where: { id: params.id }, data: allowed });

  if (action === "resend_confirmation") await sendConfirmation(booking);
  if (action === "send_reminder") await sendReminder(booking);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req, { params }) {
  try { await requireAdmin(); } catch (r) { return r; }
  await db.booking.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
