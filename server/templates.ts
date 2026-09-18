import type {
  Slide,
  SlideTypeId,
  TypologyId,
  GenerationRequest,
} from "../src/types";
import { uid } from "./id";

// ---------------------------------------------------------------------------
// Moteur de gabarits structurés : secours fiable en l'absence de clé API.
// Produit des slides structurés, typés, avec notes d'orateur et anticipation
// de questions du jury pour la soutenance académique.
// ---------------------------------------------------------------------------

function slide(type: SlideTypeId, partial: Partial<Slide>): Slide {
  return {
    id: uid("slide"),
    type,
    title: partial.title ?? "",
    notes: partial.notes ?? "",
    ...partial,
  };
}

function topicOf(brief: string, title?: string): string {
  const t = (title ?? "").trim();
  if (t) return t;
  const clean = brief.trim().replace(/\s+/g, " ");
  if (clean.length <= 80) return clean;
  return clean.slice(0, 80).replace(/\s+\S*$/, "");
}

function firstSentence(brief: string): string {
  const s = brief.trim().split(/(?<=[.!?])\s+/)[0];
  return s && s.length > 0 ? s : brief.trim();
}

const LABEL_LIB: Record<TypologyId, { role: string; audience: string }> = {
  course: { role: "enseignant", audience: "étudiants" },
  lab: { role: "formateur", audience: "participants du TP" },
  defense: { role: "doctorant / candidat", audience: "jury" },
  pitch: { role: "fondateur", audience: "investisseurs" },
  corporate: { role: "dirigeant", audience: "comité de direction" },
  technical: { role: "architecte", audience: "équipe d'ingénierie" },
};

function speakerNote(role: string, audience: string, msg: string): string {
  return `[${role} → ${audience}] ${msg}`;
}

function buildTitleSlide(topic: string, typology: TypologyId): Slide {
  const labels: Record<TypologyId, string> = {
    course: "Cours · Module pédagogique",
    lab: "Travaux pratiques · Laboratoire",
    defense: "Soutenance · Thèse / Mémoire / PFE",
    pitch: "Pitch deck · Startup",
    corporate: "Rapport · Comité de direction",
    technical: "Documentation technique · Architecture",
  };
  return slide("title", {
    kicker: labels[typology],
    title: topic,
    subtitle: "Présentation professionnelle générée et sublimée par Slider.",
    bullets: [],
  });
}

function buildObjectivesSlide(topic: string, typology: TypologyId, lib: { role: string; audience: string }): Slide {
  return slide("cards", {
    kicker: "Objectifs",
    title: `Ce que vous saurez à la fin`,
    subtitle: topic,
    cards: [
      { id: uid("c"), title: "Comprendre", body: `Saisir les fondements de ${topic}.` },
      { id: uid("c"), title: "Appliquer", body: `Mettre en œuvre les notions clés sur un cas concret.` },
      { id: uid("c"), title: "Analyser", body: `Évaluer les résultats et identifier les limites.` },
      { id: uid("c"), title: "Synthétiser", body: `Restituer l'essentiel de manière structurée.` },
    ],
    notes: speakerNote(lib.role, lib.audience, "Annoncer les objectifs et cadrer les attentes dès le départ."),
  });
}

function buildPlanSlide(topic: string, typology: TypologyId, lib: { role: string; audience: string }): Slide {
  const items: Record<TypologyId, string[]> = {
    course: ["Contexte & enjeux", "Définitions formelles", "Théorèmes & propriétés", "Exemples & applications", "Synthèse & révision"],
    lab: ["Prérequis", "Environnement", "Étapes du protocole", "Vérification", "Livrable attendu"],
    defense: ["Contexte", "Problématique", "État de l'art", "Méthodologie", "Contributions & résultats"],
    pitch: ["Problème", "Solution", "Modèle économique", "Traction", "Levée de fonds"],
    corporate: ["Synthèse", "KPI d'impact", "Roadmap", "Risques", "Recommandations"],
    technical: ["Vue d'ensemble", "Composants", "Flux de données", "Sécurité", "Feuille de route"],
  };
  return slide("bullets", {
    kicker: "Plan",
    title: "Déroulé de la présentation",
    bullets: items[typology],
    notes: speakerNote(lib.role, lib.audience, "Présenter la structure pour rassurer et orienter l'auditoire."),
  });
}

function buildDefinitionSlide(topic: string, lib: { role: string; audience: string }): Slide {
  return slide("definition", {
    kicker: "Définition formelle",
    title: `Définition — ${topic}`,
    definition: {
      term: topic,
      statement: `Une définition précise et opératoire du concept « ${topic} », formulée pour être réutilisable sans ambiguïté.`,
      formula: "∀ x ∈ E,  P(x) ⟺ Q(x)",
      examples: ["Cas canonique illustrant directement la définition.", "Exemple d'application dans un contexte réel."],
      counterExamples: ["Cas limite qui ne satisfait pas la définition.", "Contre-exemple classique pour éviter la confusion."],
    },
    notes: speakerNote(lib.role, lib.audience, "Énoncer le terme, la définition, la formule, puis les exemples et contre-exemples."),
  });
}

