import chalk from "chalk";

export function printMarkdown(text: string): void {
  const rendered = text
    // Fenced code blocks
    .replace(
      /```(\w*)\n([\s\S]*?)```/g,
      (_match, lang: string, code: string) =>
        chalk.dim(`[${lang || "code"}]\n`) + chalk.green(code.trimEnd()) + "\n"
    )
    // H2 headers
    .replace(/^## (.+)$/gm, chalk.bold.yellow("$1"))
    // H3 headers
    .replace(/^### (.+)$/gm, chalk.bold.cyan("$1"))
    // H1 headers
    .replace(/^# (.+)$/gm, chalk.bold.white("$1"))
    // Bold
    .replace(/\*\*(.+?)\*\*/g, chalk.bold("$1"))
    // Italic
    .replace(/\*(.+?)\*/g, chalk.italic("$1"))
    // Inline code
    .replace(/`([^`]+)`/g, chalk.cyan("`$1`"))
    // Bullet points
    .replace(/^- (.+)$/gm, `  ${chalk.dim("•")} $1`);

  console.log("\n" + rendered);
}

export function printSuccess(message: string): void {
  console.log(chalk.green(`\n  ${message}\n`));
}

export function printError(message: string): void {
  console.error(chalk.red(`\n  Error: ${message}\n`));
}

export function printInfo(message: string): void {
  console.log(chalk.blue(`  ${message}`));
}

export function printDim(message: string): void {
  console.log(chalk.dim(`  ${message}`));
}
