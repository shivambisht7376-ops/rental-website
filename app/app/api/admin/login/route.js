import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";

export async function POST(req) {
  const { email, password } = await req.json().catch(() => ({}));
  const admin = email && (await db.admin.findUnique({ where: { email: String(email).toLowerCase() } }));
  if (!admin || !(await bcrypt.compare(password || "", admin.passwordHash)))
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  await createSession(admin.id);
  return NextResponse.json({ ok: true });
}

