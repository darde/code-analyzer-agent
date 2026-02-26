# Code Analyzer Agent — Memory

## Project Summary
TypeScript CLI tool (`cza`) built in `/Users/pablodarde/Learning/Taller/taller-code-analyzer-agent/`
- OpenRouter as AI provider (OpenAI-compatible API)
- Chain-of-Thought, Few-Shot, Self-Consistency, Multimodal (image/PDF/code)
- Personal prompt library stored at `~/.config/code-analyzer-agent/`

## Key Architecture
- `src/cli/index.ts` → CLI entry point (Commander, bin: `cza`)
- `src/agent/client.ts` → OpenRouter client (lazy singleton, `getClient()`)
- `src/agent/reasoning.ts` → CoT system prompts + few-shot builder
- `src/agent/self-consistency.ts` → N parallel completions + synthesis
- `src/multimodal/` → image (base64), PDF (pdf-parse), code files
- `src/prompt-library/` → CRUD over conf-based persistent store
- `src/config/env.ts` → dotenv load + lazy validation (assertApiKey())

## Build & Run
- `npm run dev -- <args>` — run without building (tsx)
- `npm run build` — compile to `dist/index.js` (tsup)
- `npm run lint` — TypeScript type-check
- Output is `dist/index.js` (tsup flattens entry), not `dist/cli/index.js`

## Key Design Decisions
- `"type": "module"` (ESM) for chalk/ora/nanoid compatibility
- `"module": "NodeNext"` requires `.js` extensions on all local imports
- `assertApiKey()` pattern: env loads without exiting, deferred validation
- `openRouterClient` is a Proxy that lazily creates the real client
- Self-consistency: N runs at temp=0.7, synthesis at temp=0.2
- Few-shot examples in `examples/few-shot-{mode}.json` (copied to dist/)

## CLI Commands
```
cza analyze <file> [--mode review|debug|generate|analyze] [--consistency] [--stream]
cza review <file> [--focus security|performance|style|all] [--consistency]
cza generate --description <text> [--language ts] [--framework react]
cza debug <file> --error <text>
cza prompt add|list|show|use|remove
```

## User Preferences
- Language: TypeScript/Node.js
- Interface: CLI tool
- AI Provider: OpenRouter
