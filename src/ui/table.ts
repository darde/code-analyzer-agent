import chalk from "chalk";
import type { PromptEntry } from "../prompt-library/types.js";

export function printPromptTable(prompts: PromptEntry[]): void {
  if (prompts.length === 0) {
    console.log(
      chalk.dim(
        "\n  No prompts found. Use `cza prompt add` to create one.\n"
      )
    );
    return;
  }

  const header = [
    chalk.bold("ID".padEnd(10)),
    chalk.bold("Name".padEnd(32)),
    chalk.bold("Mode".padEnd(12)),
    chalk.bold("Tags".padEnd(24)),
    chalk.bold("Created"),
  ].join("  ");

  console.log("\n" + header);
  console.log(chalk.dim("─".repeat(90)));

  for (const p of prompts) {
    const tags = p.tags.join(", ");
    const row = [
      chalk.yellow(p.id.padEnd(10)),
      p.name.slice(0, 31).padEnd(32),
      chalk.cyan((p.mode ?? "custom").padEnd(12)),
      chalk.dim(tags.slice(0, 23).padEnd(24)),
      chalk.dim(new Date(p.createdAt).toLocaleDateString()),
    ].join("  ");
    console.log(row);
  }
  console.log();
}
