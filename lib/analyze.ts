import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { MealAnalysis } from "./types";

export const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-5-5";

const FoodItemSchema = z.object({
  name: z.string().describe("Nombre del alimento en español"),
  portion: z.string().describe("Porción estimada en lenguaje natural, ej. '1 taza', '2 rodajas'"),
  grams_estimate: z.number().describe("Peso estimado en gramos"),
  calories: z.number(),
  protein_g: z.number(),
  carbs_g: z.number(),
  fat_g: z.number(),
  fiber_g: z.number(),
});

export const MealAnalysisSchema = z.object({
  meal_name: z.string().describe("Nombre corto del plato, ej. 'Milanesa con puré'"),
  description: z.string().describe("Descripción breve de lo que se ve en la foto"),
  items: z.array(FoodItemSchema),
  totals: z.object({
    calories: z.number(),
    protein_g: z.number(),
    carbs_g: z.number(),
    fat_g: z.number(),
    fiber_g: z.number(),
  }),
  confidence: z.enum(["low", "medium", "high"]),
  notes: z.string().describe("Supuestos tomados y qué cambiaría el resultado (ej. si tiene aceite extra)"),
});

const SYSTEM_PROMPT = `Sos un nutricionista experto en estimar el contenido nutricional de comidas a partir de fotos.

Tu tarea: analizar la foto de un plato de comida y estimar, de la forma más precisa posible, los alimentos presentes, sus porciones y sus macronutrientes.

Pautas:
- Identificá cada alimento visible por separado. Usá referencias visuales (tamaño del plato, cubiertos, mano, vaso) para estimar la porción en gramos.
- Para cada alimento calculá calorías, proteínas, carbohidratos, grasas y fibra usando valores estándar de tablas nutricionales (USDA / tablas argentinas).
- Tené en cuenta métodos de cocción y aderezos probables (aceite en salteados, manteca en purés, aderezos en ensaladas). Si no se ven, asumí una cantidad moderada típica y aclaralo en "notes".
- Los totales deben ser la suma exacta de los items.
- "confidence": "high" si los alimentos y porciones son claros; "medium" si hay dudas razonables de porción; "low" si la foto es ambigua, hay comida tapada o es imposible estimar bien.
- Si el usuario agrega una descripción o aclaraciones (por ejemplo pesos reales o ingredientes), priorizá esa información sobre lo que inferís de la imagen.
- Si la imagen no es comida, devolvé items vacío, totales en 0, confidence "low" y explicá en "notes".
- Respondé siempre en español rioplatense neutro. Los números son estimaciones redondeadas razonables (sin decimales innecesarios).`;

export class AnalysisRefusedError extends Error {}

export function hasApiKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

export async function analyzeMealPhoto(
  imageBase64: string,
  mediaType: "image/jpeg" | "image/png" | "image/webp",
  hint?: string,
): Promise<MealAnalysis> {
  const client = new Anthropic();

  const userText = hint?.trim()
    ? `Analizá este plato. Aclaraciones del usuario: ${hint.trim()}`
    : "Analizá este plato y estimá sus macros.";

  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64 } },
          { type: "text", text: userText },
        ],
      },
    ],
    output_config: {
      effort: "medium",
      format: zodOutputFormat(MealAnalysisSchema),
    },
  });

  if (response.stop_reason === "refusal") {
    throw new AnalysisRefusedError(
      response.stop_details?.explanation ?? "El modelo no pudo analizar esta imagen.",
    );
  }
  if (!response.parsed_output) {
    throw new Error("La respuesta del modelo no pudo interpretarse. Probá de nuevo.");
  }

  const a = response.parsed_output;
  // Recalcular totales a partir de los items para que siempre cierren.
  if (a.items.length > 0) {
    const sum = (k: keyof (typeof a.items)[number]) =>
      Math.round(a.items.reduce((acc, it) => acc + (Number(it[k]) || 0), 0));
    a.totals = {
      calories: sum("calories"),
      protein_g: sum("protein_g"),
      carbs_g: sum("carbs_g"),
      fat_g: sum("fat_g"),
      fiber_g: sum("fiber_g"),
    };
  }
  return a;
}
