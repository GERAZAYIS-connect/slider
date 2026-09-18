import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

// ---------------------------------------------------------------------------
// Couche de stockage portable : fichier local (desktop) ou Vercel KV (serverless).
// Vercel KV est activé dès que KV_REST_API_URL / KV_REST_API_TOKEN sont définis.
// ---------------------------------------------------------------------------

function dataDir(): string {
  return process.env.SLIDER_DATA_DIR || path.join(os.homedir(), ".slider");
}

function kvEnabled(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

export async function storeGet<T>(key: string, fallback: T): Promise<T> {
  if (kvEnabled()) {
    try {
      const { kv } = await import("@vercel/kv");
      const value = await kv.get<T>(key);
      if (value !== null && value !== undefined) return value;
      return fallback;
    } catch {
      /* bascule sur le fichier */
    }
  }
  try {
    const file = path.join(dataDir(), `${key}.json`);
    await fs.mkdir(dataDir(), { recursive: true });
    return JSON.parse(await fs.readFile(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

export async function storeSet(key: string, value: unknown): Promise<void> {
  if (kvEnabled()) {
    try {
      const { kv } = await import("@vercel/kv");
      await kv.set(key, JSON.parse(JSON.stringify(value)));
      return;
    } catch {
      /* bascule sur le fichier */
    }
  }
  try {
    const file = path.join(dataDir(), `${key}.json`);
    await fs.mkdir(dataDir(), { recursive: true });
    await fs.writeFile(file, JSON.stringify(value, null, 2));
  } catch {
    /* ignore */
  }
}
