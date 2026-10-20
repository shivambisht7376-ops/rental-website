"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { sendEmail } from "@/lib/notify";

const s = (fd, k) => (fd.get(k) ?? "").toString().trim();
const n = (fd, k) => (s(fd, k) === "" ? null : Math.round(Number(s(fd, k))));
const pub = () => { revalidatePath("/"); };

async function guard() {
  try { await requireAdmin(); } catch { redirect("/admin/login"); }
}

/* ───────── Bookings ───────── */

// Booking ID is created ONLY here, when the owner confirms.
export async function confirmBooking(fd) {
  await guard();
  const id = s(fd, "id");
  const fare = n(fd, "fare");
  if (fare == null || fare < 0) return;
  const b = await db.booking.findUnique({ where: { id }, include: { vehicle: true } });
  if (!b) return;

  const vehicleId = s(fd, "vehicleId") || b.vehicleId;
  const vehicle = vehicleId ? await db.vehicle.findUnique({ where: { id: vehicleId } }) : null;
  const base = {
    status: "CONFIRMED",
    agreedFare: fare, // snapshot: never recalculated from live prices
    vehicleId: vehicle?.id || null,
    vehicleName: vehicle?.name || b.vehicleName,
    driverId: s(fd, "driverId") || null,
    confirmedAt: new Date(),
  };

  if (b.bookingId) {
    await db.booking.update({ where: { id }, data: base });
  } else {
    for (let i = 0; i < 5; i++) {
      const max = await db.booking.aggregate({ _max: { bookingNo: true } });
      const no = (max._max.bookingNo || 0) + 1;
      try {
        await db.booking.update({
          where: { id },
          data: { ...base, bookingNo: no, bookingId: "CB-" + String(no).padStart(4, "0") },
        });
        break;
      } catch (e) {
        if (e.code !== "P2002" || i === 4) throw e; // retry on ID collision
      }
    }
  }
  const adv = n(fd, "advance");
  if (adv > 0) await db.payment.create({ data: { bookingId: id, amount: adv, mode: s(fd, "mode") || "Cash", note: "Advance at confirmation" } });
  revalidatePath("/admin", "layout");
  redirect(`/admin/bookings/${id}`);
}

export async function rejectBooking(fd) {
  await guard();
  const id = s(fd, "id");
  await db.booking.update({ where: { id }, data: { status: "REJECTED", ownerNotes: s(fd, "reason") || undefined } });
  revalidatePath("/admin", "layout");
  redirect(`/admin/bookings/${id}`);
}

export async function setStatus(fd) {
  await guard();
  const id = s(fd, "id");
  const status = s(fd, "status");
  if (status === "CONFIRMED") redirect(`/admin/bookings/${id}`); // must use the confirm form so an ID and fare exist
  await db.booking.update({ where: { id }, data: { status } });
  revalidatePath("/admin", "layout");
}

export async function updateBookingDetails(fd) {
  await guard();
  const id = s(fd, "id");
  const b = await db.booking.findUnique({ where: { id } });
  const vehicleId = s(fd, "vehicleId") || null;
  const vehicle = vehicleId ? await db.vehicle.findUnique({ where: { id: vehicleId } }) : null;
  const data = {
    driverId: s(fd, "driverId") || null,
    vehicleId,
    vehicleName: vehicle ? vehicle.name : b.vehicleName,
    ownerNotes: fd.has("ownerNotes") ? s(fd, "ownerNotes") || null : undefined,
    flagged: fd.get("unflag") ? false : b.flagged,
  };
  const fare = n(fd, "fare");
  if (fare != null && b.status === "CONFIRMED") data.agreedFare = fare;
  await db.booking.update({ where: { id }, data });
  revalidatePath(`/admin/bookings/${id}`);
}

export async function addPayment(fd) {
  await guard();
  const bookingId = s(fd, "id");
  const amount = n(fd, "amount");
  if (!amount || amount <= 0) return;
  await db.payment.create({ data: { bookingId, amount, mode: s(fd, "mode") || "Cash", note: s(fd, "note") || null } });
  revalidatePath("/admin", "layout");
}

export async function deletePayment(fd) {
  await guard();
  await db.payment.delete({ where: { id: s(fd, "id") } });
  revalidatePath("/admin", "layout");
}

export async function markMessageSent(fd) {
  await guard();
  await db.messageLog.create({ data: { bookingId: s(fd, "id"), template: s(fd, "template") } });
  revalidatePath(`/admin/bookings/${s(fd, "id")}`);
}

/* ───────── Customers ───────── */

export async function saveCustomer(fd) {
  await guard();
  await db.customer.update({ where: { id: s(fd, "id") }, data: { name: s(fd, "name"), notes: s(fd, "notes") || null } });
  revalidatePath("/admin", "layout");
}

/* ───────── Vehicles & drivers ───────── */

export async function saveVehicle(fd) {
  await guard();
  const id = s(fd, "id");
  const data = {
    name: s(fd, "name"),
    category: s(fd, "category") || "Sedan",
    seats: n(fd, "seats") || 4,
    ac: s(fd, "ac") === "yes",
    specs: s(fd, "specs") || null,
    perKm: n(fd, "perKm") || 0,
    hourly8: n(fd, "hourly8") || 0,
    extraKm: n(fd, "extraKm") || 0,
    waitingPerHr: n(fd, "waitingPerHr") || 0,
    nightCharge: n(fd, "nightCharge") || 0,
    imageUrl: s(fd, "imageUrl") || null,
    active: s(fd, "active") !== "no",
  };
  if (!data.name) return;
  if (id) await db.vehicle.update({ where: { id }, data });
  else await db.vehicle.create({ data });
  revalidatePath("/admin/vehicles"); pub();
}

