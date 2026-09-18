import { useState } from "react";
import { X, Sparkles, Loader2, ArrowRight } from "lucide-react";
import { useStore } from "../store";
import { useToast } from "./Toast";
import { apiGenerate, aiSourceLabel } from "../lib/api";
import { saveProject } from "../lib/storage";
import { navigate } from "../lib/router";
import { TYPOLOGIES } from "../data/typologies";
import { uid } from "../lib/utils";
import type { GenerationRequest, TypologyId } from "../types";

interface GenerateModalProps {
  onClose: () => void;
}

export function GenerateModal({ onClose }: GenerateModalProps) {
  const { presentation, replacePresentation, setTypology } = useStore();
  const { push } = useToast();
  const [brief, setBrief] = useState("");
  const [title, setTitle] = useState("");
  const [typology, setTypologyLocal] = useState<TypologyId>(presentation.typologyId);
  const [slideCount, setSlideCount] = useState(10);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!brief.trim()) {
      push("Décrivez votre projet ou sujet avant de générer.", "error");
      return;
    }
    setLoading(true);
    try {
      const req: GenerationRequest = {
        brief: brief.trim(),
        typology,
        slideCount,
        language: "fr",
        title: title.trim() || undefined,
      };
      const result = await apiGenerate(req);
      const slides = result.slides;
      if (result.image) slides[0] = { ...slides[0], image: result.image };
      const p = {
        id: uid("pres"),
        title: title.trim() || brief.trim().slice(0, 60),
        subtitle: TYPOLOGIES.find((t) => t.id === typology)?.name,
        themeId: presentation.themeId,
        typologyId: typology,
        slides,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      replacePresentation(p);
      setTypology(typology);
      saveProject(p);
      const label = aiSourceLabel(result);
      push(
        label
          ? `Présentation générée (${label})`
          : "Présentation générée (moteur de gabarits — configurez GEMINI_API_KEY ou DEEPSEEK_API_KEY pour l'IA)",
        label ? "success" : "info"
      );
      navigate("#/editor");
      onClose();
    } catch (err) {
      push((err as Error).message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onMouseDown={onClose}>
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden border border-ink bg-paper shadow-hard"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-ink px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center gap-2.5">
            <span className="h-3 w-3 bg-blue" />
            <h2 className="text-base font-bold">Générer une présentation</h2>
          </div>
          <button onClick={onClose} className="text-grey transition hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
          <div>
            <label className="label">Sujet ou brief du projet</label>
            <textarea
              className="input resize-none"
              rows={4}
              autoFocus
              placeholder="Ex. Un cours sur les algorithmes de tri, un pitch deck pour une fintech, une soutenance de thèse en vision par ordinateur…"
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Titre (optionnel)</label>
            <input className="input" placeholder="Titre de la présentation" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div>
            <label className="label">Typologie</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {TYPOLOGIES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTypologyLocal(t.id)}
                  className={`flex items-start gap-2 border p-3 text-left transition ${
                    typology === t.id ? "border-blue bg-blue/5" : "border-ink/15 hover:border-ink"
                  }`}
                >
                  <t.icon className="h-4 w-4 shrink-0 text-blue" />
                  <span className="text-xs font-semibold leading-tight text-ink">{t.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">
              Nombre de diapositives : <span className="font-bold text-ink">{slideCount}</span>
            </label>
            <input
              type="range"
              min={3}
              max={100}
              value={slideCount}
              onChange={(e) => setSlideCount(Number(e.target.value))}
              className="w-full accent-blue"
            />
            <div className="flex justify-between font-mono text-[11px] text-grey">
              <span>03</span>
              <span>100</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-ink px-4 py-3 sm:px-6 sm:py-4">
          <button onClick={onClose} className="btn btn-secondary px-4 py-2">
            Annuler
          </button>
          <button onClick={submit} disabled={loading} className="btn btn-primary px-5 py-2 disabled:opacity-60">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? "Génération…" : "Générer"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
