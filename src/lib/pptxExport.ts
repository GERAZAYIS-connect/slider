import PptxGenJS from "pptxgenjs";
import type { Presentation, Slide } from "../types";
import { getTheme, isDarkTheme, type ThemePalette } from "../data/themes";

// Slide 16:9 — format "On-screen Show" = 10 × 5,625 pouces = 25,4 × 14,288 cm.
const W = 10;
const H = 5.625;
const M = 0.54;

function officeFont(theme: ThemePalette, kind: "heading" | "body" | "mono"): string {
  const src = kind === "heading" ? theme.fontHeading : kind === "body" ? theme.fontBody : theme.fontMono;
  if (src.includes("Playfair") || src.includes("Cinzel") || src.includes("Georgia")) return "Georgia";
  if (src.includes("Mono") || src.includes("Consolas")) return "Consolas";
  if (src.includes("Segoe")) return "Segoe UI";
  return "Arial";
}

function kickerText(theme: ThemePalette, text: string): string {
  return theme.uppercaseKickers ? text.toUpperCase() : text;
}

interface Ctx {
  theme: ThemePalette;
  dark: boolean;
  heading: string;
  body: string;
  mono: string;
  ink: string;
  muted: string;
  accent: string;
  bg: string;
  surface: string;
}

function sanitizeName(name: string): string {
  return name.replace(/[\\/:*?"<>|]+/g, "").trim() || "presentation";
}

// --- Titres avec accent de mot-clé / italique ---------------------------------

interface TitleRun {
  text: string;
  options: { color?: string; italic?: boolean };
}

function titleRuns(c: Ctx, text: string): TitleRun[] {
  if (c.theme.layout.keywordAccent) {
    const words = text.trim().split(/\s+/);
    if (words.length > 1) {
      const last = words[words.length - 1];
      const rest = words.slice(0, -1).join(" ");
      return [
        { text: rest + " ", options: { color: c.ink, italic: c.theme.layout.titleItalic } },
        { text: last, options: { color: c.accent, italic: true } },
      ];
    }
  }
  return [{ text, options: { color: c.ink, italic: c.theme.layout.titleItalic } }];
}

// --- Marqueurs kicker / puces -------------------------------------------------

function kickerPrefix(c: Ctx): string {
  switch (c.theme.layout.kickerStyle) {
    case "square": return "▪ ";
    case "dot": return "● ";
    case "line": return "— ";
    case "dash": return "– ";
    case "diamond": return "◆ ";
    case "prompt": return "> ";
    case "bracket": return "[ ";
    default: return "";
  }
}
function kickerSuffix(c: Ctx): string {
  return c.theme.layout.kickerStyle === "bracket" ? " ]" : "";
}

function bulletChar(c: Ctx): string {
  switch (c.theme.layout.bulletStyle) {
    case "square": return "▪";
    case "circle": return "●";
    case "dash": return "–";
    case "diamond": return "◆";
    case "chevron": return "▸";
    case "prompt": return "$";
    default: return "▪";
  }
}

// --- Décor & numéro de section ------------------------------------------------

function addDecoration(slide: PptxGenJS.Slide, c: Ctx): void {
  const d = c.theme.layout.decoration;
  if (d === "grid") {
    for (let x = 1.0; x < W; x += 1.335) {
      slide.addShape("line", { x, y: 0, w: 0, h: H, line: { color: c.theme.border, width: 0.75, transparency: 88 } });
    }
    for (let y = 0.9; y < H; y += 1.125) {
      slide.addShape("line", { x: 0, y, w: W, h: 0, line: { color: c.theme.border, width: 0.75, transparency: 88 } });
    }
  } else if (d === "diagonal") {
    slide.addShape("rect", { x: 7.125, y: -0.9, w: 3.75, h: 3.75, fill: { color: c.accent, transparency: 92 }, rotate: 28 });
    slide.addShape("rect", { x: -1.125, y: 3.375, w: 3.45, h: 3.45, fill: { color: c.ink, transparency: 95 }, rotate: 28 });
  } else if (d === "scanline") {
    for (let y = 0.09; y < H; y += 0.12) {
      slide.addShape("line", { x: 0, y, w: W, h: 0, line: { color: c.ink, width: 0.56, transparency: 80 } });
    }
  } else if (d === "hairline") {
    slide.addShape("line", { x: M, y: 0.045, w: W - 2 * M, h: 0, line: { color: c.theme.border, width: 0.75 } });
    slide.addShape("line", { x: M, y: H - 0.045, w: W - 2 * M, h: 0, line: { color: c.theme.border, width: 0.75 } });
  }
}

function addSectionNumber(slide: PptxGenJS.Slide, c: Ctx, index: number): void {
  slide.addText(String(index + 1).padStart(2, "0"), {
    x: W - 2.4, y: H - 1.725, w: 1.95, h: 1.5, fontSize: 113, color: c.accent, transparency: 90, bold: true,
    align: "right", fontFace: c.heading,
  });
}

// --- Images -------------------------------------------------------------------

async function getImageData(cache: Map<string, string | null>, url: string | undefined): Promise<string | null> {
  if (!url) return null;
  if (cache.has(url)) return cache.get(url) ?? null;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      cache.set(url, null);
      return null;
    }
    const blob = await res.blob();
    const buf = await blob.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    const data = `data:${blob.type};base64,${btoa(binary)}`;
    cache.set(url, data);
    return data;
  } catch {
    cache.set(url, null);
    return null;
  }
}

