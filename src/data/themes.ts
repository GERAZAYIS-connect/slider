import type { ThemeId } from "../types";

export type HeaderAlign = "left" | "center";
export type KickerStyle = "square" | "line" | "dot" | "prompt" | "diamond" | "bracket" | "dash";
export type BulletStyle = "square" | "circle" | "dash" | "diamond" | "chevron" | "prompt";
export type CardStyle = "hard" | "soft" | "line" | "ascii" | "neon" | "borderless" | "image-led";
export type MetricStyle = "box" | "plain" | "serif" | "neon" | "mono";
export type ImageStyle = "grayscale" | "duotone" | "fullbleed" | "inset" | "terminal" | "glitch";
export type Decoration = "grid" | "diagonal" | "none" | "scanline" | "hairline";

export interface ThemeLayout {
  headerAlign: HeaderAlign;
  headerRule: boolean;
  kickerStyle: KickerStyle;
  bulletStyle: BulletStyle;
  cardStyle: CardStyle;
  metricStyle: MetricStyle;
  imageStyle: ImageStyle;
  decoration: Decoration;
  sectionNumber: boolean;
  keywordAccent: boolean;
  titleItalic: boolean;
}

export interface ThemePalette {
  id: ThemeId;
  name: string;
  tagline: string;
  background: string;
  surface: string;
  ink: string;
  muted: string;
  accent: string;
  accentInk: string;
  border: string;
  grid: string;
  fontHeading: string;
  fontBody: string;
  fontMono: string;
  radius: number;
  uppercaseKickers: boolean;
  layout: ThemeLayout;
}

