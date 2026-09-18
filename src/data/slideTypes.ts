import type { SlideTypeId } from "../types";

export interface SlideTypeMeta {
  id: SlideTypeId;
  name: string;
  description: string;
}

export const SLIDE_TYPES: SlideTypeMeta[] = [
  { id: "title", name: "Titre & Accroche", description: "Couverture percutante" },
  { id: "bullets", name: "Liste à puces", description: "Points structurés" },
  { id: "problem-solution", name: "Problème vs Solution", description: "Opposition claire" },
  { id: "cards", name: "Caractéristiques & Piliers", description: "Cartes structurées" },
  { id: "metrics", name: "Métriques & KPI", description: "Chiffres clés" },
  { id: "definition", name: "Définition Formelle", description: "Terme, énoncé, formule" },
  { id: "lab", name: "Manipulation Labo / TP", description: "Console & code" },
  { id: "workflow", name: "Architecture & Étapes", description: "Processus séquentiel" },
  { id: "comparison", name: "Tableau Comparatif", description: "Deux colonnes" },
  { id: "timeline", name: "Chronologie / Roadmap", description: "Feuille de route" },
  { id: "conclusion", name: "Synthèse & Conclusion", description: "Clôture & appel à action" },
];

export function getSlideType(id: SlideTypeId): SlideTypeMeta {
  return SLIDE_TYPES.find((t) => t.id === id) ?? SLIDE_TYPES[0];
}
