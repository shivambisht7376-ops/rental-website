import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Lets the (cached) public pages know whether a customer is logged in.
export async function GET() {
  const s = await getUserSession();
  const user = s ? await db.user.findUnique({ where: { id: s.sub } }) : null;
  return NextResponse.json({ user: user ? { name: user.name, phone: user.phone } : null });
}
