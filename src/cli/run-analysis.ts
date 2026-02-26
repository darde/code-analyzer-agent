import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { openRouterClient } from "../agent/client.js";
import { runSelfConsistency } from "../agent/self-consistency.js";
import { createSpinner } from "../ui/spinner.js";
import { printMarkdown } from "../ui/output.js";
import { config } from "../config/env.js";
import chalk from "chalk";

export interface RunOptions {
  messages: ChatCompletionMessageParam[];
  model?: string;
  stream?: boolean;
  consistency?: boolean;
  runs?: number;
}

export async function runAnalysis(opts: RunOptions): Promise<void> {
  const model = opts.model ?? config.OPENROUTER_DEFAULT_MODEL;

  if (opts.consistency) {
    const runs = opts.runs ?? 3;
    const spinner = createSpinner(
      `Running ${runs} completions for self-consistency...`
    );
    spinner.start();

    try {
      const result = await runSelfConsistency({
        messages: opts.messages,
        model,
        runs,
      });
      spinner.succeed("Self-consistency synthesis complete");

      if (process.env.DEBUG_CANDIDATES) {
        for (const [i, candidate] of result.candidates.entries()) {
          console.log(chalk.dim(`\n${"─".repeat(40)} Candidate ${i + 1} ${"─".repeat(40)}`));
          printMarkdown(candidate);
        }
        console.log(chalk.bold.cyan(`\n${"─".repeat(40)} Final Answer ${"─".repeat(40)}`));
      }

      printMarkdown(result.synthesis);
    } catch (err) {
      spinner.fail("Self-consistency failed");
      throw err;
    }
    return;
  }

  if (opts.stream) {
    const spinner = createSpinner("Connecting...");
    spinner.start();
    spinner.stop();

    const stream = await openRouterClient.chat.completions.create({
      model,
      messages: opts.messages,
      temperature: config.OPENROUTER_TEMPERATURE,
      max_tokens: config.OPENROUTER_MAX_TOKENS,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) process.stdout.write(content);
    }
    console.log();
    return;
  }

  const spinner = createSpinner("Analyzing...");
  spinner.start();

  try {
    const response = await openRouterClient.chat.completions.create({
      model,
      messages: opts.messages,
      temperature: config.OPENROUTER_TEMPERATURE,
      max_tokens: config.OPENROUTER_MAX_TOKENS,
    });
    spinner.stop();
    const text = response.choices[0]?.message?.content ?? "";
    printMarkdown(text);
  } catch (err) {
    spinner.fail("Request failed");
    throw err;
  }
}