function addImageFrame(slide: PptxGenJS.Slide, data: string | null, c: Ctx, x: number, y: number, w: number, h: number): void {
  if (!data) {
    slide.addShape("rect", { x, y, w, h, fill: { color: c.surface }, line: { color: c.theme.border, width: 0.75 } });
    return;
  }
  slide.addImage({ data, x, y, w, h, sizing: { type: "cover", w, h } });
  if (c.theme.layout.imageStyle === "duotone" || c.theme.layout.imageStyle === "glitch") {
    slide.addShape("rect", { x, y, w, h, fill: { color: c.accent, transparency: 55 } });
  }
  slide.addShape("rect", { x, y, w, h, fill: { color: "FFFFFF", transparency: 100 }, line: { color: c.theme.border, width: 0.75 } });
}

// --- Rendu --------------------------------------------------------------------

async function populatePptx(presentation: Presentation): Promise<PptxGenJS> {
  const theme = getTheme(presentation.themeId);
  const dark = isDarkTheme(presentation.themeId);
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_16x9";
  pptx.author = presentation.author || "Slider";
  pptx.title = presentation.title || "Présentation";

  const c: Ctx = {
    theme,
    dark,
    heading: officeFont(theme, "heading"),
    body: officeFont(theme, "body"),
    mono: officeFont(theme, "mono"),
    ink: theme.ink,
    muted: theme.muted,
    accent: theme.accent,
    bg: theme.background,
    surface: theme.surface,
  };

  const cache = new Map<string, string | null>();

  for (let i = 0; i < presentation.slides.length; i++) {
    const s = presentation.slides[i];
    const slide = pptx.addSlide();
    slide.background = { color: c.bg };
    addDecoration(slide, c);
    const imageData = await getImageData(cache, s.image);
    renderSlide(slide, s, c, imageData);
    if (c.theme.layout.sectionNumber) addSectionNumber(slide, c, i);
    if (s.notes) slide.addNotes(s.notes);
  }
  return pptx;
}

export async function exportPptx(presentation: Presentation, fileName?: string): Promise<void> {
  const pptx = await populatePptx(presentation);
  await pptx.writeFile({ fileName: fileName || `${sanitizeName(presentation.title)}.pptx` });
}

export async function buildPptxBlob(presentation: Presentation): Promise<Blob> {
  const pptx = await populatePptx(presentation);
  const data = await pptx.write({ outputType: "blob" });
  return data as Blob;
}

function renderSlide(slide: PptxGenJS.Slide, s: Slide, c: Ctx, imageData: string | null): void {
  switch (s.type) {
    case "title":
      return renderTitle(slide, s, c, imageData);
    case "bullets":
      return renderBullets(slide, s, c, imageData);
    case "problem-solution":
      return renderProblemSolution(slide, s, c);
    case "cards":
      return renderCards(slide, s, c);
    case "metrics":
      return renderMetrics(slide, s, c);
    case "definition":
      return renderDefinition(slide, s, c);
    case "lab":
      return renderLab(slide, s, c);
    case "workflow":
      return renderWorkflow(slide, s, c);
    case "comparison":
      return renderComparison(slide, s, c);
    case "timeline":
      return renderTimeline(slide, s, c);
    case "conclusion":
      return renderConclusion(slide, s, c);
  }
}

