import { useCallback, useEffect, useState } from "react";
import { Sparkles, Upload, Plus, Trash2, ArrowRight, FolderOpen, LayoutGrid, CreditCard } from "lucide-react";
import { useStore } from "../store";
import { useToast } from "./Toast";
import { THEMES } from "../data/themes";
import { SlideCanvas } from "./SlideCanvas";
import { GenerateModal } from "./GenerateModal";
import { ImportModal } from "./ImportModal";
import { Paywall } from "./Paywall";
import { useSubscription } from "../hooks/useSubscription";
import { listProjects, deleteProject, saveProject } from "../lib/storage";
import { navigate } from "../lib/router";
import { createBlankPresentation, createSamplePresentation } from "../lib/sample";
import type { Presentation } from "../types";

const THUMB = 0.156;

export function Home() {
  const { replacePresentation } = useStore();
  const { push } = useToast();
  const { info } = useSubscription();
  const [projects, setProjects] = useState<Presentation[]>([]);
  const [genOpen, setGenOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);

  useEffect(() => {
    setProjects(listProjects());
  }, []);

  const openProject = useCallback(
    (p: Presentation) => {
      replacePresentation(p);
      navigate("#/editor");
    },
    [replacePresentation]
  );

  const startBlank = () => {
    const p = createBlankPresentation("constructivist");
    replacePresentation(p);
    saveProject(p);
    navigate("#/editor");
  };

  const startFromTheme = (themeId: Presentation["themeId"], name: string) => {
    const p = createSamplePresentation(themeId, name);
    replacePresentation(p);
    saveProject(p);
    navigate("#/editor");
  };

  const removeProject = (id: string) => {
    deleteProject(id);
    setProjects(listProjects());
    push("Projet supprimé.", "info");
  };

  return (
    <div className="app-shell flex flex-col overflow-y-auto bg-paper text-ink">
      <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b border-ink bg-paper px-4 md:px-6">
        <div className="flex items-center gap-2.5">
          <div className="h-4 w-4 bg-blue" />
          <span className="text-sm font-extrabold uppercase tracking-widest">Slider</span>
        </div>
        <div className="flex items-center gap-2">
          {info?.configured && (
            <button
              onClick={() => setPayOpen(true)}
              className={`btn px-3 py-1.5 ${
                info.active ? "border border-ink bg-paper text-ink hover:border-blue" : "bg-blue text-paper hover:bg-blue-bright"
              }`}
            >
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">{info.active ? "Abonnement actif" : `S'abonner — ${info.price} FCFA`}</span>
              <span className="sm:hidden">Abonner</span>
            </button>
          )}
          <button onClick={() => setImportOpen(true)} className="btn btn-secondary px-3 py-1.5">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Importer</span>
          </button>
          <button onClick={() => setGenOpen(true)} className="btn btn-primary px-3.5 py-1.5">
            <span className="h-2 w-2 bg-blue" />
            <span>Générer</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 md:py-16">
        <section className="border-b border-ink/15 pb-10">
          <div className="kicker text-grey">Studio de présentation</div>
          <h1 className="mt-3 max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">
            Des présentations <em className="italic text-blue">sublimées</em>, générées en quelques clics.
          </h1>
          <p className="mt-5 max-w-2xl text-base text-grey md:text-lg">
            Générez, importez et sublimez des decks PowerPoint, Google Slides et PDF 16:9 — avec 10 directions artistiques distinctes et un rendu fidèle, en ligne comme hors-ligne.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button onClick={() => setGenOpen(true)} className="btn btn-primary px-5 py-2.5">
              <Sparkles className="h-4 w-4" />
              Générer une présentation
              <ArrowRight className="h-4 w-4" />
            </button>
            <button onClick={() => setImportOpen(true)} className="btn btn-secondary px-5 py-2.5">
              <Upload className="h-4 w-4" />
              Importer un .pptx
            </button>
            <button onClick={startBlank} className="btn btn-ghost px-4 py-2.5 text-grey hover:text-ink">
              <Plus className="h-4 w-4" />
              Commencer vide
            </button>
          </div>
        </section>

        {projects.length > 0 && (
          <section className="py-10">
            <div className="mb-5 flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-blue" />
              <h2 className="text-sm font-bold uppercase tracking-widest">Projets récents</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p) => (
                <div key={p.id} className="group relative cursor-pointer border border-ink/20 transition hover:border-ink" onClick={() => openProject(p)}>
                  <div className="overflow-hidden">
                    <SlideCanvas slide={p.slides[0] ?? { id: "x", type: "title", title: p.title }} themeId={p.themeId} scale={THUMB} />
                  </div>
                  <div className="flex items-center justify-between border-t border-ink/15 px-3 py-2.5">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{p.title}</div>
                      <div className="text-xs text-grey">{p.slides.length} diapositives</div>
                    </div>
                    <button
                      title="Supprimer"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeProject(p.id);
                      }}
                      className="shrink-0 p-1 text-grey opacity-0 transition hover:text-blue group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="py-10">
          <div className="mb-5 flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-blue" />
            <h2 className="text-sm font-bold uppercase tracking-widest">Modèles disponibles</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => startFromTheme(t.id, t.name)}
                className="group relative cursor-pointer overflow-hidden border border-ink/20 text-left transition hover:border-ink"
              >
                <div className="overflow-hidden">
                  <SlideCanvas slide={createSamplePresentation(t.id, t.name).slides[0]} themeId={t.id} scale={THUMB} />
                </div>
                <div className="flex items-center justify-between border-t border-ink/15 px-3 py-2.5">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{t.name}</div>
                    <div className="truncate text-xs text-grey">{t.tagline}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-grey transition group-hover:translate-x-0.5 group-hover:text-blue" />
                </div>
              </button>
            ))}
          </div>
        </section>

        <footer className="border-t border-ink/15 py-6 text-center text-xs text-grey">
          Slider — génération, édition et sublimation de présentations. Fonctionne hors-ligne.
        </footer>
      </main>

      {genOpen && <GenerateModal onClose={() => setGenOpen(false)} />}
      {importOpen && <ImportModal onClose={() => setImportOpen(false)} />}
      {payOpen && (
        <div className="fixed inset-0 z-[120]">
          <Paywall price={info?.price ?? 2500} exportPrice={info?.exportPrice ?? 250} onSuccess={() => window.location.reload()} />
          <button
            onClick={() => setPayOpen(false)}
            className="absolute right-4 top-4 border border-ink bg-paper px-2 py-1 text-sm text-ink hover:border-blue hover:text-blue"
          >
            Fermer
          </button>
        </div>
      )}
    </div>
  );
}
