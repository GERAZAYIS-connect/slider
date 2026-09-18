import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, PanelRightClose, PanelRightOpen, Cpu } from "lucide-react";
import { useStore } from "../store";
import { useToast } from "./Toast";
import { TopBar, type ExportKind } from "./TopBar";
import { Sidebar } from "./Sidebar";
import { EditorPanel } from "./EditorPanel";
import { GenerateModal } from "./GenerateModal";
import { ImportModal } from "./ImportModal";
import { PresentationMode } from "./PresentationMode";
import { Paywall } from "./Paywall";
import { SlideCanvas } from "./SlideCanvas";
import { useElementSize } from "../hooks/useElementSize";
import { useSubscription } from "../hooks/useSubscription";
import { exportPptx } from "../lib/pptxExport";
import { exportPdf } from "../lib/pdfExport";
import { exportGoogleSlides } from "../lib/googleSlides";
import { apiImprove, apiHealth, aiSourceLabel, apiPaymentCheckExport, apiPaymentConsumeExport } from "../lib/api";
import { saveProject } from "../lib/storage";
import { navigate } from "../lib/router";

export function Editor() {
  const { presentation, selectedSlide, selectSlide, setSlides } = useStore();
  const { push } = useToast();
  const { info } = useSubscription();
  const [genOpen, setGenOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const [editorOpen, setEditorOpen] = useState(true);
  const [exporting, setExporting] = useState<ExportKind | null>(null);
  const [improving, setImproving] = useState(false);
  const [aiProvider, setAiProvider] = useState<string | null>(null);
  const [paywall, setPaywall] = useState<"subscription" | "export" | null>(null);
  const [pendingExport, setPendingExport] = useState<ExportKind | null>(null);

  useEffect(() => {
    apiHealth()
      .then((h) => setAiProvider(h.ai ? h.provider ?? "deepseek" : "none"))
      .catch(() => setAiProvider("none"));
  }, []);

  // Sauvegarde automatique (débouncée), hors premier rendu.
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const t = setTimeout(() => saveProject(presentation), 600);
    return () => clearTimeout(t);
  }, [presentation]);

  const doExport = useCallback(
    async (kind: ExportKind) => {
      setExporting(kind);
      try {
        if (kind === "pptx") {
          await exportPptx(presentation);
          push("Export PowerPoint (.pptx) réussi.", "success");
        } else if (kind === "pdf") {
          push("Génération du PDF 16:9…", "info");
          await exportPdf(presentation);
          push("Export PDF 16:9 réussi.", "success");
        } else if (kind === "google") {
          const result = await exportGoogleSlides(presentation);
          window.open(result.url, "_blank");
          push("Présentation Google Slides créée dans votre Drive.", "success");
        }
      } catch (err) {
        push((err as Error).message, "error");
      } finally {
        setExporting(null);
      }
    },
    [presentation, push]
  );

  const onExport = useCallback(
    async (kind: ExportKind) => {
      try {
        const check = await apiPaymentCheckExport();
        if (!check.allowed) {
          setPendingExport(kind);
          setPaywall("export");
          return;
        }
        if (check.via === "credit") {
          await apiPaymentConsumeExport();
        }
        await doExport(kind);
      } catch (err) {
        // Serveur inaccessible : on laisse passer l'export (mode dégradé).
        push((err as Error).message, "error");
        await doExport(kind);
      }
    },
    [doExport, push]
  );

  const onImprove = useCallback(async () => {
    setImproving(true);
    try {
      const result = await apiImprove(presentation.slides, "Sublime l'intégralité du contenu : clarté, structure, typographie et notes d'orateur.", presentation.typologyId);
      setSlides(result.slides);
      const label = aiSourceLabel(result);
      push(label ? `Présentation sublimée (${label})` : "Sublimation IA non disponible — configurez GEMINI_API_KEY ou DEEPSEEK_API_KEY.", label ? "success" : "info");
    } catch (err) {
      push((err as Error).message, "error");
    } finally {
      setImproving(false);
    }
  }, [presentation.slides, presentation.typologyId, push, setSlides]);

  return (
    <div className="app-shell flex flex-col bg-paper text-ink">
      <TopBar
        onGenerate={() => setGenOpen(true)}
        onImport={() => setImportOpen(true)}
        onPresent={() => setPresenting(true)}
        onExport={onExport}
        onImprove={onImprove}
        improving={improving}
        exporting={exporting}
        onHome={() => navigate("#/")}
      />

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-60 shrink-0 border-r border-ink bg-paper md:block">
          <Sidebar />
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <CanvasArea onPrev={() => moveBy(-1)} onNext={() => moveBy(1)} />
          <footer className="flex h-9 shrink-0 items-center justify-between gap-2 border-t border-ink bg-paper px-3 md:px-4">
            <div className="flex min-w-0 items-center gap-2 text-xs text-grey">
              <Cpu className={`h-3.5 w-3.5 shrink-0 ${aiProvider && aiProvider !== "none" ? "text-blue" : "text-grey"}`} />
              <span className="truncate">
                {aiProvider === "gemini"
                  ? "IA Gemini activée"
                  : aiProvider === "deepseek"
                  ? "IA DeepSeek activée"
                  : aiProvider === "none"
                  ? "Moteur de gabarits (IA non configurée)"
                  : "…"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditorOpen((v) => !v)}
                className="hidden items-center gap-1.5 border border-ink bg-paper px-2 py-1 text-xs text-ink transition hover:border-blue hover:text-blue xl:flex"
              >
                {editorOpen ? <PanelRightClose className="h-3.5 w-3.5" /> : <PanelRightOpen className="h-3.5 w-3.5" />}
                {editorOpen ? "Masquer l'éditeur" : "Afficher l'éditeur"}
              </button>
            </div>
          </footer>
        </main>

        {editorOpen && (
          <aside className="hidden w-[340px] shrink-0 border-l border-ink bg-paper xl:block">
            <EditorPanel />
          </aside>
        )}
      </div>

      {genOpen && <GenerateModal onClose={() => setGenOpen(false)} />}
      {importOpen && <ImportModal onClose={() => setImportOpen(false)} />}
      {presenting && <PresentationMode onClose={() => setPresenting(false)} />}
      {paywall && (
        <div className="fixed inset-0 z-[120]">
          <Paywall
            price={info?.price ?? 2500}
            exportPrice={info?.exportPrice ?? 250}
            defaultPlan={paywall}
            onSuccess={() => {
              setPaywall(null);
              const kind = pendingExport;
              setPendingExport(null);
              if (kind) onExport(kind);
            }}
          />
          <button
            onClick={() => {
              setPaywall(null);
              setPendingExport(null);
            }}
            className="absolute right-4 top-4 border border-ink bg-paper px-2 py-1 text-sm text-ink hover:border-blue hover:text-blue"
          >
            Fermer
          </button>
        </div>
      )}
    </div>
  );

  function moveBy(dir: -1 | 1) {
    const idx = presentation.slides.findIndex((s) => s.id === selectedSlide?.id);
    const target = idx + dir;
    if (idx < 0 || target < 0 || target >= presentation.slides.length) return;
    selectSlide(presentation.slides[target].id);
  }
}

