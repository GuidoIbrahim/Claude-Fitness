import { NextResponse } from "next/server";
import { analyzeMealPhoto, AnalysisRefusedError, hasApiKey } from "@/lib/analyze";
import { storePhoto } from "@/lib/images";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: Request) {
  if (!hasApiKey()) {
    return NextResponse.json(
      { error: "Falta configurar ANTHROPIC_API_KEY en el servidor (ver .env.example)." },
      { status: 500 },
    );
  }
  const form = await req.formData();
  const file = form.get("photo");
  const hint = (form.get("hint") as string | null) ?? undefined;
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Tenés que subir una foto." }, { status: 400 });
  }
  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: "La foto no puede superar 20 MB." }, { status: 400 });
  }

  let stored;
  try {
    stored = await storePhoto(Buffer.from(await file.arrayBuffer()));
  } catch {
    return NextResponse.json({ error: "No se pudo procesar la imagen. ¿Es un archivo de imagen válido?" }, { status: 400 });
  }

  try {
    const analysis = await analyzeMealPhoto(stored.jpeg.toString("base64"), "image/jpeg", hint);
    return NextResponse.json({ photo: stored.filename, analysis });
  } catch (err) {
    if (err instanceof AnalysisRefusedError) {
      return NextResponse.json({ error: `El modelo rechazó la imagen: ${err.message}`, photo: stored.filename }, { status: 422 });
    }
    const msg = err instanceof Error ? err.message : "Error desconocido";
    console.error("analyze error", err);
    return NextResponse.json({ error: `Error al analizar: ${msg}`, photo: stored.filename }, { status: 502 });
  }
}
