# Code Analyzer Agent (`cza`)

AI-powered code analysis CLI built on OpenRouter. Supports four reasoning modes, multimodal input, self-consistency, streaming, and a personal prompt library.

---

## Stack

| Layer | Technology | Role |
|---|---|---|
| **Runtime** | Node.js 20+ | Execution environment |
| **Language** | TypeScript 5.8 (ESM) | Type-safe source |
| **Build** | tsup | Bundles to `dist/`, injects shebang |
| **CLI framework** | Commander.js | Command/option parsing |
| **AI backend** | OpenRouter (via OpenAI SDK) | Routes to any LLM |
| **Prompting** | Chain-of-Thought + Few-Shot | Structured reasoning per mode |
| **Multimodal** | Base64 images · pdf-parse · text | Code, images, PDFs as input |
| **Persistence** | conf | JSON store for prompt library |
| **Validation** | Zod | Config and schema validation |
| **UX** | chalk · ora · @inquirer/prompts | Colors, spinners, interactive prompts |

---

## Installation

### From source

```bash
git clone git@github.com:darde/code-analyzer-agent.git
cd code-analyzer-agent
npm install
npm run build
npm link          # makes `cza` available globally
```

### API key setup

Create a `.env` file in your project directory, or a global config at `~/.code-analyzer-agent.env`:

```env
OPENROUTER_API_KEY=sk-or-...

# Optional overrides (defaults shown)
OPENROUTER_DEFAULT_MODEL=anthropic/claude-3.5-haiku
OPENROUTER_SYNTHESIS_MODEL=anthropic/claude-sonnet-4-5
OPENROUTER_VISION_MODEL=google/gemini-2.0-flash-001
OPENROUTER_MAX_TOKENS=4096
OPENROUTER_TEMPERATURE=0.2
```

