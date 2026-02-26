import type { Command } from "commander";
import chalk from "chalk";
import { buildMessages } from "../../agent/reasoning.js";
import { fileToContentParts } from "../../multimodal/index.js";
import { config } from "../../config/env.js";
import { getPrompt } from "../../prompt-library/manager.js";
import { resolveFilePath, fileExists, readTextFile } from "../../utils/file.js";
import { printError } from "../../ui/output.js";
import { runAnalysis } from "../run-analysis.js";

export function registerDebug(program: Command): void {
  program
    .command("debug <file>")
    .description("Debug code and identify the root cause of an error")
    .option("--error <text>", "Error message or stack trace")
    .option("--error-file <path>", "File containing the error output")
    .option("--model <model>", "AI model to use")
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
        const model = opts.model ?? config.OPENROUTER_DEFAULT_MODEL;

        let customSystemPrompt: string | undefined;
        if (opts.prompt) {
          const saved = getPrompt(opts.prompt);
          if (!saved) {
            printError(`Prompt not found: ${opts.prompt}`);
            process.exit(1);
          }
          customSystemPrompt = saved.content;
        }

        // Resolve error text
        let errorText = opts.error as string | undefined;
        if (!errorText && opts.errorFile) {
          const errorFilePath = resolveFilePath(opts.errorFile);
          if (!fileExists(errorFilePath)) {
            printError(`Error file not found: ${opts.errorFile}`);
            process.exit(1);
          }
          errorText = readTextFile(errorFilePath);
        }

        const errorSection = errorText
          ? `\n\nError / stack trace:\n\`\`\`\n${errorText}\n\`\`\``
          : "";

        const messages = buildMessages({
          mode: "debug",
          userContent: [
            {
              type: "text",
              text: `Please debug this code and find the root cause.${errorSection}`,
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
