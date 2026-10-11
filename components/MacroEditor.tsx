"use client";

export interface MacroValues {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
}

const fields: { key: keyof MacroValues; label: string; unit: string; color: string }[] = [
  { key: "calories", label: "Calorías", unit: "kcal", color: "var(--kcal)" },
  { key: "protein_g", label: "Proteína", unit: "g", color: "var(--protein)" },
  { key: "carbs_g", label: "Carbohidratos", unit: "g", color: "var(--carbs)" },
  { key: "fat_g", label: "Grasas", unit: "g", color: "var(--fat)" },
  { key: "fiber_g", label: "Fibra", unit: "g", color: "var(--muted)" },
];

export function MacroEditor({ value, onChange }: { value: MacroValues; onChange: (v: MacroValues) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {fields.map((f) => (
        <label key={f.key} className={f.key === "calories" ? "col-span-2" : ""}>
          <span className="label" style={{ color: f.color }}>
            {f.label} ({f.unit})
          </span>
          <input
            type="number"
            inputMode="decimal"
            step="1"
            min="0"
            value={Number.isFinite(value[f.key]) ? value[f.key] : 0}
            onChange={(e) => onChange({ ...value, [f.key]: Number(e.target.value) })}
          />
        </label>
      ))}
    </div>
  );
}
