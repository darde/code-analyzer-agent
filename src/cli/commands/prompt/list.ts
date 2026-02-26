import type { Command } from "commander";
import { listPrompts } from "../../../prompt-library/manager.js";
import { printPromptTable } from "../../../ui/table.js";
import { getStoreFilePath } from "../../../prompt-library/store.js";
import type { PromptMode } from "../../../prompt-library/types.js";
import chalk from "chalk";

export function registerPromptList(cmd: Command): void {
  cmd
    .command("list")
    .description("List all prompts in your library")
    .option("--tag <tag>", "Filter by tag")
    .option(
      "--mode <mode>",
      "Filter by mode: review | debug | generate | analyze | custom"
    )
    .option("--json", "Output as JSON")
    .option("--path", "Show the library file path")
    .action((opts) => {
      if (opts.path) {
        console.log(chalk.dim(getStoreFilePath()));
        return;
      }

      const prompts = listPrompts({
        tag: opts.tag as string | undefined,
        mode: opts.mode as PromptMode | undefined,
      });

      if (opts.json) {
        console.log(JSON.stringify(prompts, null, 2));
        return;
      }

      printPromptTable(prompts);
    });
}
