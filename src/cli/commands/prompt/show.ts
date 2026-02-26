import type { Command } from "commander";
import { getPrompt } from "../../../prompt-library/manager.js";
import { printError, printMarkdown } from "../../../ui/output.js";
import chalk from "chalk";

export function registerPromptShow(cmd: Command): void {
  cmd
    .command("show <idOrName>")
    .description("Show the full content of a prompt")
    .action((idOrName: string) => {
      const entry = getPrompt(idOrName);
      if (!entry) {
        printError(`Prompt not found: ${idOrName}`);
        process.exit(1);
      }

      console.log();
      console.log(chalk.bold("Name:   ") + entry.name);
      console.log(chalk.bold("ID:     ") + chalk.yellow(entry.id));
      console.log(chalk.bold("Mode:   ") + chalk.cyan(entry.mode));
      if (entry.tags.length > 0) {
        console.log(chalk.bold("Tags:   ") + entry.tags.join(", "));
      }
      if (entry.description) {
        console.log(chalk.bold("Desc:   ") + chalk.dim(entry.description));
      }
      console.log(chalk.bold("Created:") + " " + chalk.dim(new Date(entry.createdAt).toLocaleString()));
      console.log();
      console.log(chalk.bold("Content:"));
      printMarkdown(entry.content);
    });
}
