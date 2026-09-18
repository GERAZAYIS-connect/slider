import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { Presentation, Slide, SlideTypeId, ThemeId, TypologyId } from "./types";
import { uid } from "./lib/utils";

interface StoreValue {
  presentation: Presentation;
  selectedId: string | null;
  selectedSlide: Slide | null;
  selectSlide: (id: string) => void;
  setTheme: (t: ThemeId) => void;
  setTypology: (t: TypologyId) => void;
  setMeta: (patch: Partial<Pick<Presentation, "title" | "subtitle" | "author">>) => void;
  setSlides: (slides: Slide[]) => void;
  replacePresentation: (p: Presentation) => void;
  updateSlide: (id: string, patch: Partial<Slide>) => void;
  addSlide: (type: SlideTypeId, atIndex?: number) => void;
  duplicateSlide: (id: string) => void;
  deleteSlide: (id: string) => void;
  moveSlide: (id: string, dir: -1 | 1) => void;
  reorderSlide: (from: number, to: number) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

function createBlankSlide(type: SlideTypeId = "bullets"): Slide {
  const base: Slide = { id: uid("slide"), type, title: "Nouvelle diapositive" };
  switch (type) {
    case "title":
      return { ...base, subtitle: "Sous-titre", kicker: "Introduction" };
    case "cards":
      return {
        ...base,
        cards: [
          { id: uid("c"), title: "Carte 1", body: "Description" },
          { id: uid("c"), title: "Carte 2", body: "Description" },
          { id: uid("c"), title: "Carte 3", body: "Description" },
        ],
      };
    case "metrics":
      return {
        ...base,
        metrics: [
          { id: uid("m"), value: "42", label: "Métrique" },
          { id: uid("m"), value: "3×", label: "Métrique" },
          { id: uid("m"), value: "98 %", label: "Métrique" },
        ],
      };
    case "definition":
      return {
        ...base,
        definition: {
          term: "Terme",
          statement: "Énoncé théorique précis.",
          formula: "∀ x ∈ E, P(x)",
          examples: ["Exemple 1"],
          counterExamples: ["Contre-exemple"],
        },
      };
    case "lab":
      return {
        ...base,
        steps: [
          { id: uid("s"), title: "Étape 1", body: "Instruction", command: "npm run step", output: "✓ ok" },
        ],
      };
    case "workflow":
      return {
        ...base,
        steps: [
          { id: uid("s"), title: "Étape 1", body: "Description" },
          { id: uid("s"), title: "Étape 2", body: "Description" },
          { id: uid("s"), title: "Étape 3", body: "Description" },
        ],
      };
    case "comparison":
      return {
        ...base,
        comparison: {
          leftTitle: "Option A",
          rightTitle: "Option B",
          rows: [
            { id: uid("r"), label: "Critère", left: "A", right: "B" },
            { id: uid("r"), label: "Critère", left: "A", right: "B" },
          ],
        },
      };
    case "timeline":
      return {
        ...base,
        timeline: [
          { id: uid("t"), date: "T1", title: "Jalon", body: "Description" },
          { id: uid("t"), date: "T2", title: "Jalon", body: "Description" },
          { id: uid("t"), date: "T3", title: "Jalon", body: "Description" },
        ],
      };
    case "problem-solution":
      return {
        ...base,
        left: { title: "Problème", points: ["Point 1", "Point 2"] },
        right: { title: "Solution", points: ["Point 1", "Point 2"] },
      };
    case "conclusion":
      return { ...base, conclusion: "Message de conclusion.", bullets: ["Point clé"] };
    case "bullets":
    default:
      return { ...base, bullets: ["Point 1", "Point 2", "Point 3"] };
  }
}

function createInitialPresentation(): Presentation {
  const title = createBlankSlide("title");
  title.title = "Votre présentation";
  title.subtitle = "Générez, éditez et sublimez vos slides en quelques clics.";
  title.kicker = "Bienvenue";

  const agenda = createBlankSlide("bullets");
  agenda.title = "Sommaire";
  agenda.kicker = "Plan";
  agenda.bullets = ["Contexte", "Objectifs", "Points clés", "Conclusion"];

  const pillars = createBlankSlide("cards");
  pillars.title = "Piliers de votre projet";
  pillars.kicker = "Vision";
  pillars.cards = [
    { id: uid("c"), title: "Clarté", body: "Une idée par diapositive." },
    { id: uid("c"), title: "Impact", body: "Des visuels percutants et structurés." },
    { id: uid("c"), title: "Cohérence", body: "Un thème graphique appliqué partout." },
  ];

  const end = createBlankSlide("conclusion");
  end.title = "Merci";
  end.kicker = "Conclusion";
  end.conclusion = "Passons à la création de votre première présentation.";

  return {
    id: uid("pres"),
    title: "Présentation sans titre",
    themeId: "brutalist",
    typologyId: "pitch",
    slides: [title, agenda, pillars, end],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function ensureUniqueIds(slides: Slide[]): Slide[] {
  const seen = new Set<string>();
  return slides.map((s) => {
    if (!s.id || seen.has(s.id)) {
      const fresh = { ...s, id: uid("slide") };
      seen.add(fresh.id);
      return fresh;
    }
    seen.add(s.id);
    return s;
  });
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [presentation, setPresentation] = useState<Presentation>(createInitialPresentation);  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedSlide = useMemo(
    () => presentation.slides.find((s) => s.id === selectedId) ?? null,
    [presentation.slides, selectedId]
  );

  const selectSlide = useCallback((id: string) => setSelectedId(id), []);

  const touch = useCallback((p: Presentation): Presentation => ({ ...p, updatedAt: Date.now() }), []);

  const setTheme = useCallback(
    (t: ThemeId) => setPresentation((p) => touch({ ...p, themeId: t })),
    [touch]
  );
  const setTypology = useCallback(
    (t: TypologyId) => setPresentation((p) => touch({ ...p, typologyId: t })),
    [touch]
  );
  const setMeta = useCallback(
    (patch: Partial<Pick<Presentation, "title" | "subtitle" | "author">>) =>
      setPresentation((p) => touch({ ...p, ...patch })),
    [touch]
  );
  const setSlides = useCallback(
    (slides: Slide[]) => setPresentation((p) => touch({ ...p, slides: ensureUniqueIds(slides) })),
    [touch]
  );
  const replacePresentation = useCallback(
    (p: Presentation) => {
      const normalized = { ...p, slides: ensureUniqueIds(p.slides) };
      setPresentation(touch(normalized));
      setSelectedId(normalized.slides[0]?.id ?? null);
    },
    [touch]
  );

  const updateSlide = useCallback(
    (id: string, patch: Partial<Slide>) =>
      setPresentation((p) =>
        touch({
          ...p,
          slides: p.slides.map((s) => (s.id === id ? { ...s, ...patch } : s)),
        })
      ),
    [touch]
  );

  const addSlide = useCallback(
    (type: SlideTypeId, atIndex?: number) => {
      const slide = createBlankSlide(type);
      setPresentation((p) => {
        const slides = [...p.slides];
        const idx = atIndex ?? slides.length;
        slides.splice(idx, 0, slide);
        return touch({ ...p, slides });
      });
      setSelectedId(slide.id);
    },
    [touch]
  );

  const duplicateSlide = useCallback(
    (id: string) =>
      setPresentation((p) => {
        const idx = p.slides.findIndex((s) => s.id === id);
        if (idx < 0) return p;
        const copy: Slide = {
          ...JSON.parse(JSON.stringify(p.slides[idx])),
          id: uid("slide"),
        };
        const slides = [...p.slides];
        slides.splice(idx + 1, 0, copy);
        setSelectedId(copy.id);
        return touch({ ...p, slides });
      }),
    [touch]
  );

  const deleteSlide = useCallback(
    (id: string) =>
      setPresentation((p) => {
        const slides = p.slides.filter((s) => s.id !== id);
        return touch({ ...p, slides });
      }),
    [touch]
  );

  const moveSlide = useCallback(
    (id: string, dir: -1 | 1) =>
      setPresentation((p) => {
        const idx = p.slides.findIndex((s) => s.id === id);
        const target = idx + dir;
        if (idx < 0 || target < 0 || target >= p.slides.length) return p;
        const slides = [...p.slides];
        [slides[idx], slides[target]] = [slides[target], slides[idx]];
        return touch({ ...p, slides });
      }),
    [touch]
  );

  const reorderSlide = useCallback(
    (from: number, to: number) =>
      setPresentation((p) => {
        const slides = [...p.slides];
        const [moved] = slides.splice(from, 1);
        slides.splice(to, 0, moved);
        return touch({ ...p, slides });
      }),
    [touch]
  );

  const value: StoreValue = {
    presentation,
    selectedId,
    selectedSlide,
    selectSlide,
    setTheme,
    setTypology,
    setMeta,
    setSlides,
    replacePresentation,
    updateSlide,
    addSlide,
    duplicateSlide,
    deleteSlide,
    moveSlide,
    reorderSlide,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore doit être utilisé dans <StoreProvider>");
  return ctx;
}
