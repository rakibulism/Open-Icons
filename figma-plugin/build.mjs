import * as esbuild from "esbuild";
import { readFile, writeFile, mkdir } from "node:fs/promises";

const watch = process.argv.includes("--watch");
await mkdir("dist", { recursive: true });

const codeOpts = {
  entryPoints: ["src/code.ts"],
  bundle: true,
  outfile: "dist/code.js",
  target: "es2017",
  platform: "browser",
  logLevel: "info",
};

// The UI is emitted as a single self-contained HTML file (Figma loads it as the
// iframe contents), with the JS bundle and CSS inlined.
async function buildUi() {
  const css = await readFile("src/ui.css", "utf8");
  const result = await esbuild.build({
    entryPoints: ["src/ui.tsx"],
    bundle: true,
    write: false,
    target: "es2017",
    format: "iife",
    jsx: "automatic",
    loader: { ".tsx": "tsx", ".ts": "ts" },
    define: { "process.env.NODE_ENV": '"production"' },
    logLevel: "info",
  });
  const js = result.outputFiles[0].text;
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>${css}</style></head><body><div id="root"></div><script>${js}</script></body></html>`;
  await writeFile("dist/ui.html", html);
}

if (watch) {
  const ctx = await esbuild.context(codeOpts);
  await ctx.watch();
  await buildUi();
  console.log("✓ watching code.ts — re-run `npm run build` after editing the UI");
} else {
  await esbuild.build(codeOpts);
  await buildUi();
  console.log("✓ built dist/code.js and dist/ui.html");
}