export const THEMES: ThemePalette[] = [
  {
    id: "brutalist",
    name: "Grille Brutaliste",
    tagline: "Suisse · Müller-Brockmann",
    background: "#FAF9F6",
    surface: "#FFFFFF",
    ink: "#0E0E10",
    muted: "#5B5B5B",
    accent: "#E63946",
    accentInk: "#FFFFFF",
    border: "#0E0E10",
    grid: "rgba(14,14,16,0.12)",
    fontHeading: "'Inter', 'Segoe UI', sans-serif",
    fontBody: "'Inter', 'Segoe UI', sans-serif",
    fontMono: "'JetBrains Mono', 'Consolas', monospace",
    radius: 0,
    uppercaseKickers: true,
    layout: {
      headerAlign: "left",
      headerRule: false,
      kickerStyle: "square",
      bulletStyle: "square",
      cardStyle: "hard",
      metricStyle: "box",
      imageStyle: "grayscale",
      decoration: "grid",
      sectionNumber: true,
      keywordAccent: false,
      titleItalic: false,
    },
  },
  {
    id: "constructivist",
    name: "Constructiviste Bleu",
    tagline: "Suisse · El Lissitzky",
    background: "#FAF9F6",
    surface: "#FFFFFF",
    ink: "#0A0A0A",
    muted: "#6B6B6B",
    accent: "#1E40AF",
    accentInk: "#FAF9F6",
    border: "#0A0A0A",
    grid: "rgba(10,10,10,0.12)",
    fontHeading: "'Poppins', 'Plus Jakarta Sans', sans-serif",
    fontBody: "'Poppins', 'Inter', sans-serif",
    fontMono: "'JetBrains Mono', 'Consolas', monospace",
    radius: 0,
    uppercaseKickers: true,
    layout: {
      headerAlign: "left",
      headerRule: false,
      kickerStyle: "square",
      bulletStyle: "chevron",
      cardStyle: "hard",
      metricStyle: "box",
      imageStyle: "duotone",
      decoration: "diagonal",
      sectionNumber: true,
      keywordAccent: true,
      titleItalic: false,
    },
  },
  {
    id: "zen",
    name: "Minimaliste Zen",
    tagline: "Espace négatif généreux",
    background: "#FBFAF8",
    surface: "#FFFFFF",
    ink: "#1A1A1A",
    muted: "#7A7A76",
    accent: "#1A1A1A",
    accentInk: "#FFFFFF",
    border: "#E5E3DE",
    grid: "rgba(26,26,26,0.05)",
    fontHeading: "'Inter', 'Segoe UI', sans-serif",
    fontBody: "'Inter', 'Segoe UI', sans-serif",
    fontMono: "'JetBrains Mono', 'Consolas', monospace",
    radius: 12,
    uppercaseKickers: false,
    layout: {
      headerAlign: "center",
      headerRule: true,
      kickerStyle: "dot",
      bulletStyle: "dash",
      cardStyle: "borderless",
      metricStyle: "plain",
      imageStyle: "inset",
      decoration: "none",
      sectionNumber: false,
      keywordAccent: false,
      titleItalic: false,
    },
  },
  {
    id: "modern",
    name: "Moderne & Épuré",
    tagline: "Accents bleu indigo",
    background: "#F5F7FB",
    surface: "#FFFFFF",
    ink: "#111827",
    muted: "#5B6577",
    accent: "#4F46E5",
    accentInk: "#FFFFFF",
    border: "#E2E8F0",
    grid: "rgba(79,70,229,0.06)",
    fontHeading: "'Inter', 'Segoe UI', sans-serif",
    fontBody: "'Inter', 'Segoe UI', sans-serif",
    fontMono: "'JetBrains Mono', 'Consolas', monospace",
    radius: 14,
    uppercaseKickers: false,
    layout: {
      headerAlign: "center",
      headerRule: true,
      kickerStyle: "line",
      bulletStyle: "circle",
      cardStyle: "soft",
      metricStyle: "plain",
      imageStyle: "fullbleed",
      decoration: "none",
      sectionNumber: false,
      keywordAccent: false,
      titleItalic: false,
    },
  },
  {
    id: "executive",
    name: "Entreprise Exécutive",
    tagline: "Marine & ardoise",
    background: "#F4F6F8",
    surface: "#FFFFFF",
    ink: "#0F2440",
    muted: "#55627A",
    accent: "#1E3A5F",
    accentInk: "#FFFFFF",
    border: "#D9DFE8",
    grid: "rgba(15,36,64,0.06)",
    fontHeading: "'Inter', 'Segoe UI', sans-serif",
    fontBody: "'Inter', 'Segoe UI', sans-serif",
    fontMono: "'JetBrains Mono', 'Consolas', monospace",
    radius: 8,
    uppercaseKickers: false,
    layout: {
      headerAlign: "left",
      headerRule: true,
      kickerStyle: "line",
      bulletStyle: "square",
      cardStyle: "line",
      metricStyle: "plain",
      imageStyle: "inset",
      decoration: "hairline",
      sectionNumber: false,
      keywordAccent: false,
      titleItalic: false,
    },
  },
  {
    id: "studio",
    name: "Créatif Studio",
    tagline: "Ambre & terracotta",
    background: "#FBF4EC",
    surface: "#FFFFFF",
    ink: "#2A1F18",
    muted: "#7C6A5B",
    accent: "#C66A3D",
    accentInk: "#FFFFFF",
    border: "#E8D8C8",
    grid: "rgba(198,106,61,0.07)",
    fontHeading: "'Playfair Display', 'Georgia', serif",
    fontBody: "'Inter', 'Segoe UI', sans-serif",
    fontMono: "'JetBrains Mono', 'Consolas', monospace",
    radius: 16,
    uppercaseKickers: false,
    layout: {
      headerAlign: "left",
      headerRule: false,
      kickerStyle: "dash",
      bulletStyle: "dash",
      cardStyle: "image-led",
      metricStyle: "serif",
      imageStyle: "duotone",
      decoration: "diagonal",
      sectionNumber: true,
      keywordAccent: false,
      titleItalic: true,
    },
  },
  {
    id: "luxe",
    name: "Élégant Luxe",
    tagline: "Sérif & accents dorés",
    background: "#0E0E10",
    surface: "#17171A",
    ink: "#F5F1E8",
    muted: "#A9A294",
    accent: "#C9A227",
    accentInk: "#0E0E10",
    border: "#2A2A2E",
    grid: "rgba(245,241,232,0.06)",
    fontHeading: "'Playfair Display', 'Cinzel', serif",
    fontBody: "'Inter', 'Segoe UI', sans-serif",
    fontMono: "'JetBrains Mono', 'Consolas', monospace",
    radius: 4,
    uppercaseKickers: true,
    layout: {
      headerAlign: "center",
      headerRule: true,
      kickerStyle: "diamond",
      bulletStyle: "diamond",
      cardStyle: "line",
      metricStyle: "serif",
      imageStyle: "duotone",
      decoration: "hairline",
      sectionNumber: false,
      keywordAccent: false,
      titleItalic: false,
    },
  },
  {
    id: "terminal",
    name: "Technique Terminal",
    tagline: "Monospace & système",
    background: "#0D1117",
    surface: "#161B22",
    ink: "#E6EDF3",
    muted: "#8B949E",
    accent: "#3FB950",
    accentInk: "#0D1117",
    border: "#30363D",
    grid: "rgba(230,237,243,0.05)",
    fontHeading: "'JetBrains Mono', 'Consolas', monospace",
    fontBody: "'JetBrains Mono', 'Consolas', monospace",
    fontMono: "'JetBrains Mono', 'Consolas', monospace",
    radius: 6,
    uppercaseKickers: true,
    layout: {
      headerAlign: "left",
      headerRule: false,
      kickerStyle: "prompt",
      bulletStyle: "prompt",
      cardStyle: "ascii",
      metricStyle: "mono",
      imageStyle: "terminal",
      decoration: "none",
      sectionNumber: false,
      keywordAccent: false,
      titleItalic: false,
    },
  },
  {
    id: "coral",
    name: "Dynamique Corail",
    tagline: "Énergie à fort impact",
    background: "#FFF6F0",
    surface: "#FFFFFF",
    ink: "#241A1A",
    muted: "#8A6F6B",
    accent: "#FF5A5F",
    accentInk: "#FFFFFF",
    border: "#F6DCD5",
    grid: "rgba(255,90,95,0.07)",
    fontHeading: "'Inter', 'Segoe UI', sans-serif",
    fontBody: "'Inter', 'Segoe UI', sans-serif",
    fontMono: "'JetBrains Mono', 'Consolas', monospace",
    radius: 20,
    uppercaseKickers: false,
    layout: {
      headerAlign: "center",
      headerRule: true,
      kickerStyle: "dot",
      bulletStyle: "circle",
      cardStyle: "soft",
      metricStyle: "box",
      imageStyle: "fullbleed",
      decoration: "none",
      sectionNumber: false,
      keywordAccent: false,
      titleItalic: false,
    },
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk Futuriste",
    tagline: "Néon sombre de rupture",
    background: "#05060F",
    surface: "#0B0D1C",
    ink: "#E8F0FF",
    muted: "#7C86AD",
    accent: "#00F0FF",
    accentInk: "#05060F",
    border: "#1B2140",
    grid: "rgba(0,240,255,0.08)",
    fontHeading: "'Inter', 'Segoe UI', sans-serif",
    fontBody: "'Inter', 'Segoe UI', sans-serif",
    fontMono: "'JetBrains Mono', 'Consolas', monospace",
    radius: 2,
    uppercaseKickers: true,
    layout: {
      headerAlign: "left",
      headerRule: false,
      kickerStyle: "bracket",
      bulletStyle: "chevron",
      cardStyle: "neon",
      metricStyle: "neon",
      imageStyle: "glitch",
      decoration: "scanline",
      sectionNumber: true,
      keywordAccent: false,
      titleItalic: false,
    },
  },
];

export function getTheme(id: ThemeId): ThemePalette {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

export function isDarkTheme(id: ThemeId): boolean {
  return id === "luxe" || id === "terminal" || id === "cyberpunk";
}
