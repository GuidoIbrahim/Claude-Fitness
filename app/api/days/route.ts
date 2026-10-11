import { NextResponse } from "next/server";
import { daySummaries, getProfile } from "@/lib/db";
import { computeTargets } from "@/lib/nutrition";
import { addDays, todayISO } from "@/lib/dates";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const to = url.searchParams.get("to") ?? todayISO();
  const from = url.searchParams.get("from") ?? addDays(to, -29);
  const days = daySummaries(from, to);
  const targets = computeTargets(getProfile());
  return NextResponse.json({ from, to, days, targets });
}