function header(slide: PptxGenJS.Slide, s: Slide, c: Ctx, size = 21): number {
  const center = c.theme.layout.headerAlign === "center";
  const align: "left" | "center" = center ? "center" : "left";
  let y = 0.375;
  if (s.kicker) {
    slide.addText(kickerPrefix(c) + kickerText(c.theme, s.kicker) + kickerSuffix(c), {
      x: M, y, w: W - 2 * M, h: 0.24, fontSize: 9, color: c.accent, bold: true, fontFace: c.body, charSpacing: 1, align,
    });
    y = 0.645;
  }
  slide.addText(titleRuns(c, s.title), {
    x: M, y, w: W - 2 * M, h: 0.56, fontSize: size, bold: true, fontFace: c.heading, valign: "top", align,
  });
  let bottom = y + 0.585;
  if (s.subtitle) {
    slide.addText(s.subtitle, { x: M, y: bottom, w: W - 2 * M, h: 0.3, fontSize: 12, color: c.muted, fontFace: c.body, align });
    bottom += 0.34;
  }
  if (c.theme.layout.headerRule) {
    const rw = center ? 0.9 : 0.675;
    const rx = center ? W / 2 - rw / 2 : M;
    slide.addShape("line", { x: rx, y: bottom + 0.09, w: rw, h: 0, line: { color: c.accent, width: 1.7 } });
    bottom += 0.21;
  }
  return bottom + 0.135;
}

function renderTitle(slide: PptxGenJS.Slide, s: Slide, c: Ctx, imageData: string | null): void {
  const center = c.theme.layout.headerAlign === "center";
  const fullbleed = c.theme.layout.imageStyle === "fullbleed" && imageData;

  if (fullbleed) {
    slide.addImage({ data: imageData!, x: 0, y: 0, w: W, h: H, sizing: { type: "cover", w: W, h: H } });
    slide.addShape("rect", { x: 0, y: 0, w: W, h: H, fill: { color: "000000", transparency: 45 } });
    if (s.kicker) {
      slide.addText(kickerText(c.theme, s.kicker), { x: M, y: 1.275, w: W - 2 * M, h: 0.3, fontSize: 11, color: "FFFFFF", bold: true, fontFace: c.body, charSpacing: 2 });
    }
    slide.addText(s.title, { x: M, y: 1.575, w: W - 2 * M, h: 1.125, fontSize: 30, bold: true, color: "FFFFFF", fontFace: c.heading, valign: "top" });
    if (s.subtitle) {
      slide.addText(s.subtitle, { x: M, y: 2.85, w: W - 2 * M - 1.5, h: 0.45, fontSize: 14, color: "FFFFFF", transparency: 15, fontFace: c.body });
    }
    return;
  }

  if (!center) {
    slide.addShape("rect", { x: 0, y: 0, w: 0.12, h: H, fill: { color: c.accent } });
  }
  const sideImage = !center && imageData;
  const textX = M;
  const textW = sideImage ? W - 2 * M - 3.75 : W - 2 * M;
  let ty = center ? 1.425 : 1.2;
  if (s.kicker) {
    slide.addText(kickerPrefix(c) + kickerText(c.theme, s.kicker) + kickerSuffix(c), {
      x: textX, y: ty, w: textW, h: 0.3, fontSize: 11, color: c.accent, bold: true, fontFace: c.body, charSpacing: 2, align: center ? "center" : "left",
    });
    ty += 0.41;
  }
  slide.addText(titleRuns(c, s.title), {
    x: textX, y: ty, w: textW, h: 1.2, fontSize: 30, bold: true, fontFace: c.heading, valign: "top", align: center ? "center" : "left",
  });
  if (s.subtitle) {
    slide.addText(s.subtitle, { x: textX, y: ty + 1.24, w: textW, h: 0.45, fontSize: 14, color: c.muted, fontFace: c.body, align: center ? "center" : "left" });
  }
  if (sideImage) {
    addImageFrame(slide, imageData, c, W - M - 3.3, 0.6, 3.3, H - 1.2);
  }
  slide.addShape("line", { x: center ? W / 2 - 0.825 : M, y: center ? 4.05 : 3.9, w: 1.65, h: 0, line: { color: c.accent, width: 2.25 } });
}

