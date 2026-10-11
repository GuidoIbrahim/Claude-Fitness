import type { Profile, Targets } from "./types";

export const KCAL_PER_KG = 7700;
export const MIN_CALORIES = 1200;

export const ACTIVITY_LEVELS: { value: number; label: string; hint: string }[] = [
  { value: 1.2, label: "Sedentario", hint: "Poco o nada de ejercicio" },
  { value: 1.375, label: "Ligero", hint: "Ejercicio 1–3 días/semana" },
  { value: 1.55, label: "Moderado", hint: "Ejercicio 3–5 días/semana" },
  { value: 1.725, label: "Activo", hint: "Ejercicio 6–7 días/semana" },
  { value: 1.9, label: "Muy activo", hint: "Trabajo físico + entrenamiento" },
];

/** Mifflin-St Jeor */
export function bmr(p: Pick<Profile, "sex" | "age" | "height_cm" | "weight_kg">): number {
  const base = 10 * p.weight_kg + 6.25 * p.height_cm - 5 * p.age;
  return p.sex === "male" ? base + 5 : base - 161;
}

export function computeTargets(p: Profile): Targets {
  const b = bmr(p);
  const tdee = b * p.activity;
  const sign = p.goal_type === "deficit" ? -1 : p.goal_type === "surplus" ? 1 : 0;
  const dailyDelta = sign * (p.weekly_change_kg * KCAL_PER_KG) / 7;
  let calories = p.calorie_override ?? tdee + dailyDelta;
  calories = Math.max(MIN_CALORIES, calories);

  const protein_g = p.protein_g_per_kg * p.weight_kg;
  const fat_g = (calories * p.fat_pct) / 9;
  const carbs_g = Math.max(0, (calories - protein_g * 4 - fat_g * 9) / 4);

  return {
    bmr: Math.round(b),
    tdee: Math.round(tdee),
    calories: Math.round(calories),
    protein_g: Math.round(protein_g),
    carbs_g: Math.round(carbs_g),
    fat_g: Math.round(fat_g),
    daily_delta: Math.round(p.calorie_override != null ? calories - tdee : dailyDelta),
  };
}

export const DEFAULT_PROFILE: Profile = {
  sex: "male",
  age: 30,
  height_cm: 175,
  weight_kg: 80,
  activity: 1.55,
  goal_type: "deficit",
  weekly_change_kg: 0.5,
  protein_g_per_kg: 2.0,
  fat_pct: 0.25,
  calorie_override: null,
  updated_at: new Date().toISOString(),
};

/** Media móvil exponencial para la tendencia de peso (estilo MacroFactor). */
export function weightTrend(entries: { date: string; kg: number }[], alpha = 0.3) {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  let ema: number | null = null;
  return sorted.map((e) => {
    ema = ema == null ? e.kg : alpha * e.kg + (1 - alpha) * ema;
    return { ...e, trend: Math.round(ema * 100) / 100 };
  });
}
