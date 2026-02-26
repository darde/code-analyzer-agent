export const MODELS = {
  // Fast and cost-effective — good for most analysis tasks
  default: "anthropic/claude-3.5-haiku",
  // Strong reasoning — used for self-consistency synthesis
  synthesis: "anthropic/claude-sonnet-4-5",
  // Multimodal vision — for images and screenshots
  vision: "google/gemini-2.0-flash-001",
  // Code generation — strong at writing code
  codegen: "openai/gpt-4o",
  // Free tier fallback
  free: "google/gemini-2.0-flash-exp:free",
} as const;

export type ModelKey = keyof typeof MODELS;
export type ModelId = (typeof MODELS)[ModelKey];