function renderBullets(slide: PptxGenJS.Slide, s: Slide, c: Ctx, imageData: string | null): void {
  const y0 = header(slide, s, c);
  const items = s.bullets ?? [];
  const withImage = !!imageData && c.theme.layout.imageStyle !== "fullbleed";
  const contentW = withImage ? W - 2 * M - 3.6 : W - 2 * M;
  const startY = y0 + 0.11;
  const lineH = 0.465;
  const mark = bulletChar(c);

  items.forEach((b, i) => {
    slide.addText(mark, { x: M, y: startY + i * lineH, w: 0.26, h: 0.375, fontSize: 12, color: c.accent, bold: true, fontFace: c.body });
    slide.addText(b, { x: M + 0.375, y: startY + i * lineH, w: contentW - 0.375, h: 0.375, fontSize: 12, color: c.ink, fontFace: c.body, valign: "middle" });
  });
  if (withImage) {
    addImageFrame(slide, imageData, c, W - M - 3.3, y0 + 0.075, 3.3, H - y0 - M - 0.15);
  }
}

function renderProblemSolution(slide: PptxGenJS.Slide, s: Slide, c: Ctx): void {
  const y0 = header(slide, s, c);
  const colW = (W - 2 * M - 0.375) / 2;
  const leftX = M;
  const rightX = M + colW + 0.375;
  const boxY = y0 + 0.075;
  const boxH = H - boxY - M;
  drawColumn(slide, leftX, boxY, colW, boxH, s.left?.title ?? "Problème", s.left?.points ?? [], "#D64545", c);
  drawColumn(slide, rightX, boxY, colW, boxH, s.right?.title ?? "Solution", s.right?.points ?? [], c.accent, c);
}

function drawColumn(slide: PptxGenJS.Slide, x: number, y: number, w: number, h: number, title: string, points: string[], color: string, c: Ctx): void {
  const soft = c.theme.layout.cardStyle === "soft";
  slide.addShape(soft ? "roundRect" : "rect", { x, y, w, h, fill: { color: c.surface }, line: { color: c.theme.border, width: 0.75 }, rectRadius: soft ? c.theme.radius / 8 : 0 });
  slide.addShape("rect", { x, y, w: 0.075, h, fill: { color } });
  slide.addText(title, { x: x + 0.26, y: y + 0.26, w: w - 0.525, h: 0.375, fontSize: 15, bold: true, color: c.ink, fontFace: c.heading });
  points.forEach((p, i) => {
    slide.addText("—", { x: x + 0.26, y: y + 0.75 + i * 0.56, w: 0.26, h: 0.45, fontSize: 11, color, bold: true, fontFace: c.body });
    slide.addText(p, { x: x + 0.525, y: y + 0.75 + i * 0.56, w: w - 0.75, h: 0.45, fontSize: 11, color: c.ink, fontFace: c.body, valign: "top" });
  });
}

