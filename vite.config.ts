// @lovable.dev/vite-tanstack-config already includes tanstackStart, viteReact, tailwindcss,
// tsConfigPaths, nitro (cloudflare-module inside Lovable), env injection, aliases, etc.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";

// The tanstack preview-server plugin (used to serve prerender crawls) imports
// `dist/server/server.js`, but Lovable's nitro output is `dist/server/index.mjs`.
// Copy it into place after the server bundle is written so prerender can boot.
const aliasServerEntryForPrerender = {
  name: "yoked:alias-server-entry-for-prerender",
  apply: "build" as const,
  closeBundle: {
    order: "post" as const,
    handler() {
      const outDir = join(process.cwd(), "dist", "server");
      const src = join(outDir, "index.mjs");
      const dst = join(outDir, "server.js");
      if (existsSync(src) && !existsSync(dst)) {
        copyFileSync(src, dst);
      }
    },
  },
};

export default defineConfig({
  // SPA mode: client renders everything; prerender writes a static index.html
  // into dist/client so Capacitor can copy it verbatim as the WebView entry.
  tanstackStart: {
    spa: { enabled: true },
    pages: [{ path: "/", prerender: { enabled: true, outputPath: "/index.html" } }],
  },
  vite: {
    plugins: [aliasServerEntryForPrerender],
  },
});
