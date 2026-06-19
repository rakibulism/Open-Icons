/**
 * Open Icons — shape fingerprint generator.
 *
 * Reads the combined search index, fetches each icon's default-variant SVG from
 * the CDN, computes a geometry signature (see lib/fingerprint.ts), and writes a
 * compact map to public/data/fingerprints.json for shape-based matching in the
 * Figma plugin.
 *
 * This is INTENTIONALLY separate from `npm run sync` (it makes ~18k requests and
 * takes a few minutes) so normal builds/deploys stay fast. Run on demand:
 *
 *   npm run sync:fingerprints
 */
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { cdnUrl } from "../src/lib/sources";
import { fingerprint } from "../src/lib/fingerprint";

const PUBLIC_DATA = join(process.cwd(), "public", "data");
const CONCURRENCY = 64;

type SetMeta = { version: string; type: "gh" | "npm"; pkg: string; defaultVariant: string };
type Hit = { n: string; s: string; v: Record<string, string> };
type SearchIndex = { sets: Record<string, SetMeta>; icons: Hit[] };

async function run() {
  const raw = await readFile(join(PUBLIC_DATA, "search.json"), "utf8");
  const index = JSON.parse(raw) as SearchIndex;
  const { sets, icons } = index;

  const out: Record<string, string> = {};
  let done = 0;
  let empty = 0;
  let failed = 0;

  // Simple fixed-size worker pool over the icon list.
  let cursor = 0;
  async function worker() {
    while (cursor < icons.length) {
      const hit = icons[cursor++];
      const sm = sets[hit.s];
      const path = hit.v[sm.defaultVariant] ?? Object.values(hit.v)[0];
      const url = cdnUrl({ type: sm.type, pkg: sm.pkg }, sm.version, path);
      try {
        const svg = await fetch(url).then((r) => (r.ok ? r.text() : ""));
        const sig = svg ? fingerprint(svg) : "";
        if (sig) out[`${hit.s}:${hit.n}`] = sig;
        else empty++;
      } catch {
        failed++;
      }
      if (++done % 1000 === 0) {
        process.stdout.write(`  ${done}/${icons.length}\n`);
      }
    }
  }

  console.log(`Fingerprinting ${icons.length.toLocaleString()} icons (concurrency ${CONCURRENCY})…`);
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  await writeFile(join(PUBLIC_DATA, "fingerprints.json"), JSON.stringify(out));
  console.log(
    `\n✓ ${Object.keys(out).length.toLocaleString()} fingerprints → public/data/fingerprints.json` +
      `\n  (${empty} had no usable geometry, ${failed} fetch failures)`,
  );
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