function renderCards(slide: PptxGenJS.Slide, s: Slide, c: Ctx): void {
  const y0 = header(slide, s, c, 20);
  const cards = s.cards ?? [];
  const style = c.theme.layout.cardStyle;
  const cols = cards.length <= 3 ? Math.max(1, cards.length) : 3;
  const gap = 0.3;
  const cardW = (W - 2 * M - gap * (cols - 1)) / cols;
  const cardH = H - y0 - 0.15 - M;
  const rows = Math.ceil(cards.length / cols);

  cards.forEach((card, i) => {
    const r = Math.floor(i / cols);
    const col = i % cols;
    const x = M + col * (cardW + gap);
    const y = y0 + 0.075 + r * (cardH / Math.max(1, rows) + gap);
    const ch = cardH / Math.max(1, rows) - gap;

    if (style === "borderless") {
      slide.addText(String(i + 1).padStart(2, "0"), { x: x + 0.11, y: y + 0.075, w: cardW - 0.22, h: 0.225, fontSize: 9, color: c.muted, fontFace: c.mono });
      slide.addText(card.title, { x: x + 0.11, y: y + 0.3, w: cardW - 0.22, h: 0.375, fontSize: 13, bold: true, color: c.ink, fontFace: c.heading });
      slide.addText(card.body, { x: x + 0.11, y: y + 0.71, w: cardW - 0.22, h: ch - 0.825, fontSize: 10, color: c.muted, fontFace: c.body, valign: "top" });
      return;
    }

    if (style === "image-led") {
      slide.addShape("rect", { x, y, w: cardW, h: 0.86, fill: { color: c.surface }, line: { color: c.theme.border, width: 0.75 } });
      slide.addShape("ellipse", { x: x + cardW - 0.585, y: y + 0.12, w: 0.375, h: 0.375, fill: { color: c.accent, transparency: 55 }, line: { color: c.accent, width: 0.75 } });
      slide.addShape("rect", { x: x + 0.11, y: y + 0.525, w: 0.64, h: 0.21, fill: { color: c.accent, transparency: 30 } });
      slide.addText(String(i + 1).padStart(2, "0"), { x: x + 0.04, y: y + 0.975, w: cardW - 0.08, h: 0.225, fontSize: 9, color: c.accent, fontFace: c.mono });
      slide.addText(card.title, { x: x + 0.04, y: y + 1.185, w: cardW - 0.08, h: 0.375, fontSize: 13, bold: true, italic: true, color: c.ink, fontFace: c.heading });
      slide.addText(card.body, { x: x + 0.04, y: y + 1.59, w: cardW - 0.08, h: ch - 1.69, fontSize: 10, color: c.muted, fontFace: c.body, valign: "top" });
      return;
    }

    const soft = style === "soft";
    slide.addShape(soft ? "roundRect" : "rect", { x, y, w: cardW, h: ch, fill: { color: c.surface }, line: { color: style === "neon" ? c.accent : c.theme.border, width: style === "neon" ? 1.125 : 0.75 }, rectRadius: soft ? c.theme.radius / 8 : 0 });

    if (style === "ascii") {
      slide.addText("┌── " + String(i + 1).padStart(2, "0") + " ──┐", { x: x + 0.225, y: y + 0.19, w: cardW - 0.45, h: 0.26, fontSize: 10, color: c.accent, fontFace: c.mono });
      slide.addText(card.title, { x: x + 0.225, y: y + 0.49, w: cardW - 0.45, h: 0.375, fontSize: 12, bold: true, color: c.ink, fontFace: c.mono });
      slide.addText(card.body, { x: x + 0.225, y: y + 0.9, w: cardW - 0.45, h: ch - 1.05, fontSize: 9, color: c.muted, fontFace: c.mono, valign: "top" });
      return;
    }

    if (style === "neon") {
      slide.addText(String(i + 1).padStart(2, "0"), { x: x + 0.225, y: y + 0.19, w: cardW - 0.45, h: 0.225, fontSize: 9, color: c.accent, fontFace: c.mono });
      slide.addText(card.title, { x: x + 0.225, y: y + 0.41, w: cardW - 0.45, h: 0.375, fontSize: 12, bold: true, color: c.ink, fontFace: c.heading });
      slide.addText(card.body, { x: x + 0.225, y: y + 0.825, w: cardW - 0.45, h: ch - 0.975, fontSize: 9, color: c.muted, fontFace: c.body, valign: "top" });
      return;
    }

    if (style === "hard") {
      slide.addShape("rect", { x, y, w: cardW, h: 0.09, fill: { color: c.accent } });
    } else if (style === "line") {
      slide.addShape("rect", { x, y, w: 0.45, h: 0.045, fill: { color: c.accent } });
    }
    const topPad = style === "hard" ? 0.26 : 0.21;
    slide.addText(card.title, { x: x + 0.225, y: y + topPad, w: cardW - 0.45, h: 0.375, fontSize: 13, bold: true, color: c.ink, fontFace: c.heading });
    slide.addText(card.body, { x: x + 0.225, y: y + topPad + 0.41, w: cardW - 0.45, h: ch - topPad - 0.56, fontSize: 10, color: c.muted, fontFace: c.body, valign: "top" });
  });
}

