import { Check } from "lucide-react";
import { THEMES } from "../data/themes";
import { useStore } from "../store";

export function ThemePicker({ compact = false }: { compact?: boolean }) {
  const { presentation, setTheme } = useStore();
  const current = presentation.themeId;

  if (compact) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {THEMES.map((t) => (
          <button
            key={t.id}
            title={t.name}
            onClick={() => setTheme(t.id)}
            className={`group relative flex h-12 items-center justify-center overflow-hidden border transition ${
              current === t.id ? "border-blue outline-2 outline-offset-2 outline-blue" : "border-ink/20 hover:border-ink"
            }`}
            style={{ background: t.background }}
          >
            <span className="h-3 w-3" style={{ background: t.accent }} />
            <span className="absolute bottom-1 left-2 right-2 truncate text-[9px] font-medium" style={{ color: t.ink }}>
              {t.name}
            </span>
            {current === t.id && (
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center bg-blue text-paper">
                <Check className="h-3 w-3" />
              </span>
            )}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {THEMES.map((t) => (
        <button
          key={t.id}
          onClick={() => setTheme(t.id)}
          className={`relative overflow-hidden border text-left transition ${
            current === t.id ? "border-blue outline-2 outline-offset-2 outline-blue" : "border-ink/20 hover:border-ink"
          }`}
          style={{ background: t.background }}
        >
          <div className="flex h-16 flex-col justify-between p-2" style={{ color: t.ink }}>
            <div className="flex items-center gap-1.5">
              <span className="h-3.5 w-3.5" style={{ background: t.accent }} />
              <span className="text-[11px] font-semibold">{t.name}</span>
            </div>
            <div className="space-y-1">
              <div className="h-1 w-4/5" style={{ background: t.ink, opacity: 0.85 }} />
              <div className="h-1 w-3/5" style={{ background: t.ink, opacity: 0.35 }} />
            </div>
          </div>
          {current === t.id && (
            <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center bg-blue text-paper">
              <Check className="h-3 w-3" />
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
