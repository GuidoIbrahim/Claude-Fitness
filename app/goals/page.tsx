"use client";

import { useEffect, useMemo, useState } from "react";
import type { GoalType, Profile } from "@/lib/types";
import { ACTIVITY_LEVELS, DEFAULT_PROFILE, computeTargets } from "@/lib/nutrition";

const goals: { value: GoalType; label: string; hint: string }[] = [
  { value: "deficit", label: "Déficit", hint: "Perder grasa" },
  { value: "maintain", label: "Mantener", hint: "Mismo peso" },
  { value: "surplus", label: "Superávit", hint: "Ganar masa" },
];

export default function GoalsPage() {
  const [p, setP] = useState<Profile>(DEFAULT_PROFILE);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [useOverride, setUseOverride] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        setP(d.profile);
        setUseOverride(d.profile.calorie_override != null);
        setLoaded(true);
      });
  }, []);

  const targets = useMemo(() => computeTargets({ ...p, calorie_override: useOverride ? p.calorie_override : null }), [p, useOverride]);

  function set<K extends keyof Profile>(k: K, v: Profile[K]) {
    setP((prev) => ({ ...prev, [k]: v }));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    const { updated_at: _u, ...body } = { ...p, calorie_override: useOverride ? (p.calorie_override ?? targets.calories) : null };
    const r = await fetch("/api/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (r.ok) {
      const d = await r.json();
      setP(d.profile);
      setSaved(true);
    }
    setSaving(false);
  }

  if (!loaded) return <div className="h-60 animate-pulse rounded-2xl bg-card" />;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Objetivo</h1>

      <section className="card p-4">
        <div className="text-[11px] uppercase tracking-wide text-muted">Tu meta diaria</div>
        <div className="text-4xl font-bold text-kcal">
          {targets.calories} <span className="text-base font-medium text-muted">kcal</span>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2 text-center text-sm">
          <div>
            <div className="font-bold text-protein">{targets.protein_g} g</div>
            <div className="text-xs text-muted">proteína</div>
          </div>
          <div>
            <div className="font-bold text-carbs">{targets.carbs_g} g</div>
            <div className="text-xs text-muted">carbos</div>
          </div>
          <div>
            <div className="font-bold text-fat">{targets.fat_g} g</div>
            <div className="text-xs text-muted">grasas</div>
          </div>
        </div>
        <div className="mt-3 text-xs text-muted">
          Metabolismo basal {targets.bmr} kcal · Gasto diario estimado (TDEE) {targets.tdee} kcal ·{" "}
          {targets.daily_delta === 0 ? "sin déficit" : `${targets.daily_delta > 0 ? "+" : ""}${targets.daily_delta} kcal/día`}
        </div>
      </section>

      <section className="card space-y-3 p-4">
        <h2 className="font-semibold">Tipo de objetivo</h2>
        <div className="grid grid-cols-3 gap-2">
          {goals.map((g) => (
            <button
              key={g.value}
              onClick={() => set("goal_type", g.value)}
              className={`rounded-xl border p-3 text-left ${p.goal_type === g.value ? "border-accent bg-accent/10" : "border-border bg-card-2"}`}
            >
              <div className="font-semibold">{g.label}</div>
              <div className="text-xs text-muted">{g.hint}</div>
            </button>
          ))}
        </div>
        {p.goal_type !== "maintain" && (
          <label>
            <span className="label">
              Ritmo: {p.weekly_change_kg.toFixed(2)} kg por semana ({p.goal_type === "deficit" ? "perder" : "ganar"})
            </span>
            <input type="range" min={0.1} max={1} step={0.05} value={p.weekly_change_kg} onChange={(e) => set("weekly_change_kg", Number(e.target.value))} className="accent-[var(--accent)]" />
            <div className="flex justify-between text-[11px] text-muted">
              <span>Suave (0.1)</span>
              <span>Agresivo (1.0)</span>
            </div>
          </label>
        )}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="h-4 w-4 accent-[var(--accent)]" style={{ width: "auto" }} checked={useOverride} onChange={(e) => setUseOverride(e.target.checked)} />
          Fijar las calorías manualmente
        </label>
        {useOverride && (
          <label>
            <span className="label">Calorías diarias</span>
            <input type="number" inputMode="numeric" value={p.calorie_override ?? targets.calories} onChange={(e) => set("calorie_override", Number(e.target.value))} />
          </label>
        )}
      </section>

      <section className="card space-y-3 p-4">
        <h2 className="font-semibold">Datos personales</h2>
        <div className="grid grid-cols-2 gap-3">
          <label>
            <span className="label">Sexo</span>
            <select value={p.sex} onChange={(e) => set("sex", e.target.value as Profile["sex"])}>
              <option value="male">Hombre</option>
              <option value="female">Mujer</option>
            </select>
          </label>
          <label>
            <span className="label">Edad</span>
            <input type="number" inputMode="numeric" value={p.age} onChange={(e) => set("age", Number(e.target.value))} />
          </label>
          <label>
            <span className="label">Altura (cm)</span>
            <input type="number" inputMode="numeric" value={p.height_cm} onChange={(e) => set("height_cm", Number(e.target.value))} />
          </label>
          <label>
            <span className="label">Peso (kg)</span>
            <input type="number" inputMode="decimal" step="0.1" value={p.weight_kg} onChange={(e) => set("weight_kg", Number(e.target.value))} />
          </label>
        </div>
        <label>
          <span className="label">Nivel de actividad</span>
          <select value={p.activity} onChange={(e) => set("activity", Number(e.target.value))}>
            {ACTIVITY_LEVELS.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label} — {a.hint}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="card space-y-3 p-4">
        <h2 className="font-semibold">Distribución de macros</h2>
        <label>
          <span className="label">Proteína: {p.protein_g_per_kg.toFixed(1)} g por kg de peso</span>
          <input type="range" min={1.2} max={3} step={0.1} value={p.protein_g_per_kg} onChange={(e) => set("protein_g_per_kg", Number(e.target.value))} className="accent-[var(--protein)]" />
        </label>
        <label>
          <span className="label">Grasas: {Math.round(p.fat_pct * 100)} % de las calorías</span>
          <input type="range" min={0.15} max={0.45} step={0.01} value={p.fat_pct} onChange={(e) => set("fat_pct", Number(e.target.value))} className="accent-[var(--fat)]" />
        </label>
        <p className="text-xs text-muted">Los carbohidratos se calculan con las calorías que quedan.</p>
      </section>

      <button className="btn btn-primary w-full" onClick={save} disabled={saving}>
        {saving ? "Guardando…" : saved ? "✓ Guardado" : "Guardar objetivo"}
      </button>
    </div>
  );
}
