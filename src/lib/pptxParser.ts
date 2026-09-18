import JSZip from "jszip";
import type { Slide } from "../types";
import { uid } from "./utils";

// ---------------------------------------------------------------------------
// Parsing client d'un fichier .pptx via JSZip.
// Extrait textes, puces, notes d'orateur et images embarquées, sans blocage
// même sur des présentations massives (158+ slides).
// ---------------------------------------------------------------------------

export interface ParsedPptx {
  slides: Slide[];
  images: string[];
  title: string;
  totalSlides: number;
}

function paragraphText(p: Element): string {
  const texts = Array.from(p.getElementsByTagName("a:t")).map((t) => t.textContent ?? "");
  return texts.join("").replace(/\s+/g, " ").trim();
}

function shapeParagraphs(shape: Element): { phType: string; paragraphs: string[] } {
  const ph = shape.getElementsByTagName("p:ph")[0];
  const phType = ph?.getAttribute("type") ?? "";
  const paragraphs = Array.from(shape.getElementsByTagName("a:p"))
    .map(paragraphText)
    .filter((t) => t.length > 0);
  return { phType, paragraphs };
}

function extractSlideText(xml: string): { title: string; bullets: string[]; imageRels: string[] } {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const shapes = Array.from(doc.getElementsByTagName("p:sp"));
  let title = "";
  const bullets: string[] = [];

  for (const shape of shapes) {
    const { phType, paragraphs } = shapeParagraphs(shape);
    if (paragraphs.length === 0) continue;
    if (phType === "title" || phType === "ctrTitle") {
      title = paragraphs[0];
      bullets.push(...paragraphs.slice(1));
    } else if (phType === "body" || phType === "subTitle" || phType === "obj" || phType === "pic") {
      bullets.push(...paragraphs);
    } else if (phType === "sldNum" || phType === "dt" || phType === "ftr" || phType === "hdr") {
      continue;
    } else {
      if (!title) {
        title = paragraphs[0];
        bullets.push(...paragraphs.slice(1));
      } else {
        bullets.push(...paragraphs);
      }
    }
  }

  // Références d'images embarquées (a:blip r:embed)
  const imageRels: string[] = [];
  const blips = doc.getElementsByTagName("a:blip");
  for (const b of Array.from(blips)) {
    const embed = b.getAttribute("r:embed");
    if (embed) imageRels.push(embed);
  }

  return { title, bullets, imageRels };
}

function extractNotesText(xml: string): string {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const paragraphs = Array.from(doc.getElementsByTagName("a:p")).map(paragraphText).filter((t) => t.length > 0);
  return paragraphs.join("\n");
}

function classifySlide(index: number, title: string, bullets: string[]): Slide["type"] {
  if (index === 0) return "title";
  if (bullets.length === 0) return "bullets";
  const joined = (title + " " + bullets.join(" ")).toLowerCase();
  if (/(vs|versus|probl.me|solution)/.test(joined)) return "problem-solution";
  if (/\b(kpi|métrique|metrique|chiffres|statistique)\b/.test(joined)) return "metrics";
  if (/(étape|etape|workflow|processus|architecture)/.test(joined)) return "workflow";
  if (/(comparatif|comparaison|tableau)/.test(joined)) return "comparison";
  if (/(roadmap|feuille de route|chronologie|jalon)/.test(joined)) return "timeline";
  if (/(définition|definition|théorème|theoreme|formule)/.test(joined)) return "definition";
  if (/(conclusion|synthèse|synthese|merci)/.test(joined)) return "conclusion";
  return "bullets";
}

