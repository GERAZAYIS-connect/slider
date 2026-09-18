import { useCallback, useEffect, useRef, useState } from "react";
import { X, StickyNote, ChevronLeft, ChevronRight, Timer } from "lucide-react";
import { useStore } from "../store";
import { SlideCanvas } from "./SlideCanvas";
import { useElementSize } from "../hooks/useElementSize";
import { getTheme } from "../data/themes";

export function PresentationMode({ onClose }: { onClose: () => void }) {
  const { presentation } = useStore();
  const [index, setIndex] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { ref, width, height } = useElementSize<HTMLDivElement>();
  const theme = getTheme(presentation.themeId);
  const slide = presentation.slides[index];

  useEffect(() => {
    const el = containerRef.current;
    if (el?.requestFullscreen) el.requestFullscreen().catch(() => {});
  }, []);

  useEffect(() => {
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const next = useCallback(() => setIndex((i) => Math.min(presentation.slides.length - 1, i + 1)), [presentation.slides.length]);
  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        prev();
      } else if (e.key === "Escape") {
        onClose();
      } else if (e.key.toLowerCase() === "n") {
        setShowNotes((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, onClose]);

  const scale = Math.min((width - 80) / 1280, (height - 120) / 720);

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  if (!slide) return null;

  return (
    <div ref={containerRef} className="fixed inset-0 z-[150] flex flex-col bg-black">
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-white/60 md:px-5">
        <div className="flex min-w-0 items-center gap-3 text-sm">
          <span className="truncate font-semibold text-white/80">{presentation.title}</span>
          <span className="hidden text-white/30 sm:inline">·</span>
          <span className="hidden whitespace-nowrap sm:inline">
            {index + 1} / {presentation.slides.length}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 border border-paper/25 px-2.5 py-1 font-mono text-sm">
            <Timer className="h-3.5 w-3.5" />
            {mm}:{ss}
          </span>
          <button
            onClick={() => setShowNotes((v) => !v)}
            className={`flex items-center gap-1.5 border px-2.5 py-1 text-sm transition ${
              showNotes ? "border-blue bg-blue text-white" : "border-paper/25 hover:border-paper/60"
            }`}
          >
            <StickyNote className="h-3.5 w-3.5" />
            Notes
          </button>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center border border-paper/25 transition hover:border-blue hover:text-blue">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div ref={ref} className="relative flex flex-1 items-center justify-center overflow-hidden">
        <div
          style={{ width: 1280 * scale, height: 720 * scale, background: theme.background }}
        >
          <SlideCanvas slide={slide} themeId={presentation.themeId} scale={scale} index={index} />
        </div>

        <button
          onClick={prev}
          disabled={index === 0}
          className="absolute left-4 top-1/2 -translate-y-1/2 border border-paper/25 p-2 text-white/70 transition hover:border-blue hover:text-blue disabled:opacity-20"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          onClick={next}
          disabled={index === presentation.slides.length - 1}
          className="absolute right-4 top-1/2 -translate-y-1/2 border border-paper/25 p-2 text-white/70 transition hover:border-blue hover:text-blue disabled:opacity-20"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        {showNotes && (
          <div className="absolute bottom-4 left-1/2 w-[640px] max-w-[90%] -translate-x-1/2 border border-paper/30 bg-ink p-4">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-white/50">Notes d'orateur</div>
            <div className="max-h-40 overflow-y-auto text-sm leading-relaxed text-white/90">
              {slide.notes || "Aucune note pour cette diapositive."}
            </div>
            {slide.juryQuestion && (
              <div className="mt-2 border border-blue bg-blue/10 p-2 text-sm text-white/90">
                <span className="font-semibold text-blue-light">Question jury :</span> {slide.juryQuestion}
                <div className="mt-1 text-white/70">↳ {slide.juryAnswer}</div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 px-5 py-2.5 text-[11px] text-white/60">
        <span className="kbd" style={{ background: "transparent", color: "rgba(255,255,255,0.75)", borderColor: "rgba(255,255,255,0.3)" }}>←</span>
        <span className="kbd" style={{ background: "transparent", color: "rgba(255,255,255,0.75)", borderColor: "rgba(255,255,255,0.3)" }}>→</span>
        <span>naviguer</span>
        <span className="mx-2">·</span>
        <span className="kbd" style={{ background: "transparent", color: "rgba(255,255,255,0.75)", borderColor: "rgba(255,255,255,0.3)" }}>N</span>
        <span>notes</span>
        <span className="mx-2">·</span>
        <span className="kbd" style={{ background: "transparent", color: "rgba(255,255,255,0.75)", borderColor: "rgba(255,255,255,0.3)" }}>Échap</span>
        <span>quitter</span>
      </div>
    </div>
  );
}
