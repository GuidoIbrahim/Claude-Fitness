"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { Meal, Targets } from "@/lib/types";
import { addDays, formatDateLong, todayISO } from "@/lib/dates";
import { CalorieRing } from "@/components/CalorieRing";
import { MacroBar } from "@/components/MacroBar";
import { MealCard } from "@/components/MealCard";

export default function TodayPage() {
  return (
    <Suspense>
      <TodayInner />
    </Suspense>
  );
}

function TodayInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [date, setDate] = useState(params.get("date") ?? todayISO());
  const [meals, setMeals] = useState<Meal[]>([]);
  const [targets, setTargets] = useState<Targets | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (d: string) => {
    setLoading(true);
    const [m, p] = await Promise.all([
      fetch(`/api/meals?date=${d}`).then((r) => r.json()),
      fetch("/api/profile").then((r) => r.json()),
    ]);
    setMeals(m.meals);
    setTargets(p.targets);
    setLoading(false);
  }, []);

  useEffect(() => {
    load(date);
  }, [date, load]);

  const sum = (k: "calories" | "protein_g" | "carbs_g" | "fat_g" | "fiber_g") =>
    meals.reduce((a, m) => a + m[k], 0);

  const isToday = date === todayISO();

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <button className="btn btn-secondary px-3 py-2" onClick={() => setDate(addDays(date, -1))} aria-label="Día anterior">
          ‹
        </button>
        <div className="text-center">
          <div className="text-xs uppercase tracking-wide text-muted">{isToday ? "Hoy" : "Día"}</div>
          <div className="font-semibold capitalize">{formatDateLong(date)}</div>
        </div>
        <button
          className="btn btn-secondary px-3 py-2"
          onClick={() => setDate(addDays(date, 1))}
          disabled={isToday}
          aria-label="Día siguiente"
        >
          ›
        </button>
      </header>

      <section className="card p-4">
        {targets ? (
          <>
            <CalorieRing consumed={sum("calories")} target={targets.calories} />
            <div className="mt-4 space-y-3">
              <MacroBar label="Proteína" value={sum("protein_g")} target={targets.protein_g} color="var(--protein)" />
              <MacroBar label="Carbohidratos" value={sum("carbs_g")} target={targets.carbs_g} color="var(--carbs)" />
              <MacroBar label="Grasas" value={sum("fat_g")} target={targets.fat_g} color="var(--fat)" />
            </div>
            <div className="mt-3 text-xs text-muted">
              Objetivo: {targets.daily_delta === 0 ? "mantenimiento" : `${targets.daily_delta > 0 ? "+" : ""}${targets.daily_delta} kcal/día vs. tu gasto`} ·{" "}
              <Link href="/goals" className="text-accent underline">
                cambiar
              </Link>
            </div>
          </>
        ) : (
          <div className="h-32 animate-pulse rounded-xl bg-card-2" />
        )}
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold">Comidas ({meals.length})</h2>
          <Link href={`/log?date=${date}`} className="text-sm text-accent">
            + Agregar
          </Link>
        </div>
        {loading && meals.length === 0 ? (
          <div className="space-y-2">
            <div className="h-20 animate-pulse rounded-2xl bg-card" />
            <div className="h-20 animate-pulse rounded-2xl bg-card" />
          </div>
        ) : meals.length === 0 ? (
          <div className="card p-6 text-center text-muted">
            <div className="mb-2 text-4xl">📷</div>
            Todavía no registraste nada {isToday ? "hoy" : "este día"}.
            <div className="mt-3">
              <Link href={`/log?date=${date}`} className="btn btn-primary">
                Sacar foto del plato
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {meals.map((m) => (
              <MealCard key={m.id} meal={m} onClick={() => router.push(`/meals/${m.id}`)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
