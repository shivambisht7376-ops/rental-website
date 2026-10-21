import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { createSession, createUserSession } from "@/lib/auth";

export async function GET(req) {
  const url = new URL(req.url);
  const origin = process.env.NEXT_PUBLIC_SITE_URL || url.origin;
  const cookie = req.cookies.get("g_state")?.value || "";
  const [savedState, role] = cookie.split(".");
  const back = role === "admin" ? "/admin/login" : "/login";
  const fail = (code) => {
    const r = NextResponse.redirect(new URL(`${back}?error=${code}`, origin));
    r.cookies.delete("g_state");
    return r;
  };

  // CSRF check: the state Google returns must match the one we stored.
  if (!savedState || url.searchParams.get("state") !== savedState) return fail("google_failed");
  const code = url.searchParams.get("code");
  if (!code) return fail("google_failed");

  let info;
  try {
    const tok = await (await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${origin}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    })).json();
    if (!tok.access_token) return fail("google_failed");
    info = await (await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${tok.access_token}` },
    })).json();
  } catch {
    return fail("google_failed");
  }
  if (!info?.email || !info.email_verified) return fail("google_unverified");
  const email = info.email.toLowerCase();

  if (role === "admin") {
    // Only the owner: an existing admin, or an email listed in ADMIN_EMAILS.
    const allowed = (process.env.ADMIN_EMAILS || "").toLowerCase().split(",").map((e) => e.trim()).filter(Boolean);
    let admin = await db.admin.findUnique({ where: { email } });
    if (!admin && !allowed.includes(email)) return fail("not_admin");
    if (!admin) {
      admin = await db.admin.create({ data: { email, googleId: info.sub, passwordHash: await bcryptRandom() } });
    } else if (!admin.googleId) {
      await db.admin.update({ where: { id: admin.id }, data: { googleId: info.sub } });
    }
    await createSession(admin.id);
    const r = NextResponse.redirect(new URL("/admin", origin));
    r.cookies.delete("g_state");
    return r;
  }

  let user = await db.user.findUnique({ where: { email } });
  if (!user) user = await db.user.create({ data: { email, name: info.name || email.split("@")[0], googleId: info.sub } });
  else if (!user.googleId) await db.user.update({ where: { id: user.id }, data: { googleId: info.sub } });
  await createUserSession(user.id);
  const r = NextResponse.redirect(new URL("/account", origin));
  r.cookies.delete("g_state");
  return r;
}

// Google-only accounts get an unusable random password hash.
async function bcryptRandom() {
  const bcrypt = (await import("bcryptjs")).default;
  return bcrypt.hash(crypto.randomBytes(24).toString("hex"), 10);
}
