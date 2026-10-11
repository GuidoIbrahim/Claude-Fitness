export type GoalType = "deficit" | "maintain" | "surplus";
export type Sex = "male" | "female";
export type Confidence = "low" | "medium" | "high";

export interface Profile {
  sex: Sex;
  age: number;
  height_cm: number;
  weight_kg: number;
  /** Multiplicador de actividad (1.2 sedentario … 1.9 muy activo) */
  activity: number;
  goal_type: GoalType;
  /** kg por semana que se quieren perder/ganar (positivo) */
  weekly_change_kg: number;
  protein_g_per_kg: number;
  /** fracción de calorías que vienen de grasa (0.2 – 0.4) */
  fat_pct: number;
  /** si se setea, reemplaza el cálculo automático de calorías */
  calorie_override: number | null;
  updated_at: string;
}

export interface Targets {
  bmr: number;
  tdee: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  daily_delta: number;
}

export interface FoodItem {
  name: string;
  portion: string;
  grams_estimate: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
}

export interface MealAnalysis {
  meal_name: string;
  description: string;
  items: FoodItem[];
  totals: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
  };
  confidence: Confidence;
  notes: string;
}

export interface Meal {
  id: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  name: string;
  description: string;
  photo: string | null;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  items: FoodItem[];
  confidence: Confidence | null;
  notes: string;
  source: "ai" | "manual";
  created_at: string;
}

export interface DaySummary {
  date: string;
  meals: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
}

export interface WeightEntry {
  date: string;
  kg: number;
}
