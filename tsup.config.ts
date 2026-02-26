import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/cli/index.ts"],
  format: ["esm"],
  target: "node20",
  platform: "node",
  clean: true,
  sourcemap: true,
  shims: false,
  banner: {
    js: "#!/usr/bin/env node",
  },
  onSuccess: "cp -r examples dist/ 2>/dev/null || true",
});
