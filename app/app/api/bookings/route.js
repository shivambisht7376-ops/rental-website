import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { istDate } from "@/lib/format";
import { hashIp, verifyTurnstile, suspicionReasons, tooManyRequests, findDuplicate } from "@/lib/spam";
import { notifyOwner } from "@/lib/notify";
import { revalidatePath } from "next/cache";

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  tripType: z.enum(["OUTSTATION", "AIRPORT", "LOCAL", "CORPORATE", "PACKAGE"]),
  pickup: z.string().trim().min(2, "Enter pickup location").max(200),
  destination: z.string().trim().min(2, "Enter destination").max(200),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose travel date"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Choose travel time"),
  passengers: z.coerce.number().int().min(1).max(60),
  vehicleId: z.string().optional().or(z.literal("")),
  notes: z.string().max(500).optional(),
  website: z.string().optional(), // honeypot
  startedAt: z.coerce.number().optional(),
  cfToken: z.string().optional(),
});

export async function POST(req) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const d = parsed.data;
  if (d.website) return NextResponse.json({ ok: true, requestNo: 0 }); // bot: pretend success

  if (!(await verifyTurnstile(d.cfToken, ip)))
    return NextResponse.json({ error: "Please complete the verification check." }, { status: 400 });

  const pickupAt = istDate(d.date, d.time);
  if (isNaN(pickupAt) || pickupAt < new Date(Date.now() - 10 * 60 * 1000))
    return NextResponse.json({ error: "Travel date and time must be in the future" }, { status: 400 });

  const phone = "91" + d.phone;
  const ipHash = hashIp(ip);
  if (await tooManyRequests(ipHash, phone))
    return NextResponse.json({ error: "Too many requests. Please call us to book." }, { status: 429 });

  const dup = await findDuplicate(phone, d.pickup, pickupAt);
  if (dup) return NextResponse.json({ ok: true, duplicate: true, requestNo: dup.requestNo });

  const reasons = suspicionReasons({ ...d, pickupAt }, d.startedAt ? Date.now() - d.startedAt : null);
  const vehicle = d.vehicleId ? await db.vehicle.findUnique({ where: { id: d.vehicleId } }) : null;

  const customer = await db.customer.upsert({
    where: { phone },
    update: { name: d.name },
    create: { name: d.name, phone },
  });

  const booking = await db.booking.create({
    data: {
      customerId: customer.id,
      customerName: d.name,
      phone,
      tripType: d.tripType,
      pickup: d.pickup,
      destination: d.destination,
      pickupAt,
      passengers: d.passengers,
      vehicleId: vehicle?.id || null,
      vehicleName: vehicle?.name || null,
      notes: d.notes || null,
      flagged: reasons.length > 0,
      flagReason: reasons.join("; ") || null,
      ipHash,
    },
  });

  notifyOwner(
    `New booking request #${booking.requestNo}${reasons.length ? " (flagged)" : ""}`,
    `${d.name} (${d.phone})\n${d.pickup} to ${d.destination}\n${d.date} ${d.time}, ${d.passengers} passengers\nVehicle: ${vehicle?.name || "any"}${reasons.length ? "\nFlagged: " + reasons.join("; ") : ""}`
  ).catch(() => {});
  revalidatePath("/admin");

  return NextResponse.json({ ok: true, requestNo: booking.requestNo });
}
