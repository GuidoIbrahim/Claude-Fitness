import { z } from "zod";

export const ItemSchema = z.object({
  name: z.string(),
  portion: z.string().default(""),
  grams_estimate: z.number().default(0),
  calories: z.number().default(0),
  protein_g: z.number().default(0),
  carbs_g: z.number().default(0),
  fat_g: z.number().default(0),
  fiber_g: z.number().default(0),
});

export const MealBodySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  name: z.string().min(1),
  description: z.string().default(""),
  photo: z.string().nullable().default(null),
  calories: z.number().min(0),
  protein_g: z.number().min(0),
  carbs_g: z.number().min(0),
  fat_g: z.number().min(0),
  fiber_g: z.number().min(0).default(0),
  items: z.array(ItemSchema).default([]),
  confidence: z.enum(["low", "medium", "high"]).nullable().default(null),
  notes: z.string().default(""),
  source: z.enum(["ai", "manual"]).default("manual"),
});
