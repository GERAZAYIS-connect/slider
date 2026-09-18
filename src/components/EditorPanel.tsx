import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { useStore } from "../store";
import { SLIDE_TYPES } from "../data/slideTypes";
import type { Slide, SlideTypeId } from "../types";
import { newId } from "../lib/utils";

export function EditorPanel() {
  const { selectedSlide, updateSlide, presentation } = useStore();
  if (!selectedSlide) {
    return (
      <div className="flex h-full w-full items-center justify-center p-6 text-center text-sm text-grey">
        Sélectionnez une diapositive pour l'éditer.
      </div>
    );
  }
  const isDefense = presentation.typologyId === "defense";
  return (
    <div className="flex h-full flex-col overflow-hidden bg-paper">
      <div className="flex items-center justify-between border-b border-ink px-4 py-3">
        <div className="kicker">Éditeur</div>
        <span className="border border-ink px-2 py-0.5 text-xs font-medium text-ink">
          {SLIDE_TYPES.find((t) => t.id === selectedSlide.type)?.name}
        </span>
      </div>
      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        <Field label="Catégorie">
          <select
            className="input"
            value={selectedSlide.type}
            onChange={(e) => updateSlide(selectedSlide.id, { type: e.target.value as SlideTypeId })}
          >
            {SLIDE_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Kicker (surtitre)">
          <input
            className="input"
            value={selectedSlide.kicker ?? ""}
            placeholder="Ex. Introduction"
            onChange={(e) => updateSlide(selectedSlide.id, { kicker: e.target.value })}
          />
        </Field>

        <Field label="Titre">
          <textarea
            className="input resize-none"
            rows={2}
            value={selectedSlide.title}
            onChange={(e) => updateSlide(selectedSlide.id, { title: e.target.value })}
          />
        </Field>

        {(selectedSlide.type === "title" || selectedSlide.subtitle !== undefined) && (
          <Field label="Sous-titre">
            <textarea
              className="input resize-none"
              rows={2}
              value={selectedSlide.subtitle ?? ""}
              onChange={(e) => updateSlide(selectedSlide.id, { subtitle: e.target.value })}
            />
          </Field>
        )}

        <TypeFields slide={selectedSlide} update={updateSlide} />

        {isDefense && (
          <div className="space-y-4 border border-blue bg-blue/5 p-3">
            <div className="kicker text-blue">Anticipation jury</div>
            <Field label="Question probable du jury">
              <textarea className="input resize-none" rows={2} value={selectedSlide.juryQuestion ?? ""} onChange={(e) => updateSlide(selectedSlide.id, { juryQuestion: e.target.value })} />
            </Field>
            <Field label="Réponse recommandée">
              <textarea className="input resize-none" rows={2} value={selectedSlide.juryAnswer ?? ""} onChange={(e) => updateSlide(selectedSlide.id, { juryAnswer: e.target.value })} />
            </Field>
          </div>
        )}

        <Field label="Notes d'orateur">
          <textarea
            className="input resize-none"
            rows={4}
            value={selectedSlide.notes ?? ""}
            placeholder="Notes visibles en mode présentateur…"
            onChange={(e) => updateSlide(selectedSlide.id, { notes: e.target.value })}
          />
        </Field>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="label">{label}</div>
      {children}
    </div>
  );
}

function TypeFields({ slide, update }: { slide: Slide; update: (id: string, patch: Partial<Slide>) => void }) {
  switch (slide.type) {
    case "bullets":
    case "conclusion":
      return <StringList label={slide.type === "conclusion" ? "Points clés" : "Puces"} values={slide.bullets ?? []} onChange={(bullets) => update(slide.id, { bullets })} />;
    case "cards":
      return (
        <CardList
          values={slide.cards ?? []}
          onChange={(cards) => update(slide.id, { cards })}
        />
      );
    case "metrics":
      return (
        <div>
          <div className="label">Métriques</div>
          {(slide.metrics ?? []).map((m, i) => (
            <div key={m.id} className="mb-2 flex gap-2">
              <input className="input w-24" value={m.value} placeholder="42" onChange={(e) => updateMetric(slide, update, m.id, { value: e.target.value })} />
              <input className="input flex-1" value={m.label} placeholder="Libellé" onChange={(e) => updateMetric(slide, update, m.id, { label: e.target.value })} />
              <IconBtn onClick={() => removeMetric(slide, update, m.id)}><Trash2 className="h-4 w-4" /></IconBtn>
            </div>
          ))}
          <AddBtn label="Ajouter une métrique" onClick={() => addMetric(slide, update)} />
        </div>
      );
    case "definition":
      return <DefinitionFields slide={slide} update={update} />;
    case "lab":
      return <StepList steps={slide.steps ?? []} onChange={(steps) => update(slide.id, { steps })} withConsole />;
    case "workflow":
      return <StepList steps={slide.steps ?? []} onChange={(steps) => update(slide.id, { steps })} />;
    case "comparison":
      return <ComparisonFields slide={slide} update={update} />;
    case "timeline":
      return <TimelineFields slide={slide} update={update} />;
    case "problem-solution":
      return <ProblemSolutionFields slide={slide} update={update} />;
    case "title":
      return null;
    default:
      return null;
  }
}

function AddBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button className="btn btn-ghost w-full border border-dashed border-ink/30 text-grey transition hover:border-blue hover:text-blue" onClick={onClick}>
      <Plus className="h-4 w-4" /> {label}
    </button>
  );
}

