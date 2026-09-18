import express from "express";
import path from "node:path";
import fs from "node:fs";
import app from "./app";
import { geminiAvailable } from "./ai";
import { getServerDir } from "./dir";

const __dirname = getServerDir();

try {
  process.loadEnvFile?.(path.resolve(__dirname, "../.env"));
} catch {
  /* .env absent : on ignore */
}
const PORT = Number(process.env.PORT) || 8787;

// En local / desktop : servir le build Vite.
const distDir = path.resolve(__dirname, "../dist");
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distDir, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`\n  Slider · serveur démarré sur http://localhost:${PORT}`);
  console.log(`  IA Gemini : ${geminiAvailable() ? "activée ✓" : "non configurée (moteur de gabarits actif)"}\n`);
});
