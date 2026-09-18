import path from "node:path";
import type { GenerationRequest, Slide, SlideTypeId, TypologyId } from "../src/types";
import { uid } from "./id";
import { generateFromTemplate } from "./templates";
import { getServerDir } from "./dir";

// ---------------------------------------------------------------------------
// Moteur d'IA générative résilient multi-fournisseurs :
//   1. Gemini (modèles récents, SDK officiel)
//   2. DeepSeek (API OpenAI-compatible via fetch)
//   3. Moteur de gabarits structurés (secours sans clé)
// ---------------------------------------------------------------------------

const GEMINI_MODELS = ["gemini-3.6-flash", "gemini-3.1-pro-preview"] as const;

const DEEPSEEK_ENDPOINT = "https://api.deepseek.com/chat/completions";
const DEEPSEEK_MODEL = "deepseek-chat";

export type AiSource = "gemini" | "deepseek" | "template";

export interface AiResult {
  slides: Slide[];
  source: AiSource;
  model?: string;
  image?: string;
}

const SLIDE_SCHEMA = `
Tu dois produire un tableau JSON d'objets "slide". Chaque slide respecte EXACTEMENT ce schéma TypeScript :

type SlideTypeId = "title" | "bullets" | "problem-solution" | "cards" | "metrics" | "definition" | "lab" | "workflow" | "comparison" | "timeline" | "conclusion";

interface Slide {
  id: string;              // identifiant unique court
  type: SlideTypeId;
  title: string;
  subtitle?: string;
  kicker?: string;         // petit label en majuscules au-dessus du titre
  bullets?: string[];      // pour type "bullets"
  cards?: { id: string; title: string; body: string }[];             // pour type "cards"
  metrics?: { id: string; value: string; label: string }[];          // pour type "metrics"
  steps?: { id: string; title: string; body: string; command?: string; output?: string }[]; // lab / workflow
  timeline?: { id: string; date: string; title: string; body: string }[]; // timeline
  comparison?: { leftTitle: string; rightTitle: string; rows: { id: string; label: string; left: string; right: string }[] }; // comparison
  definition?: { term: string; statement: string; formula?: string; examples: string[]; counterExamples: string[] }; // definition
  left?: { title: string; points: string[] };   // problem-solution (côté gauche)
  right?: { title: string; points: string[] };  // problem-solution (côté droit)
  conclusion?: string;       // pour type conclusion
  notes?: string;            // note d'orateur
  juryQuestion?: string;     // uniquement pour la soutenance académique
  juryAnswer?: string;       // uniquement pour la soutenance académique
}

Règles :
- Ne renvoie QUE le JSON valide, sans texte autour, sans balises Markdown.
- Chaque slide doit être rempli avec du contenu riche, précis et en français.
- Respecte le type demandé : utilise uniquement les champs correspondant au "type" choisi.
- La première slide est TOUJOURS de type "title", la dernière de type "conclusion".
- Adapte la structure et le vocabulaire à la typologie indiquée.
- Pour la typologie "defense", ajoute systématiquement "juryQuestion" et "juryAnswer" pertinents.
- Pour la typologie "lab", utilise le type "lab" avec des commandes et sorties console réalistes.
- Ajoute une note d'orateur "notes" pertinente à chaque slide.
`.trim();

function extractJsonArray(text: string): unknown[] | null {
  let t = text.trim();
  const fenced = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) t = fenced[1].trim();

  const start = t.indexOf("[");
  if (start < 0) return null;

  // 1) Tenter un parse complet
  const end = t.lastIndexOf("]");
  if (end > start) {
    try {
      const parsed = JSON.parse(t.slice(start, end + 1));
      if (Array.isArray(parsed)) return parsed;
    } catch {
      /* réponse tronquée ou malformée : on tente la récupération */
    }
  }

  // 2) Récupération des objets complets (réponse tronquée par max_tokens)
  let depth = 0;
  let inString = false;
  let escaped = false;
  let lastObjectEnd = -1;
  for (let i = start; i < t.length; i++) {
    const ch = t[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "[" || ch === "{") {
      depth++;
      continue;
    }
    if (ch === "]" || ch === "}") {
      depth--;
      if (depth === 1 && ch === "}") lastObjectEnd = i;
    }
  }

  if (lastObjectEnd > start) {
    try {
      const parsed = JSON.parse(t.slice(start, lastObjectEnd + 1) + "]");
      if (Array.isArray(parsed)) return parsed;
    } catch {
      /* abandon */
    }
  }
  return null;
}

