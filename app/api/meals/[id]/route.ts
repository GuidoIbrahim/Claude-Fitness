import { NextResponse } from "next/server";
import { deleteMeal, getMeal, updateMeal } from "@/lib/db";
import { MealBodySchema } from "@/lib/schemas";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const meal = getMeal(Number(id));
  return meal ? NextResponse.json({ meal }) : NextResponse.json({ error: "No existe" }, { status: 404 });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const parsed = MealBodySchema.partial().safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", issues: parsed.error.issues }, { status: 400 });
  }
  const meal = updateMeal(Number(id), parsed.data);
  return meal ? NextResponse.json({ meal }) : NextResponse.json({ error: "No existe" }, { status: 404 });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const ok = deleteMeal(Number(id));
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "No existe" }, { status: 404 });
}
