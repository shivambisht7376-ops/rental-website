import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserSession, getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Lets the public pages know whether a customer or admin is logged in.
export async function GET() {
  const [userSession, adminSession] = await Promise.all([
    getUserSession(),
    getSession(),
  ]);

  const user = userSession ? await db.user.findUnique({ where: { id: userSession.sub } }) : null;
  let admin = adminSession ? await db.admin.findUnique({ where: { id: adminSession.sub } }) : null;

  // If user is logged in with owner email (e.g. via Google or customer login), also recognize admin access
  const isOwner = user?.email && (
    user.email.toLowerCase() === "nitinbalaji285@gmail.com" ||
    (process.env.ADMIN_EMAIL && user.email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase())
  );

  if (!admin && isOwner) {
    admin = { email: user.email };
  }

  return NextResponse.json({
    user: user ? { name: user.name, phone: user.phone, email: user.email } : null,
    admin: admin ? { email: admin.email } : null,
  });
}
