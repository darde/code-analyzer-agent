import type { Command } from "commander";
import chalk from "chalk";
import { getPrompt } from "../../../prompt-library/manager.js";
import { buildMessages } from "../../../agent/reasoning.js";
import { fileToContentParts, requiresVisionModel } from "../../../multimodal/index.js";
import { MODELS } from "../../../agent/models.js";
import { config } from "../../../config/env.js";
import { resolveFilePath, fileExists } from "../../../utils/file.js";
import { printError } from "../../../ui/output.js";
import { runAnalysis } from "../../run-analysis.js";
import type { ReasoningMode } from "../../../agent/reasoning.js";

export function registerPromptUse(cmd: Command): void {
  cmd
    .command("use <idOrName> [file]")
    .description("Run a saved prompt against a file or a text input")
    .option("--text <text>", "Text input instead of a file")
    .option("--model <model>", "AI model to use")
    .option("--consistency", "Enable self-consistency")
    .option("--runs <n>", "Number of self-consistency runs", "3")
    .option("--stream", "Stream the response")
    .action(async (idOrName: string, file: string | undefined, opts) => {
      const entry = getPrompt(idOrName);
      if (!entry) {
        printError(`Prompt not found: ${idOrName}`);
        process.exit(1);
      }

      try {
        const mode = (entry.mode === "custom" ? "analyze" : entry.mode) as ReasoningMode;

        if (file) {
          const filePath = resolveFilePath(file);
          if (!fileExists(filePath)) {
            printError(`File not found: ${file}`);
            process.exit(1);
          }

          const contentParts = await fileToContentParts(filePath);
          const needsVision = requiresVisionModel(filePath);
          const model =
            opts.model ??
            (needsVision ? MODELS.vision : config.OPENROUTER_DEFAULT_MODEL);

          const messages = buildMessages({
            mode,
            userContent: contentParts,
            customSystemPrompt: entry.content,
            includeFewShot: false,
          });

          await runAnalysis({
            messages,
            model,
            stream: opts.stream,
            consistency: opts.consistency,
            runs: parseInt(opts.runs, 10),
          });
        } else if (opts.text) {
          const model = opts.model ?? config.OPENROUTER_DEFAULT_MODEL;

          const messages = buildMessages({
            mode,
            userContent: opts.text as string,
            customSystemPrompt: entry.content,
            includeFewShot: false,
          });

          await runAnalysis({
            messages,
            model,
            stream: opts.stream,
            consistency: opts.consistency,
            runs: parseInt(opts.runs, 10),
          });
        } else {
          printError(
            "Provide a file path or use --text <text> to pass input."
          );
          process.exit(1);
        }
      } catch (err) {
        printError((err as Error).message);
        if (process.env.DEBUG) console.error(chalk.dim((err as Error).stack));
        process.exit(1);
      }
    });
}
