import crypto from "crypto";
import { db } from "./db";

export const hashIp = (ip) =>
  crypto.createHash("sha256").update(ip + (process.env.AUTH_SECRET || "cab-salt-secret")).digest("hex").slice(0, 32);

export async function verifyTurnstile(token, ip) {
  const secret = process.env.TURNSTILE_SECRET;
  if (!secret) return true; // CAPTCHA not configured
  if (!token) return false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
    });
    return !!(await res.json()).success;
  } catch {
    return false;
  }
}

// Cleans input strings by removing raw HTML tags
export function sanitizeText(str) {
  if (!str || typeof str !== "string") return "";
  return str.replace(/<[^>]*>/g, "").trim();
}

// Returns an array of human-readable reasons a request looks suspicious.
export function suspicionReasons(d, fillMs) {
  const r = [];
  if (fillMs != null && fillMs < 3500) r.push("Form filled unnaturally fast (<3.5s)");
  if (/^(\d)\1{9}$/.test(d.phone)) r.push("Phone number is one repeated digit");
  if (/0123456789|1234567890|9876543210/.test(d.phone)) r.push("Phone number is an obvious sequence");
  if (/^\d+$/.test(d.name) || /(.)\1{4,}/.test(d.name)) r.push("Name looks fake or machine-generated");
  if (d.destination && d.pickup.trim().toLowerCase() === d.destination.trim().toLowerCase()) r.push("Pickup and destination are identical");
  if (/https?:\/\/|www\./i.test(`${d.notes || ""} ${d.pickup} ${d.destination || ""}`)) r.push("Contains an external link");
  if (/<[a-z][\s\S]*>/i.test(`${d.name} ${d.pickup} ${d.destination || ""} ${d.notes || ""}`)) r.push("Contains HTML or code snippets");
  if (/\b(viagra|cialis|casino|crypto|forex|bitcoin|fast cash|seo ranking|backlink)\b/i.test(`${d.notes || ""} ${d.name}`)) {
    r.push("Contains marketing/spam keywords");
  }
  if (d.pickupAt > new Date(Date.now() + 365 * 86400000)) r.push("Travel date is more than a year away");
  return r;
}

export async function tooManyRequests(ipHash, phone) {
  const hour = new Date(Date.now() - 3600 * 1000);
  const day = new Date(Date.now() - 24 * 3600 * 1000);
  const [byIp, byPhone] = await Promise.all([
    db.booking.count({ where: { ipHash, createdAt: { gte: hour } } }),
    db.booking.count({ where: { phone, createdAt: { gte: day } } }),
  ]);
  return byIp >= 5 || byPhone >= 5;
}

export async function findDuplicate(phone, pickup, pickupAt) {
  const day = new Date(Date.now() - 24 * 3600 * 1000);
  return db.booking.findFirst({
    where: {
      phone,
      createdAt: { gte: day },
      pickup: { equals: pickup.trim(), mode: "insensitive" },
      pickupAt: { gte: new Date(pickupAt.getTime() - 6 * 3600 * 1000), lte: new Date(pickupAt.getTime() + 6 * 3600 * 1000) },
    },
  });
}