function buildProblemSolutionSlide(topic: string, lib: { role: string; audience: string }): Slide {
  return slide("problem-solution", {
    kicker: "Problème vs Solution",
    title: "De la contrainte à la réponse",
    left: {
      title: "Problème",
      points: [
        "Contrainte forte ou besoin non couvert.",
        `Manque d'outils adaptés autour de ${topic}.`,
        "Coût, lenteur ou complexité excessive.",
      ],
    },
    right: {
      title: "Solution",
      points: [
        "Approche unifiée et ciblée.",
        "Résultats mesurables et rapides.",
        "Adoption simple et évolutive.",
      ],
    },
    notes: speakerNote(lib.role, lib.audience, "Opposer clairement le problème identifié à la solution proposée."),
  });
}

function buildMetricsSlide(topic: string, lib: { role: string; audience: string }): Slide {
  return slide("metrics", {
    kicker: "Métriques",
    title: "Chiffres clés",
    metrics: [
      { id: uid("m"), value: "3×", label: "Gain d'efficacité estimé" },
      { id: uid("m"), value: "98 %", label: "Fiabilité / disponibilité" },
      { id: uid("m"), value: "24 h", label: "Délai de mise en œuvre" },
      { id: uid("m"), value: "0", label: "Friction d'adoption" },
    ],
    notes: speakerNote(lib.role, lib.audience, "Mettre en avant des chiffres percutants, un chiffre par zone."),
  });
}

function buildLabSlide(step: number, topic: string, lib: { role: string; audience: string }): Slide {
  return slide("lab", {
    kicker: `Étape ${step}`,
    title: `Manipulation — étape ${step}`,
    steps: [
      {
        id: uid("s"),
        title: `Étape ${step}`,
        body: `Effectuer la manipulation ${step} relative à ${topic}.`,
        command: step === 1 ? "npm install && npm run setup" : `./run --step ${step} --topic "${topic}"`,
        output: `✓ Étape ${step} exécutée avec succès\n→ Résultat conforme aux attentes`,
      },
    ],
    notes: speakerNote(lib.role, lib.audience, `Guider l'étape ${step} : commande exacte, résultat attendu, piège à éviter.`),
  });
}

function buildWorkflowSlide(topic: string, lib: { role: string; audience: string }): Slide {
  return slide("workflow", {
    kicker: "Processus",
    title: "Architecture & étapes",
    steps: [
      { id: uid("s"), title: "Collecte", body: `Rassembler les données et le contexte de ${topic}.` },
      { id: uid("s"), title: "Traitement", body: "Transformer et structurer l'information." },
      { id: uid("s"), title: "Validation", body: "Contrôler la qualité et la cohérence." },
      { id: uid("s"), title: "Diffusion", body: "Restituer et partager les résultats." },
    ],
    notes: speakerNote(lib.role, lib.audience, "Dérouler le processus de gauche à droite, une étape à la fois."),
  });
}

function buildComparisonSlide(topic: string, lib: { role: string; audience: string }): Slide {
  return slide("comparison", {
    kicker: "Comparatif",
    title: "Deux approches face à face",
    comparison: {
      leftTitle: "Approche classique",
      rightTitle: "Approche Slider",
      rows: [
        { id: uid("r"), label: "Temps de production", left: "Plusieurs jours", right: "Quelques minutes" },
        { id: uid("r"), label: "Cohérence visuelle", left: "Variable", right: "Garantie par thème" },
        { id: uid("r"), label: "Réutilisation", left: "Limitée", right: "Totale" },
      ],
    },
    notes: speakerNote(lib.role, lib.audience, "Souligner le contraste ligne par ligne pour renforcer le propos."),
  });
}

function buildTimelineSlide(topic: string, lib: { role: string; audience: string }): Slide {
  return slide("timeline", {
    kicker: "Feuille de route",
    title: "Jalons & déploiement",
    timeline: [
      { id: uid("t"), date: "T1", title: "Cadrage", body: "Définir le périmètre et les objectifs." },
      { id: uid("t"), date: "T2", title: "Prototype", body: "Valider la faisabilité sur un cas réel." },
      { id: uid("t"), date: "T3", title: "Industrialisation", body: "Passer à l'échelle et fiabiliser." },
      { id: uid("t"), date: "T4", title: "Généralisation", body: "Étendre à l'ensemble du périmètre." },
    ],
    notes: speakerNote(lib.role, lib.audience, "Ancrer la trajectoire dans le temps avec des jalons mesurables."),
  });
}

