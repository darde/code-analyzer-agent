import type {
  ChatCompletionMessageParam,
  ChatCompletionContentPart,
} from "openai/resources/chat/completions";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

export type ReasoningMode = "review" | "debug" | "generate" | "analyze";

const COT_INSTRUCTIONS: Record<ReasoningMode, string> = {
  review:
    "Before giving feedback, think step by step:\n" +
    "1. Understand the code's intent and context.\n" +
    "2. Identify correctness issues (bugs, edge cases, logic errors).\n" +
    "3. Identify style and maintainability issues.\n" +
    "4. Identify security vulnerabilities.\n" +
    "5. Identify performance concerns.\n" +
    "6. Summarize all improvements with concrete code examples.",
  debug:
    "Before giving a fix, think step by step:\n" +
    "1. Reproduce the error mentally from the provided information.\n" +
    "2. Trace the execution path to the failure point.\n" +
    "3. Identify the root cause (not just the symptom).\n" +
    "4. Propose the minimal, correct fix.\n" +
    "5. Explain why the fix works and how to prevent similar bugs.",
  generate:
    "Before writing code, think step by step:\n" +
    "1. Clarify the requirements and constraints.\n" +
    "2. Plan the structure, types/interfaces, and data flow.\n" +
    "3. Implement step by step with clear variable names.\n" +
    "4. Review your own output for correctness, edge cases, and readability.\n" +
    "5. Add brief inline comments only where the logic isn't self-evident.",
  analyze:
    "Before giving your analysis, think step by step:\n" +
    "1. Identify all components, patterns, and technologies.\n" +
    "2. Trace the data flow and control flow.\n" +
    "3. Evaluate complexity, coupling, and cohesion.\n" +
    "4. Note dependencies, assumptions, and potential risks.\n" +
    "5. Summarize your findings with actionable insights.",
};

export function buildSystemPrompt(
  mode: ReasoningMode,
  extraInstructions?: string
): string {
  const base =
    `You are an expert software engineer specializing in code ${mode}. ` +
    `Always respond in markdown. Format all code blocks with the correct language identifier. ` +
    `Be specific, actionable, and concise.\n\n` +
    `Reasoning instructions:\n${COT_INSTRUCTIONS[mode]}`;
  return extraInstructions ? `${base}\n\n${extraInstructions}` : base;
}

interface FewShotExample {
  userMessage: string;
  assistantMessage: string;
}

function loadExamples(mode: ReasoningMode): FewShotExample[] {
  // Examples live in examples/ at the package root (two levels up from dist/agent/)
  const examplesPath = join(
    __dirname,
    `../../examples/few-shot-${mode}.json`
  );
  try {
    const raw = readFileSync(examplesPath, "utf-8");
    return JSON.parse(raw) as FewShotExample[];
  } catch {
    return [];
  }
}

export function buildFewShotMessages(
  mode: ReasoningMode
): ChatCompletionMessageParam[] {
  const examples = loadExamples(mode);
  return examples.flatMap(
    (ex): ChatCompletionMessageParam[] => [
      { role: "user", content: ex.userMessage },
      { role: "assistant", content: ex.assistantMessage },
    ]
  );
}

export function buildMessages(opts: {
  mode: ReasoningMode;
  userContent: string | ChatCompletionContentPart[];
  customSystemPrompt?: string;
  includeFewShot?: boolean;
}): ChatCompletionMessageParam[] {
  const systemContent =
    opts.customSystemPrompt ?? buildSystemPrompt(opts.mode);

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemContent },
  ];

  if (opts.includeFewShot !== false) {
    messages.push(...buildFewShotMessages(opts.mode));
  }

  messages.push({ role: "user", content: opts.userContent });

  return messages;
}
