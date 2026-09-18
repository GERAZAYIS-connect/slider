import { useCallback, useRef, useState } from "react";
import { X, Upload, FileSpreadsheet, Loader2, Sparkles, Layers, ArrowRight } from "lucide-react";
import { useStore } from "../store";
import { useToast } from "./Toast";
import { parsePptx, condenseSlides, type ParsedPptx } from "../lib/pptxParser";
import { apiImprove, aiSourceLabel } from "../lib/api";
import { saveProject } from "../lib/storage";
import { navigate } from "../lib/router";
import { uid } from "../lib/utils";
import type { Slide } from "../types";

interface ImportModalProps {
  onClose: () => void;
}

type Mode = "integral" | "synthesis";

export function ImportModal({ onClose }: ImportModalProps) {
  const { presentation, replacePresentation } = useStore();
  const { push } = useToast();
  const [parsed, setParsed] = useState<ParsedPptx | null>(null);
  const [fileName, setFileName] = useState("");
  const [parsing, setParsing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [mode, setMode] = useState<Mode>("integral");
  const [target, setTarget] = useState(15);
  const [useAi, setUseAi] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      if (!/\.pptx$/i.test(file.name)) {
        push("Veuillez sélectionner un fichier .pptx", "error");
        return;
      }
      setFileName(file.name);
      setParsing(true);
      try {
        const result = await parsePptx(file);
        setParsed(result);
        setTarget(Math.max(5, Math.min(30, Math.round(result.totalSlides / 5))));
      } catch (err) {
        push("Impossible de lire ce fichier PPTX.", "error");
        console.error(err);
      } finally {
        setParsing(false);
      }
    },
    [push]
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const importNow = async () => {
    if (!parsed) return;
    setProcessing(true);
    try {
      let slides: Slide[] = mode === "synthesis" ? condenseSlides(parsed.slides, target) : parsed.slides;

      if (useAi) {
        const instruction =
          mode === "synthesis"
            ? `Condense fidèlement cette présentation en ${target} diapositives percutantes en préservant le contenu essentiel.`
            : "Sublime l'intégralité du contenu en conservant 100% des informations et du sens.";
        try {
          const result = await apiImprove(slides, instruction, presentation.typologyId);
          slides = result.slides;
          const label = aiSourceLabel(result);
          push(label ? `Sublimation IA (${label})` : "Import terminé (IA non configurée)", label ? "success" : "info");
        } catch (err) {
          push("Sublimation IA indisponible — import direct effectué.", "info");
        }
      } else {
        push(`${slides.length} diapositives importées.`, "success");
      }

      const p = {
        id: uid("pres"),
        title: parsed.title,
        themeId: presentation.themeId,
        typologyId: presentation.typologyId,
        slides,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      replacePresentation(p);
      saveProject(p);
      navigate("#/editor");
      onClose();
    } catch (err) {
      push((err as Error).message, "error");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onMouseDown={onClose}>
      <div
        className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden border border-ink bg-paper shadow-hard"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-ink px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center gap-2.5">
            <span className="h-3 w-3 bg-blue" />
            <h2 className="text-base font-bold">Importer un PowerPoint</h2>
          </div>
          <button onClick={onClose} className="text-grey transition hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {!parsed ? (
            <div
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={`flex cursor-pointer flex-col items-center justify-center border-2 border-dashed p-12 text-center transition ${
                dragging ? "border-blue bg-blue/5" : "border-ink/25 hover:border-ink"
              }`}
            >
              {parsing ? (
                <>
                  <Loader2 className="mb-3 h-8 w-8 animate-spin text-blue" />
                  <p className="text-sm font-medium">Analyse du fichier…</p>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="mb-3 h-10 w-10 text-blue" />
                  <p className="text-sm font-semibold">Glissez-déposez votre fichier .pptx</p>
                  <p className="mt-1 text-xs text-grey">ou cliquez pour parcourir — jusqu'à 160+ diapositives</p>
                </>
              )}
              <input ref={inputRef} type="file" accept=".pptx" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center gap-3 border border-ink p-3">
                <FileSpreadsheet className="h-6 w-6 text-blue" />
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{fileName}</div>
                  <div className="text-xs text-grey">{parsed.totalSlides} diapositives détectées</div>
                </div>
              </div>

              <div>
                <label className="label">Mode de traitement</label>
                <div className="grid grid-cols-2 gap-2">
                  <ModeCard
                    active={mode === "integral"}
                    icon={<Layers className="h-4 w-4" />}
                    title="Mode Intégral"
                    desc={`Conserver les ${parsed.totalSlides} diapositives`}
                    onClick={() => setMode("integral")}
                  />
                  <ModeCard
                    active={mode === "synthesis"}
                    icon={<Sparkles className="h-4 w-4" />}
                    title="Mode Synthèse"
                    desc={`Condenser en ${target} diapositives`}
                    onClick={() => setMode("synthesis")}
                  />
                </div>
              </div>

              {mode === "synthesis" && (
                <div>
                  <label className="label">
                    Nombre de diapositives cible : <span className="font-bold text-ink">{target}</span>
                  </label>
                  <input
                    type="range"
                    min={5}
                    max={Math.min(30, parsed.totalSlides)}
                    value={target}
                    onChange={(e) => setTarget(Number(e.target.value))}
                    className="w-full accent-blue"
                  />
                </div>
              )}

              <label className="flex cursor-pointer items-center gap-3 border border-ink p-3">
                <input type="checkbox" checked={useAi} onChange={(e) => setUseAi(e.target.checked)} className="h-4 w-4 accent-blue" />
                <span>
                  <span className="block text-sm font-medium">Sublimer avec l'IA</span>
                  <span className="block text-xs text-grey">Améliore mise en page, clarté et notes d'orateur</span>
                </span>
              </label>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-ink px-4 py-3 sm:px-6 sm:py-4">
          <button onClick={onClose} className="btn btn-secondary px-4 py-2">
            Annuler
          </button>
          <button onClick={importNow} disabled={!parsed || processing} className="btn btn-primary px-5 py-2 disabled:opacity-60">
            {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {processing ? "Import…" : "Importer"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ModeCard({ active, icon, title, desc, onClick }: { active: boolean; icon: React.ReactNode; title: string; desc: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-start gap-3 border p-3 text-left transition ${
        active ? "border-blue bg-blue/5" : "border-ink/15 hover:border-ink"
      }`}
    >
      <span className="mt-0.5 text-blue">{icon}</span>
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-xs text-grey">{desc}</span>
      </span>
    </button>
  );
}
