import Conf from "conf";
import { PromptStoreSchema, type PromptStore } from "./types.js";

const conf = new Conf<PromptStore>({
  projectName: "code-analyzer-agent",
  defaults: {
    version: 1,
    prompts: [],
  },
});

export function getStore(): PromptStore {
  const raw = conf.store;
  const result = PromptStoreSchema.safeParse(raw);
  if (!result.success) {
    // Reset corrupted store
    const fresh: PromptStore = { version: 1, prompts: [] };
    conf.store = fresh;
    return fresh;
  }
  return result.data;
}

export function saveStore(store: PromptStore): void {
  PromptStoreSchema.parse(store);
  conf.store = store;
}

export function getStoreFilePath(): string {
  return conf.path;
}
