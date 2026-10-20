import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Public: images uploaded by the owner are stored in the database and served here.
export async function GET(_req, { params }) {
  const img = await db.image.findUnique({ where: { id: params.id } });
  if (!img) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(img.data, {
    headers: { "Content-Type": img.mime, "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
