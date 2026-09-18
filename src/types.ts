export type ThemeId =
  | "brutalist"
  | "constructivist"
  | "zen"
  | "modern"
  | "executive"
  | "studio"
  | "luxe"
  | "terminal"
  | "coral"
  | "cyberpunk";

export type TypologyId =
  | "course"
  | "lab"
  | "defense"
  | "pitch"
  | "corporate"
  | "technical";

export type SlideTypeId =
  | "title"
  | "bullets"
  | "problem-solution"
  | "cards"
  | "metrics"
  | "definition"
  | "lab"
  | "workflow"
  | "comparison"
  | "timeline"
  | "conclusion";

export interface CardItem {
  id: string;
  title: string;
  body: string;
}

export interface MetricItem {
  id: string;
  value: string;
  label: string;
}

export interface StepItem {
  id: string;
  title: string;
  body: string;
  command?: string;
  output?: string;
}

export interface TimelineItem {
  id: string;
  date: string;
  title: string;
  body: string;
}

export interface ComparisonRow {
  id: string;
  label: string;
  left: string;
  right: string;
}

export interface DefinitionItem {
  term: string;
  statement: string;
  formula?: string;
  examples: string[];
  counterExamples: string[];
}

export interface Slide {
  id: string;
  type: SlideTypeId;
  title: string;
  subtitle?: string;
  kicker?: string;
  bullets?: string[];
  cards?: CardItem[];
  metrics?: MetricItem[];
  steps?: StepItem[];
  timeline?: TimelineItem[];
  comparison?: { leftTitle: string; rightTitle: string; rows: ComparisonRow[] };
  definition?: DefinitionItem;
  left?: { title: string; points: string[] };
  right?: { title: string; points: string[] };
  conclusion?: string;
  image?: string;
  notes?: string;
  juryQuestion?: string;
  juryAnswer?: string;
}

export interface Presentation {
  id: string;
  title: string;
  subtitle?: string;
  author?: string;
  themeId: ThemeId;
  typologyId: TypologyId;
  slides: Slide[];
  createdAt: number;
  updatedAt: number;
}

export interface GenerationRequest {
  brief: string;
  typology: TypologyId;
  slideCount: number;
  language: "fr" | "en";
  title?: string;
}

export interface GenerationResponse {
  presentation: Presentation;
  source: "gemini" | "template";
  model?: string;
  image?: string;
}