function renderMetrics(slide: PptxGenJS.Slide, s: Slide, c: Ctx): void {
  const y0 = header(slide, s, c);
  const metrics = s.metrics ?? [];
  const style = c.theme.layout.metricStyle;
  const cols = metrics.length;
  const gap = 0.3;
  const w = (W - 2 * M - gap * (cols - 1)) / cols;
  const y = y0 + 0.45;
  const h = H - y - M;

  metrics.forEach((m, i) => {
    const x = M + i * (w + gap);

    if (style === "plain" || style === "serif") {
      slide.addText(m.value, { x: x + 0.15, y: y + 0.375, w: w - 0.3, h: 0.825, fontSize: style === "serif" ? 42 : 33, bold: style === "serif" ? false : true, color: style === "serif" ? c.ink : c.accent, fontFace: c.heading, align: "center" });
      slide.addShape("line", { x: x + w / 2 - 0.26, y: y + 1.35, w: 0.525, h: 0, line: { color: c.accent, width: 1.5 } });
      slide.addText(m.label, { x: x + 0.15, y: y + 1.5, w: w - 0.3, h: 0.6, fontSize: 10, color: c.muted, fontFace: c.body, align: "center", valign: "top" });
      return;
    }

    if (style === "mono") {
      slide.addShape("line", { x: x + (i === 0 ? 0 : 0.15), y, w: 0, h, line: { color: c.theme.border, width: 0.75 } });
      slide.addText(String(i + 1).padStart(2, "0"), { x: x + 0.26, y: y + 0.375, w: w - 0.525, h: 0.225, fontSize: 9, color: c.accent, fontFace: c.mono });
      slide.addText(m.value, { x: x + 0.26, y: y + 0.64, w: w - 0.525, h: 0.75, fontSize: 30, bold: true, color: c.ink, fontFace: c.mono });
      slide.addText(m.label, { x: x + 0.26, y: y + 1.425, w: w - 0.525, h: 0.6, fontSize: 10, color: c.muted, fontFace: c.mono, valign: "top" });
      return;
    }

    if (style === "neon") {
      slide.addText(m.value, { x: x + 0.15, y: y + 0.375, w: w - 0.3, h: 0.825, fontSize: 38, bold: true, color: c.accent, fontFace: c.mono, align: "center" });
      slide.addText(m.label, { x: x + 0.15, y: y + 1.31, w: w - 0.3, h: 0.6, fontSize: 10, color: c.muted, fontFace: c.body, align: "center", valign: "top" });
      return;
    }

    // box
    slide.addShape("rect", { x, y, w, h, fill: { color: c.surface }, line: { color: c.theme.border, width: 0.75 } });
    slide.addText(m.value, { x: x + 0.19, y: y + 0.41, w: w - 0.375, h: 0.75, fontSize: 30, bold: true, color: c.accent, fontFace: c.heading, align: "center" });
    slide.addShape("line", { x: x + w / 2 - 0.375, y: y + 1.275, w: 0.75, h: 0, line: { color: c.accent, width: 1.5 } });
    slide.addText(m.label, { x: x + 0.19, y: y + 1.425, w: w - 0.375, h: 0.6, fontSize: 10, color: c.muted, fontFace: c.body, align: "center", valign: "top" });
  });
}

function renderDefinition(slide: PptxGenJS.Slide, s: Slide, c: Ctx): void {
  const y0 = header(slide, s, c, 18);
  const d = s.definition;
  if (!d) return;
  const boxW = W - 2 * M;
  slide.addShape("rect", { x: M, y: y0 + 0.075, w: boxW, h: 0.71, fill: { color: c.surface }, line: { color: c.accent, width: 1.125 } });
  slide.addText(d.term, { x: M + 0.26, y: y0 + 0.135, w: boxW - 0.525, h: 0.3, fontSize: 15, bold: true, color: c.ink, fontFace: c.heading });
  slide.addText(d.statement, { x: M + 0.26, y: y0 + 0.465, w: boxW - 0.525, h: 0.3, fontSize: 11, color: c.muted, fontFace: c.body });

  let yy = y0 + 1.01;
  if (d.formula) {
    slide.addShape("rect", { x: M, y: yy, w: boxW, h: 0.6, fill: { color: c.dark ? "#000000" : "#0E0E10" } });
    slide.addText(d.formula, { x: M + 0.3, y: yy + 0.075, w: boxW - 0.6, h: 0.45, fontSize: 14, color: "#FFFFFF", fontFace: c.mono, align: "center", valign: "middle" });
    yy += 0.825;
  }
  const colW = (boxW - 0.375) / 2;
  slide.addText("Exemples", { x: M, y: yy, w: colW, h: 0.3, fontSize: 11, bold: true, color: c.accent, fontFace: c.body });
  slide.addText("Contre-exemples", { x: M + colW + 0.375, y: yy, w: colW, h: 0.3, fontSize: 11, bold: true, color: "#D64545", fontFace: c.body });
  yy += 0.34;
  d.examples.forEach((e, i) => {
    slide.addText("✓ " + e, { x: M, y: yy + i * 0.41, w: colW, h: 0.375, fontSize: 10, color: c.ink, fontFace: c.body });
  });
  d.counterExamples.forEach((e, i) => {
    slide.addText("✗ " + e, { x: M + colW + 0.375, y: yy + i * 0.41, w: colW, h: 0.375, fontSize: 10, color: c.ink, fontFace: c.body });
  });
}

