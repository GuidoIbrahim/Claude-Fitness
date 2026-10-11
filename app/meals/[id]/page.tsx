"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Meal } from "@/lib/types";
import { MacroEditor, type MacroValues } from "@/components/MacroEditor";
import { todayISO } from "@/lib/dates";

export default function MealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [meal, setMeal] = useState<Meal | null>(null);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [macros, setMacros] = useState<MacroValues>({ calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 });
  const [busy, setBusy] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/meals/${id}`).then(async (r) => {
      if (!r.ok) return setNotFound(true);
      const { meal } = (await r.json()) as { meal: Meal };
      setMeal(meal);
      setName(meal.name);
      setDate(meal.date);
      setTime(meal.time);
      setMacros({ calories: meal.calories, protein_g: meal.protein_g, carbs_g: meal.carbs_g, fat_g: meal.fat_g, fiber_g: meal.fiber_g });
    });
  }, [id]);

  async function save() {
    setBusy(true);
    await fetch(`/api/meals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, date, time, ...macros }),
    });
    setBusy(false);
    router.push("/");
    router.refresh();
  }

  async function remove() {
    if (!confirm("¿Eliminar esta comida?")) return;
    setBusy(true);
    await fetch(`/api/meals/${id}`, { method: "DELETE" });
    router.push("/");
    router.refresh();
  }

  if (notFound) return <p className="text-muted">Esta comida no existe.</p>;
  if (!meal) return <div className="h-40 animate-pulse rounded-2xl bg-card" />;

  return (
    <div className="space-y-4">
      <button onClick={() => router.back()} className="text-sm text-accent">
        ‹ Volver
      </button>
      {meal.photo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`/api/uploads/${meal.photo}`} alt="" className="max-h-80 w-full rounded-2xl object-cover" />
      )}
      <section className="card space-y-4 p-4">
        <label>
          <span className="label">Nombre</span>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label>
            <span className="label">Fecha</span>
            <input type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label>
            <span className="label">Hora</span>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </label>
        </div>
        <MacroEditor value={macros} onChange={setMacros} />
        {meal.description && <p className="text-sm text-muted">{meal.description}</p>}
        {meal.items.length > 0 && (
          <ul className="divide-y divide-border rounded-xl border border-border text-sm">
            {meal.items.map((it, i) => (
              <li key={i} className="p-2.5">
                <div className="font-medium">{it.name}</div>
                <div className="text-xs text-muted">
                  {it.portion} · ~{Math.round(it.grams_estimate)} g · {Math.round(it.calories)} kcal · P {Math.round(it.protein_g)} · C {Math.round(it.carbs_g)} · G{" "}
                  {Math.round(it.fat_g)}
                </div>
              </li>
            ))}
          </ul>
        )}
        {meal.notes && <p className="text-xs text-muted">📝 {meal.notes}</p>}
        <div className="grid grid-cols-2 gap-2">
          <button className="btn btn-danger" onClick={remove} disabled={busy}>
            Eliminar
          </button>
          <button className="btn btn-primary" onClick={save} disabled={busy}>
            Guardar
          </button>
        </div>
      </section>
    </div>
  );
}
