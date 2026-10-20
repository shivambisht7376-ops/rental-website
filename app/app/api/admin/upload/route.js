import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Admin-only (middleware protects /api/admin/*). The browser resizes images first.
export async function POST(req) {
  const form = await req.formData();
  const file = form.get("file");
  if (!file || typeof file === "string") return NextResponse.json({ error: "No file" }, { status: 400 });
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    return NextResponse.json({ error: "Use a JPG, PNG or WebP photo" }, { status: 400 });
  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length > 1_500_000) return NextResponse.json({ error: "Photo is too large" }, { status: 400 });
  const img = await db.image.create({ data: { mime: file.type, data: buf } });
  return NextResponse.json({ url: `/api/img/${img.id}` });
}
