"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { DaySummary, Targets } from "@/lib/types";
import { addDays, formatDateLong, todayISO } from "@/lib/dates";
import { CaloriesChart } from "@/components/charts";

const ranges = [
  { days: 7, label: "7 días" },
  { days: 30, label: "30 días" },
  { days: 90, label: "90 días" },
];

export default function HistoryPage() {
  const [range, setRange] = useState(30);
  const [days, setDays] = useState<DaySummary[]>([]);
  const [targets, setTargets] = useState<Targets | null>(null);

  useEffect(() => {
    const to = todayISO();
    const from = addDays(to, -(range - 1));
    fetch(`/api/days?from=${from}&to=${to}`)
      .then((r) => r.json())
      .then((d) => {
        setDays(d.days);
        setTargets(d.targets);
      });
  }, [range]);

  // Serie continua: días sin registro quedan en 0 para que el eje sea regular.
  const to = todayISO();
  const series = Array.from({ length: range }, (_, i) => {
    const date = addDays(to, -(range - 1 - i));
    const d = days.find((x) => x.date === date);
    return { date, calories: d?.calories ?? 0 };
  });

  const logged = days.filter((d) => d.calories > 0);
  const avg = (k: keyof DaySummary) => (logged.length ? Math.round(logged.reduce((a, d) => a + Number(d[k]), 0) / logged.length) : 0);
  const avgCal = avg("calories");
  const deltaVsTdee = targets ? avgCal - targets.tdee : 0;
  // Proyección de cambio de peso semanal a partir del balance calórico promedio.
  const weeklyKg = (deltaVsTdee * 7) / 7700;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Historial</h1>

      <div className="flex rounded-xl bg-card-2 p-1 text-sm">
        {ranges.map((r) => (
          <button key={r.days} onClick={() => setRange(r.days)} className={`flex-1 rounded-lg py-2 font-medium ${range === r.days ? "bg-card text-text shadow" : "text-muted"}`}>
            {r.label}
          </button>
        ))}
      </div>

      <section className="grid grid-cols-3 gap-2">
        <Stat label="Promedio diario" value={`${avgCal}`} unit="kcal" />
        <Stat label="Días registrados" value={`${logged.length}`} unit={`de ${range}`} />
        <Stat
          label="Proyección"
          value={logged.length ? `${weeklyKg > 0 ? "+" : ""}${weeklyKg.toFixed(2)}` : "–"}
          unit="kg/sem"
          tone={weeklyKg < 0 ? "good" : weeklyKg > 0 ? "warn" : undefined}
        />
      </section>

      <section className="card p-4">
        <h2 className="mb-2 text-sm font-semibold">Calorías por día</h2>
        {targets && <CaloriesChart data={series} target={targets.calories} />}
      </section>

      {targets && logged.length > 0 && (
        <section className="card p-4 text-sm">
          <h2 className="mb-2 font-semibold">Promedio de macros (días registrados)</h2>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Macro label="Proteína" v={avg("protein_g")} t={targets.protein_g} color="var(--protein)" />
            <Macro label="Carbos" v={avg("carbs_g")} t={targets.carbs_g} color="var(--carbs)" />
            <Macro label="Grasas" v={avg("fat_g")} t={targets.fat_g} color="var(--fat)" />
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-2 font-semibold">Por día</h2>
        {logged.length === 0 ? (
          <p className="text-sm text-muted">Sin registros en este período.</p>
        ) : (
          <ul className="space-y-2">
            {[...logged].reverse().map((d) => {
              const diff = targets ? Math.round(d.calories - targets.calories) : 0;
              return (
                <li key={d.date}>
                  <Link href={`/?date=${d.date}`} className="card flex items-center justify-between p-3">
                    <div>
                      <div className="font-medium capitalize">{formatDateLong(d.date)}</div>
                      <div className="text-xs text-muted">
                        {d.meals} comida{d.meals === 1 ? "" : "s"} · P {Math.round(d.protein_g)} · C {Math.round(d.carbs_g)} · G {Math.round(d.fat_g)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-kcal">{Math.round(d.calories)} kcal</div>
                      {targets && (
                        <div className={`text-xs ${diff > 0 ? "text-danger" : "text-accent"}`}>
                          {diff > 0 ? "+" : ""}
                          {diff} vs meta
                        </div>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, unit, tone }: { label: string; value: string; unit: string; tone?: "good" | "warn" }) {
  const color = tone === "good" ? "text-accent" : tone === "warn" ? "text-danger" : "text-text";
  return (
    <div className="card p-3">
      <div className="text-[11px] uppercase tracking-wide text-muted">{label}</div>
      <div className={`text-xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-muted">{unit}</div>
    </div>
  );
}

function Macro({ label, v, t, color }: { label: string; v: number; t: number; color: string }) {
  return (
    <div>
      <div className="text-xs text-muted">{label}</div>
      <div className="text-lg font-bold" style={{ color }}>
        {v} g
      </div>
      <div className="text-xs text-muted">meta {t} g</div>
    </div>
  );
}
