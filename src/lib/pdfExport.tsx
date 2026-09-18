import { createRoot, type Root } from "react-dom/client";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import type { Presentation, Slide } from "../types";
import { getTheme } from "../data/themes";
import { SlideCanvas } from "../components/SlideCanvas";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function sanitizeName(name: string): string {
  return name.replace(/[\\/:*?"<>|]+/g, "").trim() || "presentation";
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`Délai dépassé (${label})`)), ms);
    promise.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

// Convertit une image distante/blob en data URL, avec un délai maximum.
async function imageToDataUrl(url: string, timeoutMs = 6000): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(url, { signal: ctrl.signal, mode: "cors" });
    clearTimeout(t);
    if (!res.ok) return null;
    const blob = await res.blob();
    const type = blob.type.startsWith("image/") ? blob.type : "image/png";
    const buf = await blob.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return `data:${type};base64,${btoa(binary)}`;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Export PDF 16:9 haute résolution.
// Les images sont pré-chargées en data URL (avec timeout) AVANT la capture,
// pour éviter qu'html2canvas ne reste bloqué sur une image distante lente.
// ---------------------------------------------------------------------------
export async function exportPdf(
  presentation: Presentation,
  onProgress?: (done: number, total: number) => void
): Promise<void> {
  const { slides, themeId } = presentation;
  const bg = getTheme(themeId).background;

  // 1) Pré-charge toutes les images uniques en parallèle (borné à ~6s).
  const imageCache = new Map<string, string | null>();
  const uniqueUrls = [...new Set(slides.map((s) => s.image).filter((u): u is string => !!u))];
  await Promise.all(uniqueUrls.map(async (url) => imageCache.set(url, await imageToDataUrl(url))));

  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = "1280px";
  container.style.height = "720px";
  container.style.zIndex = "-1";
  document.body.appendChild(container);

  const root: Root = createRoot(container);
  const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [1280, 720], hotfixes: ["px_scaling"] });

  let added = 0;
  for (let i = 0; i < slides.length; i++) {
    const s = slides[i];
    const image = s.image ? (imageCache.get(s.image) ?? undefined) : undefined;
    const renderSlide: Slide = { ...s, image };

    root.render(<SlideCanvas slide={renderSlide} themeId={themeId} scale={1} index={i} />);
    await wait(200);

    const target = container.firstElementChild as HTMLElement | null;
    if (target) {
      try {
        const canvas = await withTimeout(
          html2canvas(target, {
            scale: 2,
            backgroundColor: bg,
            logging: false,
            windowWidth: 1280,
            windowHeight: 720,
          }),
          15000,
          `slide ${i + 1}`
        );
        if (canvas.width > 0 && canvas.height > 0) {
          const img = canvas.toDataURL("image/jpeg", 0.92);
          if (added > 0) pdf.addPage([1280, 720], "landscape");
          pdf.addImage(img, "JPEG", 0, 0, 1280, 720);
          added++;
        }
      } catch (err) {
        console.warn(`[pdf] slide ${i + 1} ignorée :`, (err as Error).message);
      }
    }
    onProgress?.(i + 1, slides.length);
  }

  root.unmount();
  document.body.removeChild(container);

  if (added === 0) {
    throw new Error("Échec de la génération du PDF : aucune diapositive n'a pu être rendue.");
  }

  pdf.save(`${sanitizeName(presentation.title)}.pdf`);
}
