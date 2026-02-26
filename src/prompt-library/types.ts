import { z } from "zod";

export const PromptModeSchema = z.enum([
  "review",
  "debug",
  "generate",
  "analyze",
  "custom",
]);

export const PromptEntrySchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  content: z.string().min(1),
  mode: PromptModeSchema,
  tags: z.array(z.string().min(1).max(30)).default([]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type PromptEntry = z.infer<typeof PromptEntrySchema>;
export type PromptMode = z.infer<typeof PromptModeSchema>;

export const PromptStoreSchema = z.object({
  version: z.literal(1),
  prompts: z.array(PromptEntrySchema),
});

export type PromptStore = z.infer<typeof PromptStoreSchema>;