function renderLab(slide: PptxGenJS.Slide, s: Slide, c: Ctx): void {
  const y0 = header(slide, s, c, 18);
  const step = s.steps?.[0];
  if (!step) return;
  const num = step.title.match(/\d+/) ? `Étape ${step.title.match(/\d+/)}` : step.title;

  slide.addText(num, { x: M, y: y0 + 0.075, w: 2.25, h: 0.375, fontSize: 14, bold: true, color: c.accent, fontFace: c.mono });
  slide.addText(step.body, { x: M, y: y0 + 0.49, w: W - 2 * M, h: 0.45, fontSize: 11, color: c.ink, fontFace: c.body, valign: "top" });

  let yy = y0 + 1.01;
  if (step.command) {
    slide.addText("COMMANDE", { x: M, y: yy, w: W - 2 * M, h: 0.26, fontSize: 8, bold: true, color: c.muted, fontFace: c.mono });
    yy += 0.3;
    slide.addShape("rect", { x: M, y: yy, w: W - 2 * M, h: 0.6, fill: { color: c.dark ? "#000000" : "#0E0E10" } });
    slide.addText("$ " + step.command, { x: M + 0.3, y: yy + 0.075, w: W - 2 * M - 0.6, h: 0.45, fontSize: 12, color: "#3FB950", fontFace: c.mono, valign: "middle" });
    yy += 0.825;
  }
  if (step.output) {
    slide.addText("SORTIE ATTENDUE", { x: M, y: yy, w: W - 2 * M, h: 0.26, fontSize: 8, bold: true, color: c.muted, fontFace: c.mono });
    yy += 0.3;
    slide.addShape("rect", { x: M, y: yy, w: W - 2 * M, h: 1.05, fill: { color: c.dark ? "#0B0D1C" : "#1B1F24" } });
    slide.addText(step.output, { x: M + 0.3, y: yy + 0.11, w: W - 2 * M - 0.6, h: 0.825, fontSize: 11, color: "#E6EDF3", fontFace: c.mono, valign: "top" });
  }
}

function renderWorkflow(slide: PptxGenJS.Slide, s: Slide, c: Ctx): void {
  const y0 = header(slide, s, c, 20);
  const steps = s.steps ?? [];
  const n = steps.length;
  const gap = 0.45;
  const stepW = (W - 2 * M - gap * (n - 1)) / n;
  const cy = y0 + 1.2;
  const round = c.theme.radius >= 12;

  slide.addShape("line", { x: M + stepW / 2, y: cy, w: (n - 1) * (stepW + gap), h: 0, line: { color: c.accent, width: 1.5 } });

  steps.forEach((st, i) => {
    const x = M + i * (stepW + gap);
    slide.addShape(round ? "ellipse" : "rect", { x: x + stepW / 2 - 0.225, y: cy - 0.225, w: 0.45, h: 0.45, fill: { color: c.accent } });
    slide.addText(String(i + 1), { x: x + stepW / 2 - 0.225, y: cy - 0.225, w: 0.45, h: 0.45, fontSize: 12, bold: true, color: c.theme.accentInk, align: "center", valign: "middle", fontFace: c.body });
    slide.addText(st.title, { x: x, y: cy + 0.45, w: stepW, h: 0.375, fontSize: 12, bold: true, color: c.ink, align: "center", fontFace: c.heading });
    slide.addText(st.body, { x: x + 0.075, y: cy + 0.86, w: stepW - 0.15, h: 1.125, fontSize: 9, color: c.muted, align: "center", valign: "top", fontFace: c.body });
  });
}

