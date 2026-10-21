import { NextResponse } from "next/server";
import crypto from "crypto";

// Starts Google sign-in. ?role=user (customers) or ?role=admin (owner).
export async function GET(req) {
  const url = new URL(req.url);
  const role = url.searchParams.get("role") === "admin" ? "admin" : "user";
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const back = role === "admin" ? "/admin/login" : "/login";
  if (!clientId) return NextResponse.redirect(new URL(`${back}?error=google_not_configured`, url.origin));

  const state = crypto.randomBytes(16).toString("hex");
  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL || url.origin}/api/auth/google/callback`;
  const g = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  g.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  }).toString();

  const res = NextResponse.redirect(g);
  res.cookies.set("g_state", `${state}.${role}`, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 600 });
  return res;
}