Get an API key at [openrouter.ai](https://openrouter.ai).

---

## Commands

### `cza review <file>`

Code review covering correctness, style, security, and performance.

```bash
cza review src/auth.ts
cza review src/auth.ts --focus security
cza review src/auth.ts --consistency --runs 5
cza review src/auth.ts --stream
```

| Option | Description |
|---|---|
| `--focus <aspect>` | `security` · `performance` · `style` · `all` (default: `all`) |
| `--model <id>` | Override the AI model |
| `--consistency` | Enable self-consistency (N parallel runs + synthesis) |
| `--runs <n>` | Number of self-consistency runs (default: `3`) |
| `--prompt <idOrName>` | Inject a saved system prompt from your library |
| `--stream` | Stream output token-by-token |
| `--no-few-shot` | Disable few-shot examples |

---

### `cza debug <file>`

Root-cause analysis with optional error trace context.

```bash
cza debug src/parser.ts --error "TypeError: Cannot read properties of undefined"
cza debug src/parser.ts --error-file error.log
cza debug src/parser.ts --consistency
```

| Option | Description |
|---|---|
| `--error <text>` | Error message or stack trace |
| `--error-file <path>` | File containing error output |
| `--model <id>` | Override the AI model |
| `--consistency` | Enable self-consistency |
| `--runs <n>` | Number of runs (default: `3`) |
| `--prompt <idOrName>` | Inject a saved prompt |
| `--stream` | Stream output |
| `--no-few-shot` | Disable few-shot examples |

---

### `cza generate`

Generate code from a description, with optional language and framework context.

```bash
cza generate --description "Express middleware that rate-limits by IP" --language typescript
cza generate --description "React hook for debounced search" --framework react
cza generate --file src/types.ts --description "implement the UserService interface"
cza generate --consistency --runs 3 --stream
```

| Option | Description |
|---|---|
| `--description <text>` | What to generate (also accepts stdin) |
| `--language <lang>` | Target language (default: `typescript`) |
| `--framework <name>` | Framework context: `react`, `express`, etc. |
| `--file <path>` | Reference file for additional context |
| `--model <id>` | Override the AI model |
| `--consistency` | Enable self-consistency |
| `--runs <n>` | Number of runs (default: `3`) |
| `--prompt <idOrName>` | Inject a saved prompt |
| `--stream` | Stream output |
| `--no-few-shot` | Disable few-shot examples |

---

### `cza analyze <file>`

General-purpose analysis — architecture, data flow, complexity, risks.

```bash
cza analyze src/index.ts
cza analyze architecture-diagram.png       # vision model used automatically
cza analyze api-spec.pdf
cza analyze src/store.ts --message "focus on state mutation patterns"
```

| Option | Description |
|---|---|
| `--mode <mode>` | `review` · `debug` · `generate` · `analyze` (default: `analyze`) |
| `--model <id>` | Override the AI model |
| `--message <text>` | Custom task description appended to the prompt |
| `--consistency` | Enable self-consistency |
| `--runs <n>` | Number of runs (default: `3`) |
| `--prompt <idOrName>` | Inject a saved prompt |
| `--stream` | Stream output |
| `--no-few-shot` | Disable few-shot examples |

---

### `cza prompt` — Personal Prompt Library

Manage reusable system prompts stored locally via `conf`.

#### Add a prompt

```bash
cza prompt add
# interactive — fills in name, content, mode, tags

cza prompt add --name "strict-ts-review" \
               --content "Review this code with strict TypeScript best practices. Flag any use of 'any'." \
               --mode review \
               --tags "typescript,strict"
```

#### List prompts

```bash
cza prompt list
cza prompt list --mode review
cza prompt list --tag typescript
```

#### Show a prompt

```bash
cza prompt show strict-ts-review
cza prompt show abc12345          # by ID
```

#### Use a prompt in analysis

```bash
cza review src/utils.ts --prompt strict-ts-review
cza debug src/api.ts --prompt "security-audit"
```

#### Remove a prompt

```bash
cza prompt remove strict-ts-review
```

---

## Multimodal Input

Pass any file type to `cza analyze` — the correct handler is selected automatically:

| Input | Model used | Processing |
|---|---|---|
| Code / text files | Default model | Wrapped in fenced code block with language |
| `.png` `.jpg` `.jpeg` `.gif` `.webp` | Vision model (`gemini-2.0-flash`) | Encoded as base64 data URL, `detail: high` |
| `.pdf` | Default model | Text extracted via `pdf-parse` |

```bash
cza analyze screenshot.png --message "explain what this UI is doing"
cza analyze spec.pdf --message "list all API endpoints described"
cza analyze src/complex-module.ts --mode review
```

---

## Self-Consistency

Self-consistency runs N independent completions in parallel at higher temperature, then synthesizes them into a single high-confidence answer using a stronger model.

```
┌─────────────────────────────────────────────────┐
│  Same prompt sent to model N times (temp 0.7)   │
│  Run 1 ──► Candidate A                          │
│  Run 2 ──► Candidate B                          │
│  Run 3 ──► Candidate C                          │
└──────────────────────┬──────────────────────────┘
                       │
            ┌──────────▼──────────┐
            │  Synthesis model    │
            │  (temp 0.2)         │
            │  Agree → keep       │
            │  Disagree → reason  │
            │  Wrong → discard    │
            └──────────┬──────────┘
                       │
               Final definitive answer
```

Enable with `--consistency`. Control the number of parallel runs with `--runs <n>`.

---

## Chain-of-Thought Reasoning

Each mode follows a structured reasoning chain before producing output:

| Mode | Reasoning steps |
|---|---|
| **review** | Understand intent → correctness → style → security → performance → summarize |
| **debug** | Reproduce mentally → trace execution → root cause → minimal fix → explain why |
| **generate** | Clarify requirements → plan structure → implement → review → add comments |
| **analyze** | Identify components → trace data/control flow → evaluate complexity → note risks → summarize |

Few-shot examples are loaded per mode from `examples/few-shot-{mode}.json` and injected into the message context automatically (disable with `--no-few-shot`).

---

## Models

Default models are configured via environment variables and can be overridden per-command with `--model`:

| Purpose | Default model |
|---|---|
| Analysis (default) | `anthropic/claude-3.5-haiku` |
| Self-consistency synthesis | `anthropic/claude-sonnet-4-5` |
| Vision / image input | `google/gemini-2.0-flash-001` |

Any model available on [OpenRouter](https://openrouter.ai/models) can be used.

```bash
cza review src/auth.ts --model openai/gpt-4o
cza generate --description "..." --model anthropic/claude-opus-4-5
```

---

## Development

```bash
npm run dev       # run from source with tsx (no build step)
npm run build     # compile to dist/
npm run lint      # type-check with tsc --noEmit
```

The `examples/` directory is copied to `dist/` automatically on build.
