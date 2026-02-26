import type { Command } from "commander";
import { input, select } from "@inquirer/prompts";
import { addPrompt } from "../../../prompt-library/manager.js";
import { PromptModeSchema, type PromptMode } from "../../../prompt-library/types.js";
import { printSuccess, printError } from "../../../ui/output.js";
import chalk from "chalk";

export function registerPromptAdd(cmd: Command): void {
  cmd
    .command("add")
    .description("Add a new prompt to your library")
    .option("--name <name>", "Prompt name")
    .option("--content <text>", "Prompt content (the system prompt text)")
    .option(
      "--mode <mode>",
      "Associated mode: review | debug | generate | analyze | custom"
    )
    .option("--tags <tags>", "Comma-separated tags")
    .option("--description <text>", "Short description")
    .action(async (opts) => {
      try {
        // Interactive fallback for missing required fields
        const name =
          (opts.name as string | undefined) ??
          (await input({
            message: "Prompt name:",
            validate: (v) => (v.trim().length > 0 ? true : "Name is required"),
          }));

        const content =
          (opts.content as string | undefined) ??
          (await input({
            message: "Prompt content (system prompt text):",
            validate: (v) =>
              v.trim().length > 0 ? true : "Content is required",
          }));

        const modeChoices = PromptModeSchema.options.map((m) => ({
          name: m,
          value: m,
        }));

        const mode =
          (opts.mode as PromptMode | undefined) ??
          (await select({
            message: "Mode:",
            choices: modeChoices,
          }));

        const tags = opts.tags
          ? (opts.tags as string).split(",").map((t: string) => t.trim()).filter(Boolean)
          : [];

        const entry = addPrompt({
          name: name.trim(),
          content: content.trim(),
          mode,
          tags,
          description: opts.description as string | undefined,
        });

        printSuccess(
          `Prompt saved: ${chalk.bold(entry.name)} (${chalk.yellow(entry.id)})`
        );
      } catch (err) {
        if ((err as NodeJS.ErrnoException).name === "ExitPromptError") {
          // User cancelled with Ctrl+C
          process.exit(0);
        }
        printError((err as Error).message);
        process.exit(1);
      }
    });
}