function renderComparison(slide: PptxGenJS.Slide, s: Slide, c: Ctx): void {
  const y0 = header(slide, s, c, 20);
  const comp = s.comparison;
  if (!comp) return;
  const leftCol = W * 0.22;
  const colW = (W - 2 * M - leftCol) / 2;
  const rows = comp.rows;
  const rowH = 0.525;
  const topY = y0 + 0.225;

  slide.addShape("rect", { x: M, y: topY, w: leftCol, h: rowH, fill: { color: c.ink } });
  slide.addShape("rect", { x: M + leftCol, y: topY, w: colW, h: rowH, fill: { color: c.accent } });
  slide.addText(comp.leftTitle, { x: M + leftCol, y: topY, w: colW, h: rowH, fontSize: 11, color: c.theme.accentInk, bold: true, align: "center", valign: "middle", fontFace: c.body });
  slide.addShape("rect", { x: M + leftCol + colW, y: topY, w: colW, h: rowH, fill: { color: c.accent } });
  slide.addText(comp.rightTitle, { x: M + leftCol + colW, y: topY, w: colW, h: rowH, fontSize: 11, color: c.theme.accentInk, bold: true, align: "center", valign: "middle", fontFace: c.body });

  rows.forEach((r, i) => {
    const y = topY + rowH + i * rowH;
    slide.addShape("rect", { x: M, y, w: leftCol, h: rowH, fill: { color: c.surface }, line: { color: c.theme.border, width: 0.75 } });
    slide.addText(r.label, { x: M + 0.15, y, w: leftCol - 0.3, h: rowH, fontSize: 9, color: c.ink, bold: true, valign: "middle", fontFace: c.body });
    slide.addShape("rect", { x: M + leftCol, y, w: colW, h: rowH, fill: { color: c.surface }, line: { color: c.theme.border, width: 0.75 } });
    slide.addText(r.left, { x: M + leftCol + 0.15, y, w: colW - 0.3, h: rowH, fontSize: 10, color: c.ink, valign: "middle", fontFace: c.body });
    slide.addShape("rect", { x: M + leftCol + colW, y, w: colW, h: rowH, fill: { color: c.surface }, line: { color: c.theme.border, width: 0.75 } });
    slide.addText(r.right, { x: M + leftCol + colW + 0.15, y, w: colW - 0.3, h: rowH, fontSize: 10, color: c.ink, valign: "middle", fontFace: c.body });
  });
}

function renderTimeline(slide: PptxGenJS.Slide, s: Slide, c: Ctx): void {
  const y0 = header(slide, s, c, 20);
  const items = s.timeline ?? [];
  const n = items.length;
  const gap = 0.3;
  const stepW = (W - 2 * M - gap * (n - 1)) / n;
  const lineY = y0 + 0.525;
  const round = c.theme.radius >= 12;

  slide.addShape("line", { x: M, y: lineY, w: W - 2 * M, h: 0, line: { color: c.accent, width: 1.5 } });
  items.forEach((it, i) => {
    const x = M + i * (stepW + gap);
    slide.addShape(round ? "ellipse" : "rect", { x, y: lineY - 0.09, w: 0.18, h: 0.18, fill: { color: c.accent } });
    slide.addText(it.date, { x, y: lineY - 0.41, w: stepW, h: 0.3, fontSize: 11, bold: true, color: c.accent, fontFace: c.body });
    slide.addText(it.title, { x, y: lineY + 0.26, w: stepW, h: 0.34, fontSize: 11, bold: true, color: c.ink, fontFace: c.heading });
    slide.addText(it.body, { x, y: lineY + 0.64, w: stepW - 0.04, h: 1.05, fontSize: 9, color: c.muted, valign: "top", fontFace: c.body });
  });
}

function renderConclusion(slide: PptxGenJS.Slide, s: Slide, c: Ctx): void {
  const center = c.theme.layout.headerAlign === "center";
  const align: "left" | "center" = center ? "center" : "left";
  slide.addShape("rect", { x: 0, y: 0, w: W, h: 0.12, fill: { color: c.accent } });
  if (s.kicker) {
    slide.addText(kickerPrefix(c) + kickerText(c.theme, s.kicker) + kickerSuffix(c), {
      x: M, y: 1.275, w: W - 2 * M, h: 0.3, fontSize: 10, bold: true, color: c.accent, fontFace: c.body, charSpacing: 2, align,
    });
  }
  slide.addText(titleRuns(c, s.title), {
    x: M, y: 1.61, w: W - 2 * M, h: 0.675, fontSize: 26, bold: true, fontFace: c.heading, align,
  });
  if (s.conclusion) {
    slide.addText(s.conclusion, { x: M + (center ? 0.75 : 0), y: 2.4, w: W - 2 * M - (center ? 1.5 : 0), h: 0.6, fontSize: 12, color: c.muted, align, valign: "top", fontFace: c.body });
  }
  const items = s.bullets ?? [];
  const mark = bulletChar(c);
  items.forEach((b, i) => {
    slide.addText(`${mark} ${b}`, { x: M + (center ? 1.5 : 0), y: 3.075 + i * 0.375, w: W - 2 * M - (center ? 3 : 0), h: 0.34, fontSize: 11, color: c.ink, align, fontFace: c.body });
  });
}
