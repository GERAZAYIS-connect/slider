import {
  Upload,
  Play,
  Download,
  FileText,
  FileDown,
  Palette,
  ChevronDown,
  Presentation as PresentationIcon,
  Loader2,
  Wand2,
  ArrowRight,
} from "lucide-react";
import { useStore } from "../store";
import { TYPOLOGIES } from "../data/typologies";
import { ThemePicker } from "./ThemePicker";
import { Dropdown } from "./Dropdown";
import type { TypologyId } from "../types";

export type ExportKind = "pptx" | "pdf" | "google";

interface TopBarProps {
  onGenerate: () => void;
  onImport: () => void;
  onPresent: () => void;
  onExport: (kind: ExportKind) => void;
  onImprove: () => void;
  onHome: () => void;
  improving: boolean;
  exporting: ExportKind | null;
}

export function TopBar({ onGenerate, onImport, onPresent, onExport, onImprove, onHome, improving, exporting }: TopBarProps) {
  const { presentation, setMeta, setTypology } = useStore();
  const currentTypo = TYPOLOGIES.find((t) => t.id === presentation.typologyId);
  const TypoIcon = currentTypo?.icon;

  const generateBtn = (label: boolean) => (
    <button onClick={onGenerate} className="btn btn-primary px-3.5 py-1.5">
      <span className="h-2 w-2 shrink-0 bg-blue" />
      {label && <span>Générer</span>}
      <ArrowRight className="h-4 w-4" />
    </button>
  );

  const importBtn = (label: boolean) => (
    <button onClick={onImport} className="btn btn-secondary px-3 py-1.5">
      <Upload className="h-4 w-4" />
      {label && <span>Importer</span>}
    </button>
  );

  const improveBtn = (label: boolean) => (
    <button
      onClick={onImprove}
      disabled={improving}
      className="btn btn-secondary px-3 py-1.5 disabled:opacity-40"
      title="Sublimer l'intégralité de la présentation avec l'IA"
    >
      {improving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
      {label && <span>Sublimer</span>}
    </button>
  );

  const presentBtn = (label: boolean) => (
    <button onClick={onPresent} className="btn bg-blue px-3.5 py-1.5 text-paper hover:bg-blue-bright">
      <Play className="h-4 w-4" />
      {label && <span>Présenter</span>}
      <ArrowRight className="h-4 w-4" />
    </button>
  );

  const typologyMenu = (
    <Dropdown
      width="w-72"
      button={(open) => (
        <>
          {TypoIcon && <TypoIcon className="h-4 w-4" />}
          <span className="hidden lg:inline">{currentTypo?.name}</span>
          <ChevronDown className={`h-3.5 w-3.5 transition ${open ? "rotate-180" : ""}`} />
        </>
      )}
    >
      {(close) => (
        <>
          {TYPOLOGIES.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTypology(t.id as TypologyId);
                close();
              }}
              className={`flex w-full items-start gap-3 border-b border-ink/15 px-3 py-2.5 text-left transition last:border-b-0 hover:bg-blue/5 ${
                presentation.typologyId === t.id ? "bg-blue/10" : ""
              }`}
            >
              <t.icon className="h-4 w-4 shrink-0 text-blue" />
              <span>
                <span className="block text-sm font-semibold text-ink">{t.name}</span>
                <span className="block text-xs text-grey">{t.description}</span>
              </span>
            </button>
          ))}
        </>
      )}
    </Dropdown>
  );

  const themeMenu = (
    <Dropdown
      position="left-0 md:right-0"
      width="w-80"
      button={(open) => (
        <>
          <Palette className="h-4 w-4" />
          <span className="hidden md:inline">Thème</span>
          <ChevronDown className={`h-3.5 w-3.5 transition ${open ? "rotate-180" : ""}`} />
        </>
      )}
    >
      {(close) => (
        <div className="p-3">
          <div className="kicker mb-2 text-grey">Styles visuels</div>
          <ThemePicker />
        </div>
      )}
    </Dropdown>
  );

  const exportMenu = (
    <Dropdown
      position="left-0 md:right-0"
      width="w-60"
      button={(open) => (
        <>
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          <span className="hidden md:inline">Exporter</span>
          <ChevronDown className={`h-3.5 w-3.5 transition ${open ? "rotate-180" : ""}`} />
        </>
      )}
    >
      {(close) => (
        <>
          <ExportItem icon={<FileDown className="h-4 w-4 text-blue" />} label="PowerPoint (.pptx)" desc="Natifs 16:9 + notes" onClick={() => { close(); onExport("pptx"); }} />
          <ExportItem icon={<FileText className="h-4 w-4 text-blue" />} label="PDF 16:9" desc="Vectoriel haute résolution" onClick={() => { close(); onExport("pdf"); }} />
          <ExportItem icon={<PresentationIcon className="h-4 w-4 text-blue" />} label="Google Slides" desc="Natifs via OAuth" onClick={() => { close(); onExport("google"); }} />
        </>
      )}
    </Dropdown>
  );

  return (
    <header className="shrink-0 border-b border-ink bg-paper">
      {/* Ligne 1 — commune */}
      <div className="flex h-12 items-center gap-2 px-3 md:h-14 md:gap-3 md:px-4">
        <button onClick={onHome} className="flex items-center gap-2 transition hover:text-blue" title="Accueil">
          <div className="h-4 w-4 shrink-0 bg-blue" />
          <span className="hidden text-sm font-extrabold uppercase tracking-widest sm:inline">Slider</span>
        </button>

        <div className="mx-1 hidden h-6 w-px bg-ink sm:block" />

        <input
          className="min-w-0 flex-1 border-b-2 border-transparent bg-transparent px-1 py-1.5 text-sm font-semibold outline-none transition focus:border-blue md:w-48 md:flex-none"
          value={presentation.title}
          onChange={(e) => setMeta({ title: e.target.value })}
          aria-label="Titre de la présentation"
        />

        {/* Desktop : spacer poussant les contrôles à droite */}
        <div className="hidden flex-1 md:block" />

        {/* Desktop : tous les contrôles */}
        <div className="hidden items-center gap-3 md:flex">
          {typologyMenu}
          {themeMenu}
          {importBtn(true)}
          {generateBtn(true)}
          {improveBtn(true)}
          {exportMenu}
          {presentBtn(true)}
        </div>

        {/* Mobile : bouton Présenter */}
        <div className="md:hidden">{presentBtn(false)}</div>
      </div>

      {/* Ligne 2 — mobile uniquement */}
      <div className="flex flex-wrap items-center gap-2 border-t border-ink/10 px-3 py-2 md:hidden">
        {generateBtn(false)}
        {importBtn(false)}
        {exportMenu}
        {themeMenu}
        {typologyMenu}
        {improveBtn(false)}
      </div>
    </header>
  );
}

function ExportItem({ icon, label, desc, onClick }: { icon: React.ReactNode; label: string; desc: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 border-b border-ink/15 px-3 py-2.5 text-left transition last:border-b-0 hover:bg-blue/5">
      {icon}
      <span>
        <span className="block text-sm font-semibold text-ink">{label}</span>
        <span className="block text-xs text-grey">{desc}</span>
      </span>
    </button>
  );
}
