import { NextResponse } from "next/server";
import { insertMeal, listMeals } from "@/lib/db";
import { todayISO, nowHHMM } from "@/lib/dates";
import { MealBodySchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const date = url.searchParams.get("date") ?? todayISO();
  return NextResponse.json({ meals: listMeals(date) });
}

export async function POST(req: Request) {
  const parsed = MealBodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", issues: parsed.error.issues }, { status: 400 });
  }
  const b = parsed.data;
  const meal = insertMeal({ ...b, date: b.date ?? todayISO(), time: b.time ?? nowHHMM() });
  return NextResponse.json({ meal }, { status: 201 });
}
