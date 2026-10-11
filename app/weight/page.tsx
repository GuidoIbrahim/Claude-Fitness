"use client";

import { useEffect, useState } from "react";
import { formatDateShort, todayISO } from "@/lib/dates";
import { WeightChart } from "@/components/charts";

type Entry = { date: string; kg: number; trend: number };

export default function WeightPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [date, setDate] = useState(todayISO());
  const [kg, setKg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/weights")
      .then((r) => r.json())
      .then((d) => setEntries(d.weights));
  }, []);

  async function add() {
    const v = Number(kg.replace(",", "."));
    if (!v) return;
    setBusy(true);
    const r = await fetch("/api/weights", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date, kg: v }) });
    const d = await r.json();
    setEntries(d.weights);
    setKg("");
    setBusy(false);
  }

  async function remove(d: string) {
    if (!confirm("¿Borrar este pesaje?")) return;
    const r = await fetch(`/api/weights?date=${d}`, { method: "DELETE" });
    setEntries((await r.json()).weights);
  }

  const last = entries[entries.length - 1];
  const first = entries[0];
  const change = last && first && entries.length > 1 ? last.trend - first.trend : null;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Peso</h1>

      <section className="card space-y-3 p-4">
        <div className="grid grid-cols-[1.2fr_1fr_auto] items-end gap-2">
          <label>
            <span className="label">Fecha</span>
            <input type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label>
            <span className="label">Kg</span>
            <input type="text" inputMode="decimal" placeholder="80.5" value={kg} onChange={(e) => setKg(e.target.value)} />
          </label>
          <button className="btn btn-primary" onClick={add} disabled={busy || !kg}>
            Guardar
          </button>
        </div>
        <p className="text-xs text-muted">Pesate siempre en las mismas condiciones (a la mañana, en ayunas). La tendencia suaviza las fluctuaciones diarias.</p>
      </section>

      {entries.length > 0 && (
        <section className="grid grid-cols-2 gap-2">
          <div className="card p-3">
            <div className="text-[11px] uppercase tracking-wide text-muted">Tendencia actual</div>
            <div className="text-2xl font-bold text-accent">{last.trend.toFixed(1)} kg</div>
            <div className="text-xs text-muted">último pesaje {last.kg.toFixed(1)} kg</div>
          </div>
          <div className="card p-3">
            <div className="text-[11px] uppercase tracking-wide text-muted">Cambio total</div>
            <div className={`text-2xl font-bold ${change != null && change < 0 ? "text-accent" : "text-text"}`}>
              {change == null ? "–" : `${change > 0 ? "+" : ""}${change.toFixed(1)} kg`}
            </div>
            <div className="text-xs text-muted">{entries.length} pesajes</div>
          </div>
        </section>
      )}

      {entries.length > 1 && (
        <section className="card p-4">
          <h2 className="mb-2 text-sm font-semibold">Evolución</h2>
          <WeightChart data={entries} />
        </section>
      )}

      {entries.length > 0 && (
        <ul className="divide-y divide-border rounded-2xl border border-border">
          {[...entries].reverse().map((e) => (
            <li key={e.date} className="flex items-center justify-between p-3 text-sm">
              <span className="text-muted">{formatDateShort(e.date)}</span>
              <span className="font-semibold">{e.kg.toFixed(1)} kg</span>
              <span className="text-xs text-muted">tend. {e.trend.toFixed(1)}</span>
              <button onClick={() => remove(e.date)} className="text-muted hover:text-danger" aria-label="Borrar">
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
