import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendReminder } from "@/lib/whatsapp";

// Hit every 15-60 min by Vercel Cron or an external scheduler (cron-job.org).
// Sends a reminder once for trips starting within the next 24h.
export async function GET(req) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const now = new Date();
  const due = await db.booking.findMany({
    where: {
      reminderSentAt: null,
      status: { in: ["PENDING", "CONFIRMED", "ASSIGNED"] },
      pickupAt: { gt: now, lte: new Date(now.getTime() + 24 * 3600 * 1000) },
    },
    take: 100,
  });
  let sent = 0;
  for (const b of due) {
    const r = await sendReminder(b);
    if (r.ok) sent++;
  }
  return NextResponse.json({ due: due.length, sent });
}
