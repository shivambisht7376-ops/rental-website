import { NextResponse } from "next/server";
import { verifyToken, COOKIE } from "@/lib/auth";

const OPEN = ["/admin/login", "/admin/signup", "/admin/forgot", "/admin/reset"];

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  if (OPEN.includes(pathname) || pathname === "/api/admin/login" || pathname === "/api/admin/logout") return NextResponse.next();
  const t = req.cookies.get(COOKIE)?.value;
  const p = t ? await verifyToken(t) : null;
  if (!p || p.role !== "admin") {
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };
