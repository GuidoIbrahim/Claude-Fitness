"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { FoodItem, MealAnalysis } from "@/lib/types";
import { nowHHMM, todayISO } from "@/lib/dates";
import { MacroEditor, type MacroValues } from "@/components/MacroEditor";
import { ConfidenceBadge } from "@/components/ConfidenceBadge";

type Mode = "photo" | "manual";

export default function LogPage() {
  return (
    <Suspense>
      <LogInner />
    </Suspense>
  );
}

function LogInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [date, setDate] = useState(params.get("date") ?? todayISO());
  const [time, setTime] = useState(nowHHMM());
  const [mode, setMode] = useState<Mode>("photo");

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [hint, setHint] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [photo, setPhoto] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<MealAnalysis | null>(null);
  const [name, setName] = useState("");
  const [macros, setMacros] = useState<MacroValues>({ calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 });
  const [items, setItems] = useState<FoodItem[]>([]);
  const [saving, setSaving] = useState(false);

  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setAnalysis(null);
    setPhoto(null);
    setError(null);
  }

  async function analyze() {
    if (!file) return;
    setAnalyzing(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("photo", file);
      fd.append("hint", hint);
      const res = await fetch("/api/analyze", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al analizar");
        if (data.photo) setPhoto(data.photo);
        return;
      }
      const a: MealAnalysis = data.analysis;
      setPhoto(data.photo);
      setAnalysis(a);
      setName(a.meal_name);
      setMacros({ ...a.totals });
      setItems(a.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de red");
    } finally {
      setAnalyzing(false);
    }
  }

  function removeItem(i: number) {
    const next = items.filter((_, idx) => idx !== i);
    setItems(next);
    setMacros(sumItems(next));
  }

  async function save() {
    if (!name.trim()) return setError("Poné un nombre a la comida.");
    setSaving(true);
    setError(null);
    const body = {
      date,
      time,
      name: name.trim(),
      description: analysis?.description ?? hint,
      photo,
      ...macros,
      items,
      confidence: analysis?.confidence ?? null,
      notes: analysis?.notes ?? "",
      source: analysis ? "ai" : "manual",
    };
    const res = await fetch("/api/meals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "No se pudo guardar");
      return;
    }
    router.push("/");
    router.refresh();
  }

  const showForm = mode === "manual" || analysis !== null;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Agregar comida</h1>

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

      <div className="flex rounded-xl bg-card-2 p-1 text-sm">
        {(["photo", "manual"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 rounded-lg py-2 font-medium ${mode === m ? "bg-card text-text shadow" : "text-muted"}`}
          >
            {m === "photo" ? "📷 Foto con IA" : "✍️ Manual"}
          </button>
        ))}
      </div>

      {mode === "photo" && (
        <section className="card space-y-3 p-4">
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={pickFile} />
          <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={pickFile} />

          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Vista previa" className="max-h-80 w-full rounded-xl object-cover" />
          ) : (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted">
              <div className="mb-1 text-4xl">🍽️</div>
              Sacá una foto del plato o elegí una de la galería
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button className="btn btn-secondary" onClick={() => cameraRef.current?.click()}>
              📷 Cámara
            </button>
            <button className="btn btn-secondary" onClick={() => galleryRef.current?.click()}>
              🖼️ Galería
            </button>
          </div>

          <label>
            <span className="label">Aclaraciones (opcional)</span>
            <textarea
              rows={2}
              placeholder="Ej: 200 g de pechuga, el arroz es integral, sin aceite…"
              value={hint}
              onChange={(e) => setHint(e.target.value)}
            />
          </label>

          <button className="btn btn-primary w-full" disabled={!file || analyzing} onClick={analyze}>
            {analyzing ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#06281c] border-t-transparent" />
                Analizando con IA…
              </>
            ) : analysis ? (
              "Volver a analizar"
            ) : (
              "✨ Analizar macros"
            )}
          </button>
        </section>
      )}

      {error && <div className="rounded-xl border border-danger/50 bg-danger/10 p-3 text-sm text-danger">{error}</div>}

      {analysis && (
        <section className="card space-y-3 p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Resultado del análisis</h2>
            <ConfidenceBadge c={analysis.confidence} />
          </div>
          <p className="text-sm text-muted">{analysis.description}</p>
          {items.length > 0 && (
            <ul className="divide-y divide-border rounded-xl border border-border">
              {items.map((it, i) => (
                <li key={i} className="flex items-center gap-2 p-2.5 text-sm">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{it.name}</div>
                    <div className="text-xs text-muted">
                      {it.portion} · ~{Math.round(it.grams_estimate)} g · {Math.round(it.calories)} kcal · P {Math.round(it.protein_g)} · C{" "}
                      {Math.round(it.carbs_g)} · G {Math.round(it.fat_g)}
                    </div>
                  </div>
                  <button onClick={() => removeItem(i)} className="px-2 text-muted hover:text-danger" aria-label="Quitar">
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
          {analysis.notes && <p className="text-xs text-muted">📝 {analysis.notes}</p>}
        </section>
      )}

      {showForm && (
        <section className="card space-y-4 p-4">
          <label>
            <span className="label">Nombre</span>
            <input placeholder="Ej: Almuerzo – pollo con arroz" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <MacroEditor value={macros} onChange={setMacros} />
          {analysis && <p className="text-xs text-muted">Podés corregir cualquier valor antes de guardar.</p>}
          <button className="btn btn-primary w-full" onClick={save} disabled={saving}>
            {saving ? "Guardando…" : "Guardar comida"}
          </button>
        </section>
      )}
    </div>
  );
}

function sumItems(items: FoodItem[]): MacroValues {
  const s = (k: keyof MacroValues) => Math.round(items.reduce((a, it) => a + (it[k] || 0), 0));
  return { calories: s("calories"), protein_g: s("protein_g"), carbs_g: s("carbs_g"), fat_g: s("fat_g"), fiber_g: s("fiber_g") };
}

