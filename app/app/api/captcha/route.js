import { NextResponse } from "next/server";
import { createMathChallenge } from "@/lib/spam";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(createMathChallenge());
}
