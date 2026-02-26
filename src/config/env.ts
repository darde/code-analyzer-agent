import { config as loadDotenv } from "dotenv";
import { z } from "zod";
import { resolve } from "path";
import { homedir } from "os";

// Load .env from the current working directory (user's project) first
loadDotenv({ path: resolve(process.cwd(), ".env") });

// Fall back to a global config file in the user's home directory
loadDotenv({
  path: resolve(homedir(), ".code-analyzer-agent.env"),
  override: false,
});

const EnvSchema = z.object({
  OPENROUTER_API_KEY: z
    .string()
    .min(1, "OPENROUTER_API_KEY is required. Set it in .env or run: export OPENROUTER_API_KEY=sk-or-v1-..."),
  OPENROUTER_DEFAULT_MODEL: z.string().default("anthropic/claude-3.5-haiku"),
  OPENROUTER_SYNTHESIS_MODEL: z.string().default("anthropic/claude-sonnet-4-5"),
  OPENROUTER_VISION_MODEL: z.string().default("google/gemini-2.0-flash-001"),
  OPENROUTER_MAX_TOKENS: z.coerce.number().int().positive().default(4096),
  OPENROUTER_TEMPERATURE: z.coerce.number().min(0).max(2).default(0.2),
});

type Config = z.infer<typeof EnvSchema>;

// Build a partial config with defaults for non-required fields.
// The API key is empty string if not set — assertApiKey() validates it.
const withDefaults = EnvSchema.partial({ OPENROUTER_API_KEY: true }).parse({
  ...process.env,
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ?? "",
});

export const config = withDefaults as Config;

/**
 * Call this before making any API requests.
 * Exits with a helpful message if OPENROUTER_API_KEY is not set.
 */
export function assertApiKey(): void {
  if (!config.OPENROUTER_API_KEY) {
    console.error("\nConfiguration error:");
    console.error(
      "  OPENROUTER_API_KEY is required. Set it in .env or run:\n" +
        "  export OPENROUTER_API_KEY=sk-or-v1-...\n"
    );
    process.exit(1);
  }
}
