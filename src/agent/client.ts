import OpenAI from "openai";
import { config, assertApiKey } from "../config/env.js";

function createOpenRouterClient(): OpenAI {
  return new OpenAI({
    apiKey: config.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": "https://github.com/taller/code-analyzer-agent",
      "X-Title": "Taller Code Analyzer Agent",
    },
  });
}

// Lazy singleton — created only when first used
let _client: OpenAI | null = null;

export function getClient(): OpenAI {
  assertApiKey();
  if (!_client) _client = createOpenRouterClient();
  return _client;
}

/** @deprecated Use getClient() */
export const openRouterClient = new Proxy({} as OpenAI, {
  get(_, prop) {
    return getClient()[prop as keyof OpenAI];
  },
});
