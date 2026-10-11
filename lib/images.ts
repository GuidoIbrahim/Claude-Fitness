import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { UPLOADS_DIR } from "./db";

/**
 * Normaliza la foto: la rota según EXIF, la reduce a 1280px máximo y la guarda como JPEG.
 * Devuelve el nombre del archivo guardado y el buffer para enviar al modelo.
 */
export async function storePhoto(input: Buffer): Promise<{ filename: string; jpeg: Buffer }> {
  const jpeg = await sharp(input)
    .rotate()
    .resize({ width: 1280, height: 1280, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();
  const filename = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}.jpg`;
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOADS_DIR, filename), jpeg);
  return { filename, jpeg };
}