async function resolveSlideImages(
  zip: JSZip,
  slidePath: string,
  imageRels: string[]
): Promise<{ image?: string; all: string[] }> {
  const all: string[] = [];
  let first: string | undefined;
  try {
    const relsPath = slidePath.replace(/^ppt\/slides\//, "ppt/slides/_rels/") + ".rels";
    const relsFile = zip.file(relsPath);
    if (!relsFile) return { all };
    const relsXml = await relsFile.async("string");
    const doc = new DOMParser().parseFromString(relsXml, "application/xml");
    const rels = Array.from(doc.getElementsByTagName("Relationship"));
    const byId = new Map<string, string>();
    for (const r of rels) {
      const id = r.getAttribute("Id");
      const target = r.getAttribute("Target");
      if (id && target) byId.set(id, target);
    }
    for (const embed of imageRels) {
      const target = byId.get(embed);
      if (!target) continue;
      const resolved = target.replace(/^\.\.\//, "");
      const file = zip.file(`ppt/${resolved}`);
      if (!file) continue;
      const blob = await file.async("blob");
      if (!blob.type.startsWith("image/")) continue;
      const url = URL.createObjectURL(blob);
      all.push(url);
      if (!first) first = url;
    }
  } catch {
    /* relations illisibles : on ignore */
  }
  return { image: first, all };
}

const SORT_NUM = (a: string, b: string) => {
  const na = parseInt(a.match(/\d+/)?.[0] ?? "0", 10);
  const nb = parseInt(b.match(/\d+/)?.[0] ?? "0", 10);
  return na - nb;
};

export async function parsePptx(file: File): Promise<ParsedPptx> {
  const buffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(buffer);

  const slideFiles = Object.keys(zip.files)
    .filter((p) => /^ppt\/slides\/slide\d+\.xml$/.test(p))
    .sort(SORT_NUM);

  const noteFiles = Object.keys(zip.files)
    .filter((p) => /^ppt\/notesSlides\/notesSlide\d+\.xml$/.test(p))
    .sort(SORT_NUM);

  const slides: Slide[] = [];
  const images: string[] = [];

  for (let i = 0; i < slideFiles.length; i++) {
    const xml = await zip.file(slideFiles[i])!.async("string");
    const { title, bullets, imageRels } = extractSlideText(xml);

    let notes: string | undefined;
    const noteFile = noteFiles[i];
    if (noteFile && zip.file(noteFile)) {
      const noteXml = await zip.file(noteFile)!.async("string");
      const noteText = extractNotesText(noteXml);
      if (noteText) notes = noteText;
    }

    const { image } = await resolveSlideImages(zip, slideFiles[i], imageRels);
    if (image) images.push(image);

    const type = classifySlide(i, title, bullets);
    const slide: Slide = {
      id: uid("slide"),
      type,
      title: title || (i === 0 ? "Présentation importée" : `Diapositive ${i + 1}`),
      bullets: bullets.length > 0 ? bullets : undefined,
      notes,
      image,
    };

    // Affinage du type title
    if (i === 0) {
      slide.type = "title";
      slide.subtitle = bullets.slice(0, 2).join(" · ") || undefined;
      slide.bullets = bullets.length > 2 ? bullets.slice(2) : undefined;
    }

    slides.push(slide);
  }

  return { slides, images, title: slides[0]?.title ?? file.name.replace(/\.pptx$/i, ""), totalSlides: slides.length };
}

// Condensation locale (Mode Synthèse) sans IA : regroupe les slides en clusters.
export function condenseSlides(slides: Slide[], target: number): Slide[] {
  if (slides.length <= target) return slides;
  const out: Slide[] = [];
  out.push(slides[0]);
  const body = slides.slice(1, slides.length - 1);
  const last = slides[slides.length - 1];
  const clusters = Math.max(1, target - 2);
  const per = Math.ceil(body.length / clusters);

  for (let c = 0; c < clusters; c++) {
    const chunk = body.slice(c * per, (c + 1) * per);
    if (chunk.length === 0) break;
    const titles = chunk.map((s) => s.title).filter(Boolean);
    const bullets: string[] = [];
    for (const s of chunk) {
      if (s.bullets) bullets.push(...s.bullets);
    }
    out.push({
      id: uid("slide"),
      type: "bullets",
      title: titles[0] || `Partie ${c + 1}`,
      kicker: `Partie ${c + 1}`,
      bullets: bullets.slice(0, 6),
      notes: chunk.map((s) => s.notes).filter(Boolean).join("\n"),
    });
  }

  out.push(last);
  return out.slice(0, target);
}
