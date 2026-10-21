import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET || "dev-secret-change-me");
export const COOKIE = "admin_session"; // owner session
export const USER_COOKIE = "user_session"; // customer session

async function sign(sub, role, days) {
  return new SignJWT({ sub, role })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${days}d`)
    .sign(secret());
}

const cookieOpts = (days) => ({
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * days,
});

export async function createSession(adminId) {
  cookies().set(COOKIE, await sign(adminId, "admin", 7), cookieOpts(7));
}

export async function createUserSession(userId) {
  cookies().set(USER_COOKIE, await sign(userId, "user", 30), cookieOpts(30));
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload;
  } catch {
    return null;
  }
}

// Admin session. A customer token can never pass: the role must be "admin".
export async function getSession() {
  const t = cookies().get(COOKIE)?.value;
  const p = t ? await verifyToken(t) : null;
  return p && p.role === "admin" ? p : null;
}

export async function getUserSession() {
  const t = cookies().get(USER_COOKIE)?.value;
  const p = t ? await verifyToken(t) : null;
  return p && p.role === "user" ? p : null;
}

export async function requireAdmin() {
  const s = await getSession();
  if (!s) throw new Response("Unauthorized", { status: 401 });
  return s;
}
