import type { Command } from "commander";
import { confirm } from "@inquirer/prompts";
import { getPrompt, removePrompt } from "../../../prompt-library/manager.js";
import { printSuccess, printError } from "../../../ui/output.js";
import chalk from "chalk";

export function registerPromptRemove(cmd: Command): void {
  cmd
    .command("remove <idOrName>")
    .alias("rm")
    .description("Remove a prompt from your library")
    .option("--yes", "Skip confirmation prompt")
    .action(async (idOrName: string, opts) => {
      const entry = getPrompt(idOrName);
      if (!entry) {
        printError(`Prompt not found: ${idOrName}`);
        process.exit(1);
      }

      if (!opts.yes) {
        try {
          const confirmed = await confirm({
            message: `Remove prompt "${chalk.bold(entry.name)}" (${chalk.yellow(entry.id)})?`,
            default: false,
          });
          if (!confirmed) {
            console.log(chalk.dim("  Cancelled."));
            return;
          }
        } catch {
          process.exit(0);
        }
      }

      removePrompt(entry.id);
      printSuccess(`Removed prompt: ${chalk.bold(entry.name)}`);
    });
}
