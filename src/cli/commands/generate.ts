import type { Command } from "commander";
import chalk from "chalk";
import { buildMessages } from "../../agent/reasoning.js";
import { fileToContentParts } from "../../multimodal/index.js";
import { MODELS } from "../../agent/models.js";
import { getPrompt } from "../../prompt-library/manager.js";
import { resolveFilePath, fileExists } from "../../utils/file.js";
import { printError } from "../../ui/output.js";
import { runAnalysis } from "../run-analysis.js";
import { readTextFile } from "../../utils/file.js";

export function registerGenerate(program: Command): void {
  program
    .command("generate")
    .description("Generate code from a description")
    .option(
      "--description <text>",
      "What to generate (can also be piped via stdin)"
    )
    .option("--language <lang>", "Target language", "typescript")
    .option("--framework <name>", "Framework context (e.g. react, express)")
    .option("--file <path>", "Reference file for additional context")
    .option("--model <model>", "AI model to use")
    .option("--consistency", "Enable self-consistency (multiple runs + synthesis)")
    .option("--runs <n>", "Number of self-consistency runs", "3")
    .option("--prompt <idOrName>", "Use a saved prompt from your library")
    .option("--stream", "Stream the response token by token")
    .option("--no-few-shot", "Disable few-shot examples")
    .action(async (opts) => {
      // Accept description from --description flag or stdin
      let description = opts.description as string | undefined;

      if (!description && !process.stdin.isTTY) {
        const chunks: Buffer[] = [];
        for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
        description = Buffer.concat(chunks).toString("utf-8").trim();
      }

      if (!description) {
        printError(
          "Provide a description with --description or pipe text via stdin."
        );
        process.exit(1);
      }

      try {
        const model = opts.model ?? MODELS.codegen;

        let customSystemPrompt: string | undefined;
        if (opts.prompt) {
          const saved = getPrompt(opts.prompt);
          if (!saved) {
            printError(`Prompt not found: ${opts.prompt}`);
            process.exit(1);
          }
          customSystemPrompt = saved.content;
        }

        const contextParts: Array<{ type: "text"; text: string }> = [];
        if (opts.file) {
          const filePath = resolveFilePath(opts.file);
          if (!fileExists(filePath)) {
            printError(`Reference file not found: ${opts.file}`);
            process.exit(1);
          }
          const parts = await fileToContentParts(filePath);
          const textParts = parts.filter(
            (p): p is { type: "text"; text: string } => p.type === "text"
          );
          contextParts.push(...textParts);
        }

        const frameworkNote = opts.framework
          ? ` using ${opts.framework}`
          : "";
        const languageNote = opts.language ? ` in ${opts.language}` : "";
        const contextNote =
          contextParts.length > 0
            ? "\n\nContext from reference file:\n" +
              contextParts.map((p) => p.text).join("\n")
            : "";

        const userText =
          `Generate code${languageNote}${frameworkNote}:\n\n${description}${contextNote}`;

        const messages = buildMessages({
          mode: "generate",
          userContent: userText,
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

// Keep ts happy about unused import
void readTextFile;