function CanvasArea({ onPrev, onNext }: { onPrev: () => void; onNext: () => void }) {
  const { presentation, selectedSlide } = useStore();
  const { ref, width, height } = useElementSize<HTMLDivElement>();
  const scale = Math.max(0.12, Math.min((width - 96) / 1280, (height - 72) / 720));

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT") return;
      if (e.key === "ArrowRight") onNext();
      else if (e.key === "ArrowLeft") onPrev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onPrev, onNext]);

  const slide = selectedSlide ?? presentation.slides[0];
  const currentIndex = selectedSlide ? presentation.slides.findIndex((s) => s.id === selectedSlide.id) : 0;

  return (
    <div
      ref={ref}
      className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden"
      style={{
        backgroundImage:
          "linear-gradient(rgba(10,10,10,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(10,10,10,0.06) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }}
    >
      {slide && (
        <div className="border border-ink shadow-hard-sm" style={{ width: 1280 * scale, height: 720 * scale }}>
          <SlideCanvas slide={slide} themeId={presentation.themeId} scale={scale} index={currentIndex} />
        </div>
      )}

      <button
        onClick={onPrev}
        className="absolute left-2 top-1/2 -translate-y-1/2 border border-ink bg-paper p-1.5 text-ink transition hover:bg-blue hover:text-paper md:left-3 md:p-2"
      >
        <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
      </button>
      <button
        onClick={onNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 border border-ink bg-paper p-1.5 text-ink transition hover:bg-blue hover:text-paper md:right-3 md:p-2"
      >
        <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
      </button>

      <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-2 border border-ink bg-paper px-2 py-1 md:hidden">
        <span className="font-mono text-[11px] font-semibold text-ink">
          {String(currentIndex + 1).padStart(2, "0")} / {presentation.slides.length}
        </span>
      </div>
    </div>
  );
}
