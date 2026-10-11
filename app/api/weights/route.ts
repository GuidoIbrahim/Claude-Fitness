import { NextResponse } from "next/server";
import { z } from "zod";
import { deleteWeight, listWeights, upsertWeight } from "@/lib/db";
import { weightTrend } from "@/lib/nutrition";

export const runtime = "nodejs";

export async function GET() {
  const entries = listWeights();
  return NextResponse.json({ weights: weightTrend(entries) });
}

const Body = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), kg: z.number().min(20).max(400) });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  upsertWeight(parsed.data.date, parsed.data.kg);
  return NextResponse.json({ weights: weightTrend(listWeights()) });
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const date = url.searchParams.get("date");
  if (!date) return NextResponse.json({ error: "Falta date" }, { status: 400 });
  deleteWeight(date);
  return NextResponse.json({ weights: weightTrend(listWeights()) });
}
