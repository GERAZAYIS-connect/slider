import path from "node:path";
import { fileURLToPath } from "node:url";

// Dossier du serveur : `server/` en dev (ESM) et `dist-server/` dans le bundle (CJS).
export function getServerDir(): string {
  if (typeof __dirname === "string" && __dirname) return __dirname;
  return path.dirname(fileURLToPath(import.meta.url));
}
