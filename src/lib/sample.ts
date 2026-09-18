import type { Presentation, Slide, SlideTypeId, ThemeId } from "../types";
import { uid, newId } from "./utils";

function slide(type: SlideTypeId, partial: Partial<Slide>): Slide {
  return { id: uid("slide"), type, title: partial.title ?? "", ...partial };
}

export function createBlankPresentation(themeId: ThemeId, title = "Présentation sans titre"): Presentation {
  const t = slide("title", { kicker: "Nouvelle présentation", title, subtitle: "Ajoutez, générez ou importez des diapositives." });
  const agenda = slide("bullets", { kicker: "Plan", title: "Sommaire", bullets: ["Contexte", "Objectifs", "Points clés", "Conclusion"] });
  const end = slide("conclusion", { kicker: "Conclusion", title: "Merci", conclusion: "À vous de jouer." });
  return {
    id: uid("pres"),
    title,
    themeId,
    typologyId: "pitch",
    slides: [t, agenda, end],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function createSamplePresentation(themeId: ThemeId, name: string): Presentation {
  const title = `Présentation ${name}`;
  const t = slide("title", {
    kicker: "Modèle",
    title,
    subtitle: "Un aperçu de la direction artistique de ce thème — titres, cartes, métriques et conclusion.",
  });
  const pillars = slide("cards", {
    kicker: "Vision",
    title: "Piliers de votre projet",
    cards: [
      { id: newId(), title: "Clarté", body: "Une idée par diapositive, une hiérarchie mathématique." },
      { id: newId(), title: "Impact", body: "Des visuels percutants et une grille stricte." },
      { id: newId(), title: "Cohérence", body: "Le même langage graphique appliqué partout." },
    ],
  });
  const metrics = slide("metrics", {
    kicker: "Métriques",
    title: "Chiffres clés",
    metrics: [
      { id: newId(), value: "3×", label: "Gain d'efficacité" },
      { id: newId(), value: "98 %", label: "Fiabilité" },
      { id: newId(), value: "24 h", label: "Mise en œuvre" },
    ],
  });
  const end = slide("conclusion", {
    kicker: "Conclusion",
    title: "Merci",
    conclusion: "Remplacez ce contenu par le vôtre.",
    bullets: ["Point clé n°1", "Point clé n°2"],
  });
  return {
    id: uid("pres"),
    title,
    themeId,
    typologyId: "pitch",
    slides: [t, pillars, metrics, end],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