function IconBtn({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title?: string }) {
  return (
    <button type="button" title={title} onClick={onClick} className="flex h-9 w-9 shrink-0 items-center justify-center border border-transparent text-grey transition hover:border-ink hover:text-blue">
      {children}
    </button>
  );
}

function StringList({ label, values, onChange }: { label: string; values: string[]; onChange: (v: string[]) => void }) {
  return (
    <div>
      {label && <div className="label">{label}</div>}
      {values.map((v, i) => (
        <div key={i} className="mb-2 flex items-start gap-2">
          <span className="mt-2 font-mono text-xs font-semibold text-grey">{String(i + 1).padStart(2, "0")}</span>
          <textarea className="input flex-1 resize-none" rows={2} value={v} onChange={(e) => onChange(values.map((x, j) => (j === i ? e.target.value : x)))} />
          <IconBtn onClick={() => onChange(values.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></IconBtn>
        </div>
      ))}
      <AddBtn label="Ajouter" onClick={() => onChange([...values, ""])} />
    </div>
  );
}

function CardList({ values, onChange }: { values: { id: string; title: string; body: string }[]; onChange: (v: any[]) => void }) {
  return (
    <div>
      <div className="label">Cartes</div>
      {values.map((c, i) => (
        <div key={c.id} className="mb-3 border border-ink/15 p-2">
          <div className="mb-1 flex items-center justify-between">
            <span className="font-mono text-xs font-semibold text-grey">Carte {String(i + 1).padStart(2, "0")}</span>
            <IconBtn onClick={() => onChange(values.filter((x) => x.id !== c.id))}><Trash2 className="h-4 w-4" /></IconBtn>
          </div>
          <input className="input mb-1" value={c.title} placeholder="Titre" onChange={(e) => onChange(values.map((x) => (x.id === c.id ? { ...x, title: e.target.value } : x)))} />
          <textarea className="input resize-none" rows={2} value={c.body} placeholder="Description" onChange={(e) => onChange(values.map((x) => (x.id === c.id ? { ...x, body: e.target.value } : x)))} />
        </div>
      ))}
      <AddBtn label="Ajouter une carte" onClick={() => onChange([...values, { id: newId(), title: "", body: "" }])} />
    </div>
  );
}

function StepList({ steps, onChange, withConsole }: { steps: any[]; onChange: (v: any[]) => void; withConsole?: boolean }) {
  return (
    <div>
      <div className="label">Étapes</div>
      {steps.map((s, i) => (
        <div key={s.id} className="mb-3 border border-ink/15 p-2">
          <div className="mb-1 flex items-center justify-between">
            <span className="font-mono text-xs font-semibold text-grey">Étape {String(i + 1).padStart(2, "0")}</span>
            <IconBtn onClick={() => onChange(steps.filter((x) => x.id !== s.id))}><Trash2 className="h-4 w-4" /></IconBtn>
          </div>
          <input className="input mb-1" value={s.title} placeholder="Titre" onChange={(e) => onChange(steps.map((x) => (x.id === s.id ? { ...x, title: e.target.value } : x)))} />
          <textarea className="input resize-none" rows={2} value={s.body} placeholder="Description / instruction" onChange={(e) => onChange(steps.map((x) => (x.id === s.id ? { ...x, body: e.target.value } : x)))} />
          {withConsole && (
            <>
              <input className="input mb-1 mt-1 font-mono text-xs" value={s.command ?? ""} placeholder="Commande (ex. npm run build)" onChange={(e) => onChange(steps.map((x) => (x.id === s.id ? { ...x, command: e.target.value } : x)))} />
              <textarea className="input resize-none font-mono text-xs" rows={2} value={s.output ?? ""} placeholder="Sortie console attendue" onChange={(e) => onChange(steps.map((x) => (x.id === s.id ? { ...x, output: e.target.value } : x)))} />
            </>
          )}
        </div>
      ))}
      <AddBtn label="Ajouter une étape" onClick={() => onChange([...steps, { id: newId(), title: "", body: "" }])} />
    </div>
  );
}

function DefinitionFields({ slide, update }: { slide: Slide; update: (id: string, patch: Partial<Slide>) => void }) {
  const d = slide.definition ?? { term: "", statement: "", formula: "", examples: [], counterExamples: [] };
  const set = (patch: Partial<typeof d>) => update(slide.id, { definition: { ...d, ...patch } });
  return (
    <div className="space-y-3">
      <Field label="Terme">
        <input className="input" value={d.term} onChange={(e) => set({ term: e.target.value })} />
      </Field>
      <Field label="Énoncé théorique">
        <textarea className="input resize-none" rows={2} value={d.statement} onChange={(e) => set({ statement: e.target.value })} />
      </Field>
      <Field label="Formule">
        <input className="input font-mono" value={d.formula ?? ""} onChange={(e) => set({ formula: e.target.value })} />
      </Field>
      <StringList label="Exemples" values={d.examples} onChange={(examples) => set({ examples })} />
      <StringList label="Contre-exemples" values={d.counterExamples} onChange={(counterExamples) => set({ counterExamples })} />
    </div>
  );
}

function ComparisonFields({ slide, update }: { slide: Slide; update: (id: string, patch: Partial<Slide>) => void }) {
  const c = slide.comparison ?? { leftTitle: "", rightTitle: "", rows: [] };
  const set = (patch: Partial<typeof c>) => update(slide.id, { comparison: { ...c, ...patch } });
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input className="input" value={c.leftTitle} placeholder="Colonne gauche" onChange={(e) => set({ leftTitle: e.target.value })} />
        <input className="input" value={c.rightTitle} placeholder="Colonne droite" onChange={(e) => set({ rightTitle: e.target.value })} />
      </div>
      <div className="label">Lignes</div>
      {c.rows.map((r, i) => (
        <div key={r.id} className="mb-2 flex items-center gap-2">
          <input className="input w-1/3" value={r.label} placeholder="Critère" onChange={(e) => set({ rows: c.rows.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
          <input className="input" value={r.left} onChange={(e) => set({ rows: c.rows.map((x, j) => (j === i ? { ...x, left: e.target.value } : x)) })} />
          <input className="input" value={r.right} onChange={(e) => set({ rows: c.rows.map((x, j) => (j === i ? { ...x, right: e.target.value } : x)) })} />
          <IconBtn onClick={() => set({ rows: c.rows.filter((x) => x.id !== r.id) })}><Trash2 className="h-4 w-4" /></IconBtn>
        </div>
      ))}
      <AddBtn label="Ajouter une ligne" onClick={() => set({ rows: [...c.rows, { id: newId(), label: "", left: "", right: "" }] })} />
    </div>
  );
}

function TimelineFields({ slide, update }: { slide: Slide; update: (id: string, patch: Partial<Slide>) => void }) {
  const items = slide.timeline ?? [];
  const set = (timeline: any[]) => update(slide.id, { timeline });
  return (
    <div>
      <div className="label">Jalons</div>
      {items.map((t, i) => (
        <div key={t.id} className="mb-2 flex items-center gap-2">
          <input className="input w-20" value={t.date} placeholder="T1" onChange={(e) => set(items.map((x, j) => (j === i ? { ...x, date: e.target.value } : x)))} />
          <input className="input w-32" value={t.title} placeholder="Titre" onChange={(e) => set(items.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
          <input className="input flex-1" value={t.body} placeholder="Description" onChange={(e) => set(items.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)))} />
          <IconBtn onClick={() => set(items.filter((x) => x.id !== t.id))}><Trash2 className="h-4 w-4" /></IconBtn>
        </div>
      ))}
      <AddBtn label="Ajouter un jalon" onClick={() => set([...items, { id: newId(), date: "T", title: "", body: "" }])} />
    </div>
  );
}

function ProblemSolutionFields({ slide, update }: { slide: Slide; update: (id: string, patch: Partial<Slide>) => void }) {
  const left = slide.left ?? { title: "Problème", points: [] };
  const right = slide.right ?? { title: "Solution", points: [] };
  return (
    <div className="space-y-3">
      <div className="border border-ink/15 p-2">
        <input className="input mb-1" value={left.title} onChange={(e) => update(slide.id, { left: { ...left, title: e.target.value } })} />
        <StringList label="" values={left.points} onChange={(points) => update(slide.id, { left: { ...left, points } })} />
      </div>
      <div className="border border-ink/15 p-2">
        <input className="input mb-1" value={right.title} onChange={(e) => update(slide.id, { right: { ...right, title: e.target.value } })} />
        <StringList label="" values={right.points} onChange={(points) => update(slide.id, { right: { ...right, points } })} />
      </div>
    </div>
  );
}

function updateMetric(slide: Slide, update: (id: string, patch: Partial<Slide>) => void, id: string, patch: { value?: string; label?: string }) {
  update(slide.id, { metrics: (slide.metrics ?? []).map((m) => (m.id === id ? { ...m, ...patch } : m)) });
}
function removeMetric(slide: Slide, update: (id: string, patch: Partial<Slide>) => void, id: string) {
  update(slide.id, { metrics: (slide.metrics ?? []).filter((m) => m.id !== id) });
}
function addMetric(slide: Slide, update: (id: string, patch: Partial<Slide>) => void) {
  update(slide.id, { metrics: [...(slide.metrics ?? []), { id: newId(), value: "42", label: "Métrique" }] });
}
