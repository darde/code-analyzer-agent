import { generateId } from "../utils/id.js";
import { getStore, saveStore } from "./store.js";
import type { PromptEntry, PromptMode } from "./types.js";

export function addPrompt(
  input: Omit<PromptEntry, "id" | "createdAt" | "updatedAt">
): PromptEntry {
  const store = getStore();
  const now = new Date().toISOString();
  const entry: PromptEntry = {
    ...input,
    id: generateId(8),
    createdAt: now,
    updatedAt: now,
  };
  store.prompts.push(entry);
  saveStore(store);
  return entry;
}

export function listPrompts(filter?: {
  tag?: string;
  mode?: PromptMode;
}): PromptEntry[] {
  const { prompts } = getStore();
  return prompts.filter((p) => {
    if (filter?.tag && !p.tags.includes(filter.tag)) return false;
    if (filter?.mode && p.mode !== filter.mode) return false;
    return true;
  });
}

export function getPromptById(id: string): PromptEntry | undefined {
  return getStore().prompts.find((p) => p.id === id);
}

export function getPromptByName(name: string): PromptEntry | undefined {
  return getStore().prompts.find(
    (p) => p.name.toLowerCase() === name.toLowerCase()
  );
}

export function getPrompt(idOrName: string): PromptEntry | undefined {
  return getPromptById(idOrName) ?? getPromptByName(idOrName);
}

export function removePrompt(idOrName: string): boolean {
  const store = getStore();
  const before = store.prompts.length;
  const entry = getPrompt(idOrName);
  if (!entry) return false;
  store.prompts = store.prompts.filter((p) => p.id !== entry.id);
  if (store.prompts.length === before) return false;
  saveStore(store);
  return true;
}

export function updatePrompt(
  idOrName: string,
  patch: Partial<Omit<PromptEntry, "id" | "createdAt">>
): PromptEntry | undefined {
  const store = getStore();
  const entry = getPrompt(idOrName);
  if (!entry) return undefined;
  const idx = store.prompts.findIndex((p) => p.id === entry.id);
  if (idx === -1) return undefined;
  store.prompts[idx] = {
    ...store.prompts[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  saveStore(store);
  return store.prompts[idx];
}
