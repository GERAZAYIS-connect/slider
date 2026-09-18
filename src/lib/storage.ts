import type { Presentation } from "../types";

const KEY = "slider.projects.v1";

function readAll(): Presentation[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as Presentation[]) : [];
  } catch {
    return [];
  }
}

export function saveProject(p: Presentation): void {
  try {
    const list = readAll().filter((x) => x.id !== p.id);
    list.unshift({ ...p, updatedAt: Date.now() });
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 30)));
  } catch {
    /* stockage indisponible : on ignore */
  }
}

export function listProjects(): Presentation[] {
  return readAll().sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
}

export function getProject(id: string): Presentation | null {
  return readAll().find((p) => p.id === id) ?? null;
}

export function deleteProject(id: string): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(readAll().filter((p) => p.id !== id)));
  } catch {
    /* ignore */
  }
}
