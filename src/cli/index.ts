import { Command } from "commander";
import { registerAnalyze } from "./commands/analyze.js";
import { registerReview } from "./commands/review.js";
import { registerGenerate } from "./commands/generate.js";
import { registerDebug } from "./commands/debug.js";
import { registerPromptCommands } from "./commands/prompt/index.js";

const program = new Command();

program
  .name("cza")
  .description(
    "Code Analyzer Agent — AI-powered code analysis powered by OpenRouter\n\n" +
      "Principles: Chain-of-Thought · Few-Shot · Self-Consistency · Multimodal"
  )
  .version("1.0.0");

registerAnalyze(program);
registerReview(program);
registerGenerate(program);
registerDebug(program);
registerPromptCommands(program);

program.parse(process.argv);
