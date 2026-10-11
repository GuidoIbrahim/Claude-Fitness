import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import type { DaySummary, Meal, Profile, WeightEntry } from "./types";
import { DEFAULT_PROFILE } from "./nutrition";

export const DATA_DIR = path.resolve(process.env.DATA_DIR ?? "data");
export const UPLOADS_DIR = path.join(DATA_DIR, "uploads");

let _db: Database.Database | null = null;

export function db(): Database.Database {
  if (_db) return _db;
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  const d = new Database(path.join(DATA_DIR, "app.db"));
  d.pragma("journal_mode = WAL");
  d.exec(`
    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      sex TEXT NOT NULL,
      age INTEGER NOT NULL,
      height_cm REAL NOT NULL,
      weight_kg REAL NOT NULL,
      activity REAL NOT NULL,
      goal_type TEXT NOT NULL,
      weekly_change_kg REAL NOT NULL,
      protein_g_per_kg REAL NOT NULL,
      fat_pct REAL NOT NULL,
      calorie_override REAL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS meals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      photo TEXT,
      calories REAL NOT NULL,
      protein_g REAL NOT NULL,
      carbs_g REAL NOT NULL,
      fat_g REAL NOT NULL,
      fiber_g REAL NOT NULL DEFAULT 0,
      items_json TEXT NOT NULL DEFAULT '[]',
      confidence TEXT,
      notes TEXT NOT NULL DEFAULT '',
      source TEXT NOT NULL DEFAULT 'manual',
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS meals_date ON meals(date);
    CREATE TABLE IF NOT EXISTS weights (
      date TEXT PRIMARY KEY,
      kg REAL NOT NULL
    );
  `);
  _db = d;
  return d;
}

// ---------- Profile ----------

export function getProfile(): Profile {
  const row = db().prepare("SELECT * FROM profile WHERE id = 1").get() as
    | (Profile & { id: number })
    | undefined;
  if (!row) return DEFAULT_PROFILE;
  const { id: _id, ...p } = row;
  return p;
}

export function saveProfile(p: Omit<Profile, "updated_at">): Profile {
  const updated_at = new Date().toISOString();
  db()
    .prepare(
      `INSERT INTO profile (id, sex, age, height_cm, weight_kg, activity, goal_type, weekly_change_kg,
         protein_g_per_kg, fat_pct, calorie_override, updated_at)
       VALUES (1, @sex, @age, @height_cm, @weight_kg, @activity, @goal_type, @weekly_change_kg,
         @protein_g_per_kg, @fat_pct, @calorie_override, @updated_at)
       ON CONFLICT(id) DO UPDATE SET
         sex=excluded.sex, age=excluded.age, height_cm=excluded.height_cm, weight_kg=excluded.weight_kg,
         activity=excluded.activity, goal_type=excluded.goal_type, weekly_change_kg=excluded.weekly_change_kg,
         protein_g_per_kg=excluded.protein_g_per_kg, fat_pct=excluded.fat_pct,
         calorie_override=excluded.calorie_override, updated_at=excluded.updated_at`,
    )
    .run({ ...p, calorie_override: p.calorie_override ?? null, updated_at });
  return { ...p, updated_at };
}

// ---------- Meals ----------

type MealRow = Omit<Meal, "items"> & { items_json: string };

function rowToMeal(r: MealRow): Meal {
  const { items_json, ...rest } = r;
  let items: Meal["items"] = [];
  try {
    items = JSON.parse(items_json);
  } catch {
    items = [];
  }
  return { ...rest, items };
}

export function listMeals(date: string): Meal[] {
  const rows = db()
    .prepare("SELECT * FROM meals WHERE date = ? ORDER BY time ASC, id ASC")
    .all(date) as MealRow[];
  return rows.map(rowToMeal);
}

export function getMeal(id: number): Meal | null {
  const row = db().prepare("SELECT * FROM meals WHERE id = ?").get(id) as MealRow | undefined;
  return row ? rowToMeal(row) : null;
}

export type MealInput = Omit<Meal, "id" | "created_at">;

export function insertMeal(m: MealInput): Meal {
  const created_at = new Date().toISOString();
  const info = db()
    .prepare(
      `INSERT INTO meals (date, time, name, description, photo, calories, protein_g, carbs_g, fat_g, fiber_g,
         items_json, confidence, notes, source, created_at)
       VALUES (@date, @time, @name, @description, @photo, @calories, @protein_g, @carbs_g, @fat_g, @fiber_g,
         @items_json, @confidence, @notes, @source, @created_at)`,
    )
    .run({
      ...m,
      photo: m.photo ?? null,
      confidence: m.confidence ?? null,
      items_json: JSON.stringify(m.items ?? []),
      created_at,
    });
  return getMeal(Number(info.lastInsertRowid))!;
}

export function updateMeal(id: number, patch: Partial<MealInput>): Meal | null {
  const existing = getMeal(id);
  if (!existing) return null;
  const merged: Meal = { ...existing, ...patch, id, created_at: existing.created_at };
  db()
    .prepare(
      `UPDATE meals SET date=@date, time=@time, name=@name, description=@description, photo=@photo,
         calories=@calories, protein_g=@protein_g, carbs_g=@carbs_g, fat_g=@fat_g, fiber_g=@fiber_g,
         items_json=@items_json, confidence=@confidence, notes=@notes, source=@source WHERE id=@id`,
    )
    .run({
      ...merged,
      photo: merged.photo ?? null,
      confidence: merged.confidence ?? null,
      items_json: JSON.stringify(merged.items ?? []),
    });
  return getMeal(id);
}

export function deleteMeal(id: number): boolean {
  const m = getMeal(id);
  if (!m) return false;
  db().prepare("DELETE FROM meals WHERE id = ?").run(id);
  if (m.photo) {
    const stillUsed = db().prepare("SELECT COUNT(*) c FROM meals WHERE photo = ?").get(m.photo) as { c: number };
    if (stillUsed.c === 0) {
      try {
        fs.unlinkSync(path.join(UPLOADS_DIR, m.photo));
      } catch {
        /* ignore */
      }
    }
  }
  return true;
}

export function daySummaries(from: string, to: string): DaySummary[] {
  return db()
    .prepare(
      `SELECT date, COUNT(*) meals, SUM(calories) calories, SUM(protein_g) protein_g,
         SUM(carbs_g) carbs_g, SUM(fat_g) fat_g, SUM(fiber_g) fiber_g
       FROM meals WHERE date BETWEEN ? AND ? GROUP BY date ORDER BY date ASC`,
    )
    .all(from, to) as DaySummary[];
}

// ---------- Weights ----------

export function listWeights(limit = 365): WeightEntry[] {
  return db()
    .prepare("SELECT date, kg FROM weights ORDER BY date DESC LIMIT ?")
    .all(limit)
    .reverse() as WeightEntry[];
}

export function upsertWeight(date: string, kg: number): WeightEntry {
  db()
    .prepare("INSERT INTO weights (date, kg) VALUES (?, ?) ON CONFLICT(date) DO UPDATE SET kg = excluded.kg")
    .run(date, kg);
  return { date, kg };
}

export function deleteWeight(date: string) {
  db().prepare("DELETE FROM weights WHERE date = ?").run(date);
}
