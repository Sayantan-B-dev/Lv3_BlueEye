import { NextResponse } from "next/server";
import { checkCooldown } from "@/lib/auth/cooldown";

export async function GET() {
  const result = await checkCooldown();
  return NextResponse.json(result);
}
