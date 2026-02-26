import type { Command } from "commander";
import { registerPromptAdd } from "./add.js";
import { registerPromptList } from "./list.js";
import { registerPromptShow } from "./show.js";
import { registerPromptRemove } from "./remove.js";
import { registerPromptUse } from "./use.js";

export function registerPromptCommands(program: Command): void {
  const promptCmd = program
    .command("prompt")
    .description("Manage your personal prompt library");

  registerPromptAdd(promptCmd);
  registerPromptList(promptCmd);
  registerPromptShow(promptCmd);
  registerPromptRemove(promptCmd);
  registerPromptUse(promptCmd);
}
