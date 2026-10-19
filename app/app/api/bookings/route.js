import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { sendConfirmation } from "@/lib/whatsapp";

const schema = z.object({
  name: z.string().min(2).max(80),
  phone: z.string().regex(/^\d{10}$/, "Enter 10-digit mobile number"),
  tripType: z.enum(["OUTSTATION", "AIRPORT", "LOCAL", "CORPORATE", "PACKAGE"]),
  pickup: z.string().min(2).max(200),
  drop: z.string().max(200).optional().or(z.literal("")),
  pickupAt: z.string().refine((v) => !isNaN(Date.parse(v)), "Invalid date"),
  passengers: z.coerce.number().int().min(1).max(60).default(1),
  vehicleId: z.string().optional().or(z.literal("")),
  notes: z.string().max(500).optional(),
  website: z.string().optional(), // honeypot
});

// Tiny in-memory rate limit (per instance); enough to blunt casual spam at this scale.
const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > 5;
}

export async function POST(req) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "local";
  if (limited(ip)) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const d = parsed.data;
  if (d.website) return NextResponse.json({ ok: true }); // bot

  const pickupAt = new Date(d.pickupAt);
  if (pickupAt < new Date(Date.now() - 5 * 60 * 1000))
    return NextResponse.json({ error: "Pickup time is in the past" }, { status: 400 });

  const ref = "CC" + Math.random().toString(36).slice(2, 8).toUpperCase();
  const booking = await db.booking.create({
    data: {
      ref,
      name: d.name,
      phone: "91" + d.phone,
      tripType: d.tripType,
      pickup: d.pickup,
      drop: d.drop || null,
      pickupAt,
      passengers: d.passengers,
      vehicleId: d.vehicleId || null,
      notes: d.notes || null,
    },
  });

  // Fire the WhatsApp confirmation; failure must not fail the booking.
  sendConfirmation(booking).catch((e) => console.error("confirm failed", e));

  return NextResponse.json({ ok: true, ref });
}
