import {
  GraduationCap,
  FlaskConical,
  Award,
  Rocket,
  BarChart3,
  Cpu,
  type LucideIcon,
} from "lucide-react";
import type { TypologyId } from "../types";

export interface Typology {
  id: TypologyId;
  name: string;
  icon: LucideIcon;
  description: string;
  structures: string[];
  speakerNoteHint: string;
}

export const TYPOLOGIES: Typology[] = [
  {
    id: "course",
    name: "Cours Universitaire",
    icon: GraduationCap,
    description: "Objectifs didactiques, définitions formelles et fiches de révision.",
    structures: [
      "Page de titre du cours",
      "Objectifs pédagogiques",
      "Plan du cours",
      "Définition formelle (terme, énoncé, formule)",
      "Exemples & contre-exemples",
      "Théorème ou propriété clé",
      "Démonstration ou intuition",
      "Application pratique",
      "Synthèse du chapitre",
      "Fiche de révision / questions d'examen",
    ],
    speakerNoteHint:
      "Annoncer l'objectif, définir précisément, illustrer, puis vérifier la compréhension.",
  },
  {
    id: "lab",
    name: "Travaux Pratiques & Labo",
    icon: FlaskConical,
    description: "Format guidé pas-à-pas avec étapes Lab, commandes et sorties console.",
    structures: [
      "Titre du TP",
      "Objectifs du TP",
      "Prérequis & environnement",
      "Étape 1 — commande + sortie attendue",
      "Étape 2 — commande + sortie attendue",
      "Étape 3 — commande + sortie attendue",
      "Vérification & tests",
      "Erreurs fréquentes",
      "Conclusion & livrable",
    ],
    speakerNoteHint:
      "Guider pas-à-pas : numéro d'étape, commande exacte, résultat attendu, piège à éviter.",
  },
  {
    id: "defense",
    name: "Soutenance Académique",
    icon: Award,
    description: "Thèse, mémoire ou PFE : problématique, verrous, contributions, questions du jury.",
    structures: [
      "Page de titre (auteur, encadrant, établissement)",
      "Contexte & motivation",
      "Problématique formelle",
      "État de l'art & limites",
      "Verrous techniques / scientifiques",
      "Méthodologie",
      "Contributions",
      "Résultats & évaluation",
      "Limites & perspectives",
      "Conclusion",
    ],
    speakerNoteHint:
      "Chaque slide anticipe une « question probable du jury » avec la réponse recommandée.",
  },
  {
    id: "pitch",
    name: "Pitch Deck & Startup",
    icon: Rocket,
    description: "Problème marché, solution unifiée, traction chiffrée et levée de fonds.",
    structures: [
      "Accroche & vision",
      "Problème marché",
      "Solution unifiée",
      "Produit / démo",
      "Modèle économique",
      "Traction & métriques",
      "Marché & concurrence",
      "Équipe",
      "Levée de fonds (ask)",
      "Feuille de route",
    ],
    speakerNoteHint:
      "Rythme rapide, chiffres percutants, une idée par slide, toujours orienter vers l'action.",
  },
  {
    id: "corporate",
    name: "Rapport d'Entreprise",
    icon: BarChart3,
    description: "Comités de direction, KPI d'impact et roadmap trimestrielle.",
    structures: [
      "Page de couverture exécutive",
      "Synthèse de direction",
      "KPI d'impact",
      "Performance par département",
      "Analyse & constats",
      "Roadmap trimestrielle",
      "Jalons de déploiement",
      "Risques & arbitrages",
      "Recommandations",
      "Prochaines étapes",
    ],
    speakerNoteHint:
      "Structurer la décision : chiffre clé, constat, recommandation, prochaine étape.",
  },
  {
    id: "technical",
    name: "Architecture & Documentation Technique",
    icon: Cpu,
    description: "Diagrammes, flux de données, standards de sécurité et performance.",
    structures: [
      "Titre & périmètre",
      "Vue d'ensemble de l'architecture",
      "Composants & services",
      "Flux de données",
      "Modèle de données",
      "Sécurité & conformité",
      "Performance & scalabilité",
      "Déploiement & ops",
      "Trade-offs & décisions",
      "Feuille de route technique",
    ],
    speakerNoteHint:
      "Expliciter chaque décision d'architecture par un compromis mesurable (latence, coût, sécurité).",
  },
];

export function getTypology(id: TypologyId): Typology {
  return TYPOLOGIES.find((t) => t.id === id) ?? TYPOLOGIES[0];
}
