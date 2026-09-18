import { useRef, useState } from "react";
import { Plus, Copy, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { useStore } from "../store";
import { SlideCanvas } from "./SlideCanvas";
import { SLIDE_TYPES } from "../data/slideTypes";

const THUMB_SCALE = 0.132;

export function Sidebar() {
  const { presentation, selectedId, selectSlide, addSlide, duplicateSlide, deleteSlide, moveSlide, reorderSlide } = useStore();
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const dragOver = useRef<number | null>(null);

  const handleDrop = () => {
    if (dragIndex !== null && dragOver.current !== null && dragIndex !== dragOver.current) {
      reorderSlide(dragIndex, dragOver.current);
    }
    setDragIndex(null);
    dragOver.current = null;
  };

  return (
    <div className="flex h-full flex-col bg-paper">
      <div className="flex items-center justify-between border-b border-ink px-4 py-3">
        <div className="kicker">Diapositives</div>
        <span className="border border-ink px-2 py-0.5 font-mono text-xs font-semibold">{presentation.slides.length}</span>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {presentation.slides.map((s, i) => (
          <div
            key={s.id}
            draggable
            onDragStart={() => setDragIndex(i)}
            onDragOver={(e) => {
              e.preventDefault();
              dragOver.current = i;
            }}
            onDrop={handleDrop}
            onClick={() => selectSlide(s.id)}
            className={`group relative cursor-pointer border transition ${
              selectedId === s.id ? "border-ink outline-2 outline-offset-2 outline-blue" : "border-ink/20 hover:border-ink"
            }`}
          >
            <div className="absolute left-0 top-0 z-10 bg-ink px-1.5 py-0.5 font-mono text-[10px] font-bold text-paper">
              {String(i + 1).padStart(2, "0")}
            </div>
            <div className="absolute right-1 top-1 z-10 hidden items-center gap-0.5 group-hover:flex">
              <MiniBtn title="Monter" onClick={(e) => { e.stopPropagation(); moveSlide(s.id, -1); }} disabled={i === 0}><ChevronUp className="h-3.5 w-3.5" /></MiniBtn>
              <MiniBtn title="Descendre" onClick={(e) => { e.stopPropagation(); moveSlide(s.id, 1); }} disabled={i === presentation.slides.length - 1}><ChevronDown className="h-3.5 w-3.5" /></MiniBtn>
              <MiniBtn title="Dupliquer" onClick={(e) => { e.stopPropagation(); duplicateSlide(s.id); }}><Copy className="h-3.5 w-3.5" /></MiniBtn>
              <MiniBtn title="Supprimer" danger onClick={(e) => { e.stopPropagation(); deleteSlide(s.id); }}><Trash2 className="h-3.5 w-3.5" /></MiniBtn>
            </div>
            <div className="pointer-events-none overflow-hidden">
              <SlideCanvas slide={s} themeId={presentation.themeId} scale={THUMB_SCALE} index={i} />
            </div>
          </div>
        ))}

        <div className="flex flex-wrap gap-1.5 pt-2">
          {SLIDE_TYPES.map((t) => (
            <button
              key={t.id}
              title={t.name}
              onClick={() => addSlide(t.id)}
              className="flex items-center gap-1 border border-dashed border-ink/30 px-2 py-1 text-[11px] font-medium text-ink transition hover:border-blue hover:text-blue"
            >
              <Plus className="h-3 w-3" />
              {t.name.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function MiniBtn({ children, onClick, title, danger, disabled }: { children: React.ReactNode; onClick: (e: React.MouseEvent) => void; title: string; danger?: boolean; disabled?: boolean }) {
  return (
    <button
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-5 w-5 items-center justify-center border border-ink bg-paper text-ink transition disabled:opacity-30 ${
        danger ? "hover:bg-blue hover:text-paper" : "hover:bg-ink hover:text-paper"
      }`}
    >
      {children}
    </button>
  );
}
