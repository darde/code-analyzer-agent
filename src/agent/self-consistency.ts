import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { openRouterClient } from "./client.js";
import { config } from "../config/env.js";

export interface SelfConsistencyOptions {
  messages: ChatCompletionMessageParam[];
  model?: string;
  synthesisModel?: string;
  runs?: number;
  temperature?: number;
}

export interface SelfConsistencyResult {
  candidates: string[];
  synthesis: string;
}

export async function runSelfConsistency(
  opts: SelfConsistencyOptions
): Promise<SelfConsistencyResult> {
  const {
    messages,
    model = config.OPENROUTER_DEFAULT_MODEL,
    synthesisModel = config.OPENROUTER_SYNTHESIS_MODEL,
    runs = 3,
    temperature = 0.7,
  } = opts;

  // Step 1: Run N completions in parallel with higher temperature for diversity
  const completionPromises = Array.from({ length: runs }, () =>
    openRouterClient.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: config.OPENROUTER_MAX_TOKENS,
    })
  );

  const completions = await Promise.all(completionPromises);
  const candidates = completions.map(
    (c) => c.choices[0]?.message?.content ?? ""
  );

  // Step 2: Synthesize with a meta-prompt to reconcile candidates
  const lastUserMessage =
    typeof messages[messages.length - 1]?.content === "string"
      ? messages[messages.length - 1].content
      : "[multimodal input]";

  const synthesisMessages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content:
        "You are an expert evaluator tasked with synthesizing multiple candidate answers " +
        "to the same question into a single, definitive response.\n\n" +
        "Your synthesis process:\n" +
        "1. Identify points of agreement across candidates (high-confidence findings).\n" +
        "2. Identify meaningful disagreements and resolve them with reasoning.\n" +
        "3. Discard any clearly incorrect or inconsistent claims.\n" +
        "4. Produce a single, well-structured, accurate final answer.\n" +
        "Respond in markdown. Do not mention that this is a synthesis — just give the best answer.",
    },
    {
      role: "user",
      content:
        `Original task:\n${lastUserMessage}\n\n` +
        candidates
          .map((c, i) => `--- Candidate ${i + 1} ---\n${c}`)
          .join("\n\n") +
        "\n\n--- Synthesize the best possible answer ---",
    },
  ];

  const synthesis = await openRouterClient.chat.completions.create({
    model: synthesisModel,
    messages: synthesisMessages,
    temperature: 0.2,
    max_tokens: config.OPENROUTER_MAX_TOKENS,
  });

  return {
    candidates,
    synthesis: synthesis.choices[0]?.message?.content ?? "",
  };
}
