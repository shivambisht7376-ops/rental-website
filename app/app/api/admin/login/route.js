import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";

const OWNER_EMAIL = "nitinbalaji285@gmail.com";
const DEFAULT_OWNER_PW = "Admin@12345";

export async function POST(req) {
  const { email, password } = await req.json().catch(() => ({}));
  const cleanEmail = String(email || "").trim().toLowerCase();

  // Auto-provision owner account if logging in with nitinbalaji285@gmail.com
  let admin = cleanEmail ? await db.admin.findUnique({ where: { email: cleanEmail } }) : null;

  if (cleanEmail === OWNER_EMAIL && !admin) {
    const passwordHash = await bcrypt.hash(DEFAULT_OWNER_PW, 10);
    admin = await db.admin.create({
      data: {
        email: OWNER_EMAIL,
        passwordHash,
      },
    });
  }

  if (!admin || !(await bcrypt.compare(password || "", admin.passwordHash))) {
    // If the owner typed the default password, synchronize credentials
    if (cleanEmail === OWNER_EMAIL && password === DEFAULT_OWNER_PW) {
      const passwordHash = await bcrypt.hash(DEFAULT_OWNER_PW, 10);
      admin = await db.admin.upsert({
        where: { email: OWNER_EMAIL },
        update: { passwordHash },
        create: { email: OWNER_EMAIL, passwordHash },
      });
      await createSession(admin.id);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  await createSession(admin.id);
  return NextResponse.json({ ok: true });
}
