import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const count = await db.booking.count({ where: { status: "NEW" } });
  return NextResponse.json({ count });
}