function buildConclusionSlide(topic: string, typology: TypologyId, lib: { role: string; audience: string }): Slide {
  const ctas: Record<TypologyId, string> = {
    course: "Réviser les définitions clés et préparer l'examen.",
    lab: "Rendre le compte-rendu du TP avant la prochaine séance.",
    defense: "Merci de votre attention — place aux questions du jury.",
    pitch: "Rejoignez-nous — levée de fonds ouverte.",
    corporate: "Valider les arbitrages et lancer la prochaine étape.",
    technical: "Adopter l'architecture proposée et planifier le déploiement.",
  };
  return slide("conclusion", {
    kicker: "Conclusion",
    title: "Synthèse & prochaines étapes",
    conclusion: `${firstSentence(topic)} — retenir l'essentiel et passer à l'action.`,
    bullets: ["Point clé n°1 à retenir.", "Point clé n°2 à retenir.", ctas[typology]],
    notes: speakerNote(lib.role, lib.audience, "Conclure avec une synthèse forte et un appel à action explicite."),
  });
}

function buildDefenseSlide(topic: string, typology: TypologyId, index: number, total: number, lib: { role: string; audience: string }): Slide {
  const patterns = [
    () =>
      slide("problem-solution", {
        kicker: "Problématique",
        title: "Problématique formelle",
        left: { title: "Constat", points: ["Écart entre l'existant et le besoin.", "Limites de l'état de l'art."] },
        right: { title: "Question de recherche", points: [`Comment améliorer ${topic} de façon mesurable ?`] },
        juryQuestion: "Pourquoi cette problématique est-elle pertinente aujourd'hui ?",
        juryAnswer: "Elle répond à un verrou non résolu, avec un impact mesurable et des données disponibles.",
        notes: speakerNote(lib.role, lib.audience, "Formuler la problématique de manière précise et défendable."),
      }),
    () =>
      slide("workflow", {
        kicker: "Méthodologie",
        title: "Démarche scientifique",
        steps: [
          { id: uid("s"), title: "État de l'art", body: "Recenser et critiquer les travaux existants." },
          { id: uid("s"), title: "Modélisation", body: "Formaliser le problème et les hypothèses." },
          { id: uid("s"), title: "Expérimentation", body: "Prototyper, mesurer, itérer." },
          { id: uid("s"), title: "Validation", body: "Comparer aux baselines et publier." },
        ],
        juryQuestion: "Comment garantissez-vous la reproductibilité de vos résultats ?",
        juryAnswer: "Environnements versionnés, jeux de données documentés et protocoles automatisés.",
        notes: speakerNote(lib.role, lib.audience, "Justifier chaque choix méthodologique."),
      }),
    () =>
      slide("metrics", {
        kicker: "Résultats",
        title: "Contributions & évaluation",
        metrics: [
          { id: uid("m"), value: "+25 %", label: "Amélioration vs baseline" },
          { id: uid("m"), value: "3", label: "Contributions principales" },
          { id: uid("m"), value: "2", label: "Publications / dépôts" },
        ],
        juryQuestion: "Quelle est la principale limite de votre approche ?",
        juryAnswer: "La généralisation à d'autres domaines reste à valider sur des données plus larges.",
        notes: speakerNote(lib.role, lib.audience, "Assumer les limites tout en valorisant les contributions."),
      }),
  ];
  return patterns[index % patterns.length]();
}

export function generateFromTemplate(req: GenerationRequest): Slide[] {
  const lib = LABEL_LIB[req.typology];
  const topic = topicOf(req.brief, req.title);
  const count = Math.max(3, Math.min(100, req.slideCount || 10));
  const slides: Slide[] = [];

  slides.push(buildTitleSlide(topic, req.typology));

  if (count >= 3) slides.push(buildPlanSlide(topic, req.typology, lib));

  const bodyStart = slides.length;
  let i = bodyStart;
  let stepCounter = 1;
  const patterns: Array<() => Slide> = [];

  if (req.typology === "lab") {
    while (i < count - 1) {
      patterns.push(() => buildLabSlide(stepCounter++, topic, lib));
      i++;
    }
  } else if (req.typology === "defense") {
    const defPatterns: Array<() => Slide> = [
      () => buildObjectivesSlide(topic, req.typology, lib),
      () => buildDefenseSlide(topic, req.typology, i, count, lib),
      () => buildWorkflowSlide(topic, lib),
      () => buildMetricsSlide(topic, lib),
      () => buildComparisonSlide(topic, lib),
      () => buildTimelineSlide(topic, lib),
    ];
    let di = 0;
    while (i < count - 1) {
      slides.push(defPatterns[di % defPatterns.length]());
      di++;
      i++;
    }
  } else {
    const genPatterns: Array<() => Slide> = [
      () => buildObjectivesSlide(topic, req.typology, lib),
      () => buildDefinitionSlide(topic, lib),
      () => buildProblemSolutionSlide(topic, lib),
      () => buildMetricsSlide(topic, lib),
      () => buildWorkflowSlide(topic, lib),
      () => buildComparisonSlide(topic, lib),
      () => buildTimelineSlide(topic, lib),
    ];
    let gi = 0;
    while (i < count - 1) {
      slides.push(genPatterns[gi % genPatterns.length]());
      gi++;
      i++;
    }
  }

  slides.push(buildConclusionSlide(topic, req.typology, lib));

  return slides.slice(0, count);
}
