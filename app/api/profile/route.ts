import { NextResponse } from "next/server";
import { z } from "zod";
import { getProfile, saveProfile } from "@/lib/db";
import { computeTargets } from "@/lib/nutrition";

export const runtime = "nodejs";

export async function GET() {
  const profile = getProfile();
  return NextResponse.json({ profile, targets: computeTargets(profile) });
}

const Body = z.object({
  sex: z.enum(["male", "female"]),
  age: z.number().int().min(10).max(100),
  height_cm: z.number().min(100).max(250),
  weight_kg: z.number().min(30).max(300),
  activity: z.number().min(1.1).max(2.2),
  goal_type: z.enum(["deficit", "maintain", "surplus"]),
  weekly_change_kg: z.number().min(0).max(1.5),
  protein_g_per_kg: z.number().min(0.8).max(3.5),
  fat_pct: z.number().min(0.15).max(0.5),
  calorie_override: z.number().min(800).max(6000).nullable(),
});

export async function PUT(req: Request) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", issues: parsed.error.issues }, { status: 400 });
  }
  const profile = saveProfile(parsed.data);
  return NextResponse.json({ profile, targets: computeTargets(profile) });
}