async function callModel(model: string, prompt: string, apiKey: string): Promise<string> {
  const { GoogleGenAI } = await import("@google/genai");
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({ model, contents: prompt });
  const text =
    (response as any).text ??
    (response as any).candidates?.[0]?.content?.parts?.map((p: any) => p.text ?? "").join("") ??
    "";
  return String(text ?? "");
}

async function callDeepSeek(prompt: string, apiKey: string): Promise<string> {
  const res = await fetch(DEEPSEEK_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 8192,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DeepSeek ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as any;
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Réponse DeepSeek vide");
  return String(content);
}

function sanitizeSlides(raw: unknown): Slide[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((s): s is Record<string, unknown> => !!s && typeof s === "object")
    .map((s) => {
      const slide: Slide = {
        id: uid("slide"),
        type: (s.type as SlideTypeId) ?? "bullets",
        title: String(s.title ?? ""),
        subtitle: s.subtitle ? String(s.subtitle) : undefined,
        kicker: s.kicker ? String(s.kicker) : undefined,
        bullets: Array.isArray(s.bullets) ? s.bullets.map(String) : undefined,
        cards: Array.isArray(s.cards)
          ? s.cards.map((c: any) => ({ id: String(c.id ?? uid("c")), title: String(c.title ?? ""), body: String(c.body ?? "") }))
          : undefined,
        metrics: Array.isArray(s.metrics)
          ? s.metrics.map((m: any) => ({ id: String(m.id ?? uid("m")), value: String(m.value ?? ""), label: String(m.label ?? "") }))
          : undefined,
        steps: Array.isArray(s.steps)
          ? s.steps.map((st: any) => ({
              id: String(st.id ?? uid("s")),
              title: String(st.title ?? ""),
              body: String(st.body ?? ""),
              command: st.command ? String(st.command) : undefined,
              output: st.output ? String(st.output) : undefined,
            }))
          : undefined,
        timeline: Array.isArray(s.timeline)
          ? s.timeline.map((t: any) => ({ id: String(t.id ?? uid("t")), date: String(t.date ?? ""), title: String(t.title ?? ""), body: String(t.body ?? "") }))
          : undefined,
        comparison: s.comparison
          ? {
              leftTitle: String((s.comparison as any).leftTitle ?? ""),
              rightTitle: String((s.comparison as any).rightTitle ?? ""),
              rows: Array.isArray((s.comparison as any).rows)
                ? (s.comparison as any).rows.map((r: any) => ({ id: String(r.id ?? uid("r")), label: String(r.label ?? ""), left: String(r.left ?? ""), right: String(r.right ?? "") }))
                : [],
            }
          : undefined,
        definition: s.definition
          ? {
              term: String((s.definition as any).term ?? ""),
              statement: String((s.definition as any).statement ?? ""),
              formula: (s.definition as any).formula ? String((s.definition as any).formula) : undefined,
              examples: Array.isArray((s.definition as any).examples) ? (s.definition as any).examples.map(String) : [],
              counterExamples: Array.isArray((s.definition as any).counterExamples) ? (s.definition as any).counterExamples.map(String) : [],
            }
          : undefined,
        left: s.left ? { title: String((s.left as any).title ?? ""), points: Array.isArray((s.left as any).points) ? (s.left as any).points.map(String) : [] } : undefined,
        right: s.right ? { title: String((s.right as any).title ?? ""), points: Array.isArray((s.right as any).points) ? (s.right as any).points.map(String) : [] } : undefined,
        conclusion: s.conclusion ? String(s.conclusion) : undefined,
        notes: s.notes ? String(s.notes) : undefined,
        juryQuestion: s.juryQuestion ? String(s.juryQuestion) : undefined,
        juryAnswer: s.juryAnswer ? String(s.juryAnswer) : undefined,
      };
      return slide;
    })
    .filter((s) => s.title.trim().length > 0);
}

export function geminiAvailable(): boolean {
  reloadEnv();
  return !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0;
}

export function deepseekAvailable(): boolean {
  reloadEnv();
  return !!process.env.DEEPSEEK_API_KEY && process.env.DEEPSEEK_API_KEY.trim().length > 0;
}

export function aiAvailable(): boolean {
  return geminiAvailable() || deepseekAvailable();
}

// Recharge .env à chaque appel : permet d'ajouter/retirer une clé API sans
// redémarrer le serveur (évite le ECONNREFUSED lié à un restart manuel).
function reloadEnv(): void {
  try {
    const dir = getServerDir();
    process.loadEnvFile?.(path.resolve(dir, "../.env"));
  } catch {
    /* .env absent : on ignore */
  }
}

interface RunResult {
  slides: Slide[];
  source: "gemini" | "deepseek";
  model: string;
}

async function runAi(prompt: string, minSlides: number, logPrefix: string): Promise<RunResult | null> {
  // 1) DeepSeek en priorité
  if (deepseekAvailable()) {
    try {
      const text = await callDeepSeek(prompt, process.env.DEEPSEEK_API_KEY!);
      const slides = sanitizeSlides(extractJsonArray(text) ?? []);
      if (slides.length >= minSlides) return { slides, source: "deepseek", model: DEEPSEEK_MODEL };
    } catch (err) {
      console.warn(`[ai] échec ${logPrefix} DeepSeek:`, (err as Error).message);
    }
  }

  // 2) Gemini en secours
  if (geminiAvailable()) {
    for (const model of GEMINI_MODELS) {
      try {
        const text = await callModel(model, prompt, process.env.GEMINI_API_KEY!);
        const slides = sanitizeSlides(extractJsonArray(text) ?? []);
        if (slides.length >= minSlides) return { slides, source: "gemini", model };
      } catch (err) {
        console.warn(`[ai] échec ${logPrefix} ${model}:`, (err as Error).message);
      }
    }
  }

  return null;
}

export async function generatePresentation(req: GenerationRequest): Promise<AiResult> {
  const slideCount = Math.max(3, Math.min(100, req.slideCount || 10));
  const topic = req.title?.trim() || req.brief.trim().slice(0, 80);

  if (!aiAvailable()) {
    return { slides: generateFromTemplate(req), source: "template" };
  }

  const prompt = `${SLIDE_SCHEMA}

Typologie de présentation : ${req.typology}
Nombre de slides : ${slideCount}
Langue : ${req.language === "en" ? "anglais" : "français"}
Titre (si fourni) : ${req.title ?? "—"}
Brief / sujet fourni par l'utilisateur :
"""
${req.brief}
"""

Produis maintenant ${slideCount} slides structurées.`;

  const result = await runAi(prompt, 3, "génération");
  if (result) {
    const image = await fetchEditorialImage(topic);
    return { slides: result.slides.slice(0, slideCount), source: result.source, model: result.model, image };
  }

  return { slides: generateFromTemplate(req), source: "template" };
}

const IMPROVE_CHUNK = 20;

function buildImprovePrompt(slides: Slide[], instruction: string, typology: TypologyId): string {
  return `${SLIDE_SCHEMA}

Tu es un directeur artistique. Améliore la présentation ci-dessous en suivant cette consigne :
"""
${instruction || "Sublime le contenu, améliore la clarté et l'impact."}
"""

Typologie : ${typology}

Slides actuelles (JSON) :
${JSON.stringify(slides, null, 2)}

Renvoie le tableau JSON complet des slides améliorées, en conservant l'ordre et le nombre.`;
}

export async function improvePresentation(
  slides: Slide[],
  instruction: string,
  typology: TypologyId
): Promise<AiResult> {
  if (!aiAvailable()) {
    return {
      slides: slides.map((s) => ({
        ...s,
        notes: s.notes ?? "Présentation sublimée par Slider.",
        title: s.title || "Sans titre",
      })),
      source: "template",
    };
  }

  // Traitement par lots pour les decks volumineux (évite la troncature JSON).
  if (slides.length <= IMPROVE_CHUNK) {
    const result = await runAi(buildImprovePrompt(slides, instruction, typology), 1, "improve");
    if (result) {
      return { slides: result.slides, source: result.source, model: result.model };
    }
    return { slides, source: "template" };
  }

  const out: Slide[] = [];
  let source: "gemini" | "deepseek" | "template" = "template";
  let model: string | undefined;
  for (let i = 0; i < slides.length; i += IMPROVE_CHUNK) {
    const chunk = slides.slice(i, i + IMPROVE_CHUNK);
    const result = await runAi(buildImprovePrompt(chunk, instruction, typology), 1, `improve[${Math.floor(i / IMPROVE_CHUNK) + 1}]`);
    if (result) {
      out.push(...result.slides);
      source = result.source;
      model = result.model;
    } else {
      out.push(...chunk);
    }
  }

  if (source === "template") return { slides, source: "template" };
  return { slides: out, source, model };
}

async function fetchEditorialImage(query: string): Promise<string | undefined> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return undefined;
  try {
    const url = `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=landscape&w=1600`;
    const res = await fetch(url, { headers: { Authorization: `Client-ID ${key}` } });
    if (!res.ok) return undefined;
    const data = (await res.json()) as any;
    return data?.urls?.regular ?? data?.urls?.full ?? undefined;
  } catch {
    return undefined;
  }
}
