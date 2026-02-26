import type { Command } from "commander";
import chalk from "chalk";
import { buildMessages, type ReasoningMode } from "../../agent/reasoning.js";
import { fileToContentParts, requiresVisionModel } from "../../multimodal/index.js";
import { MODELS } from "../../agent/models.js";
import { config } from "../../config/env.js";
import { getPrompt } from "../../prompt-library/manager.js";
import { resolveFilePath, fileExists } from "../../utils/file.js";
import { printError } from "../../ui/output.js";
import { runAnalysis } from "../run-analysis.js";

const VALID_MODES: ReasoningMode[] = ["review", "debug", "generate", "analyze"];

export function registerAnalyze(program: Command): void {
  program
    .command("analyze <file>")
    .description(
      "Analyze any file (code, image, PDF, screenshot) with a chosen reasoning mode"
    )
    .option(
      "--mode <mode>",
      "Reasoning mode: review | debug | generate | analyze",
      "analyze"
    )
    .option("--model <model>", "AI model to use")
    .option("--consistency", "Enable self-consistency (multiple runs + synthesis)")
    .option("--runs <n>", "Number of self-consistency runs", "3")
    .option("--prompt <idOrName>", "Use a saved prompt from your library")
    .option("--message <text>", "Custom message / task description for this file")
    .option("--stream", "Stream the response token by token")
    .option("--no-few-shot", "Disable few-shot examples")
    .action(async (file: string, opts) => {
      const filePath = resolveFilePath(file);
      if (!fileExists(filePath)) {
        printError(`File not found: ${file}`);
        process.exit(1);
      }

      const mode = opts.mode as ReasoningMode;
      if (!VALID_MODES.includes(mode)) {
        printError(
          `Invalid mode: ${mode}. Choose from: ${VALID_MODES.join(", ")}`
        );
        process.exit(1);
      }

      try {
        const message =
          (opts.message as string | undefined) ??
          `Please ${mode} this file.`;

        const contentParts = await fileToContentParts(filePath, message);
        const needsVision = requiresVisionModel(filePath);
        const model =
          opts.model ??
          (needsVision ? MODELS.vision : config.OPENROUTER_DEFAULT_MODEL);

        let customSystemPrompt: string | undefined;
        if (opts.prompt) {
          const saved = getPrompt(opts.prompt);
          if (!saved) {
            printError(`Prompt not found: ${opts.prompt}`);
            process.exit(1);
          }
          customSystemPrompt = saved.content;
        }

        const messages = buildMessages({
          mode,
          userContent: contentParts,
          customSystemPrompt,
          includeFewShot: opts.fewShot !== false,
        });

        await runAnalysis({
          messages,
          model,
          stream: opts.stream,
          consistency: opts.consistency,
          runs: parseInt(opts.runs, 10),
        });
      } catch (err) {
        printError((err as Error).message);
        if (process.env.DEBUG) console.error(chalk.dim((err as Error).stack));
        process.exit(1);
      }
    });
}