export async function deleteVehicle(fd) {
  await guard();
  const id = s(fd, "id");
  const used = await db.booking.count({ where: { vehicleId: id } });
  if (used) await db.vehicle.update({ where: { id }, data: { active: false } }); // keep history intact
  else await db.vehicle.delete({ where: { id } });
  revalidatePath("/admin/vehicles"); pub();
}

export async function saveDriver(fd) {
  await guard();
  const id = s(fd, "id");
  const data = { name: s(fd, "name"), phone: s(fd, "phone") || null };
  if (!data.name) return;
  if (id) await db.driver.update({ where: { id }, data });
  else await db.driver.create({ data });
  revalidatePath("/admin/vehicles");
}

export async function deleteDriver(fd) {
  await guard();
  const id = s(fd, "id");
  const used = await db.booking.count({ where: { driverId: id } });
  if (used) await db.driver.update({ where: { id }, data: { active: false } });
  else await db.driver.delete({ where: { id } });
  revalidatePath("/admin/vehicles");
}

/* ───────── Routes & fares ───────── */

export async function saveRoute(fd) {
  await guard();
  const id = s(fd, "id");
  const data = { from: s(fd, "from"), to: s(fd, "to"), distanceKm: n(fd, "distanceKm"), note: s(fd, "note") || null, active: s(fd, "active") !== "no" };
  if (!data.from || !data.to) return;
  const route = id ? await db.route.update({ where: { id }, data }) : await db.route.create({ data });
  const vehicles = await db.vehicle.findMany();
  for (const v of vehicles) {
    const fare = n(fd, "fare_" + v.id);
    if (fare == null) await db.routeFare.deleteMany({ where: { routeId: route.id, vehicleId: v.id } });
    else
      await db.routeFare.upsert({
        where: { routeId_vehicleId: { routeId: route.id, vehicleId: v.id } },
        update: { fare },
        create: { routeId: route.id, vehicleId: v.id, fare },
      });
  }
  revalidatePath("/admin/routes"); pub();
}

export async function deleteRoute(fd) {
  await guard();
  await db.route.delete({ where: { id: s(fd, "id") } });
  revalidatePath("/admin/routes"); pub();
}

/* ───────── Packages ───────── */

export async function savePackage(fd) {
  await guard();
  const id = s(fd, "id");
  const data = {
    title: s(fd, "title"),
    summary: s(fd, "summary"),
    itinerary: s(fd, "itinerary") || null,
    duration: s(fd, "duration") || null,
    priceFrom: n(fd, "priceFrom") || 0,
    imageUrl: s(fd, "imageUrl") || null,
    published: s(fd, "published") !== "no",
  };
  if (!data.title) return;
  if (id) await db.package.update({ where: { id }, data });
  else await db.package.create({ data });
  revalidatePath("/admin/packages"); pub();
}

export async function deletePackage(fd) {
  await guard();
  await db.package.delete({ where: { id: s(fd, "id") } });
  revalidatePath("/admin/packages"); pub();
}

/* ───────── Website settings & message templates ───────── */

const SETTING_KEYS = ["businessName", "tagline", "heroText", "bannerImage", "bannerNotice", "phone", "whatsapp", "email", "address"];

export async function saveSettings(fd) {
  await guard();
  for (const k of SETTING_KEYS) {
    let v = s(fd, k);
    if (k === "phone" || k === "whatsapp") v = v.replace(/\D/g, "").replace(/^(\d{10})$/, "91$1");
    await db.setting.upsert({ where: { key: k }, update: { value: v }, create: { key: k, value: v } });
  }
  revalidatePath("/admin/settings"); pub();
}

export async function saveTemplate(fd) {
  await guard();
  const key = s(fd, "key");
  if (fd.get("reset")) await db.messageTemplate.deleteMany({ where: { key } });
  else await db.messageTemplate.upsert({ where: { key }, update: { body: s(fd, "body") }, create: { key, body: s(fd, "body") } });
  revalidatePath("/admin/settings");
}

export async function changePassword(fd) {
  await guard();
  const pw = s(fd, "password");
  if (pw.length < 8 || pw !== s(fd, "confirm")) return;
  const { getSession } = await import("@/lib/auth");
  const sess = await getSession();
  await db.admin.update({ where: { id: sess.sub }, data: { passwordHash: await bcrypt.hash(pw, 10) } });
  revalidatePath("/admin/settings");
}

/* ───────── Password recovery (public pages) ───────── */

export async function requestReset(fd) {
  const email = s(fd, "email").toLowerCase();
  const admin = await db.admin.findUnique({ where: { email } });
  if (admin) {
    const token = crypto.randomBytes(32).toString("hex");
    await db.admin.update({
      where: { id: admin.id },
      data: { resetTokenHash: crypto.createHash("sha256").update(token).digest("hex"), resetExpires: new Date(Date.now() + 3600 * 1000) },
    });
    const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    await sendEmail(admin.email, "Reset your admin password", `Open this link within 1 hour to set a new password:\n${base}/admin/reset?token=${token}`);
  }
  redirect("/admin/forgot?sent=1"); // same response whether or not the email exists
}

export async function resetPassword(fd) {
  const token = s(fd, "token");
  const pw = s(fd, "password");
  if (pw.length < 8 || pw !== s(fd, "confirm")) redirect(`/admin/reset?token=${token}&error=1`);
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  const admin = await db.admin.findFirst({ where: { resetTokenHash: hash, resetExpires: { gt: new Date() } } });
  if (!admin) redirect("/admin/forgot?expired=1");
  await db.admin.update({ where: { id: admin.id }, data: { passwordHash: await bcrypt.hash(pw, 10), resetTokenHash: null, resetExpires: null } });
  redirect("/admin/login?reset=1");
}
