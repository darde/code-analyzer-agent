import type { Command } from "commander";
import chalk from "chalk";
import { buildMessages } from "../../agent/reasoning.js";
import { fileToContentParts, requiresVisionModel } from "../../multimodal/index.js";
import { MODELS } from "../../agent/models.js";
import { config } from "../../config/env.js";
import { getPrompt } from "../../prompt-library/manager.js";
import { resolveFilePath, fileExists } from "../../utils/file.js";
import { printError } from "../../ui/output.js";
import { runAnalysis } from "../run-analysis.js";

export function registerReview(program: Command): void {
  program
    .command("review <file>")
    .description("Review code for correctness, security, style, and performance")
    .option("--model <model>", "AI model to use")
    .option(
      "--focus <aspect>",
      "Focus area: security | performance | style | all",
      "all"
    )
    .option("--consistency", "Enable self-consistency (multiple runs + synthesis)")
    .option("--runs <n>", "Number of self-consistency runs", "3")
    .option("--prompt <idOrName>", "Use a saved prompt from your library")
    .option("--stream", "Stream the response token by token")
    .option("--no-few-shot", "Disable few-shot examples")
    .action(async (file: string, opts) => {
      const filePath = resolveFilePath(file);
      if (!fileExists(filePath)) {
        printError(`File not found: ${file}`);
        process.exit(1);
      }

      try {
        const contentParts = await fileToContentParts(filePath);
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

        const focusNote =
          opts.focus !== "all"
            ? `\nFocus your review specifically on: **${opts.focus}**`
            : "";

        const messages = buildMessages({
          mode: "review",
          userContent: [
            {
              type: "text",
              text: `Please review this code.${focusNote}`,
            },
            ...contentParts,
          ],
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
