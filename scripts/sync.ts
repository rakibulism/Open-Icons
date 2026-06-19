/**
 * Open Icons — sync script.
 *
 * Fetches the live file tree of every source pack from the jsDelivr data API
 * (which mirrors each pack's GitHub repo / npm package — no GitHub rate limits,
 * no auth, nothing stored), parses out the real icons, groups them by name +
 * variant, and writes one manifest per set to src/data/.
 *
 * NO SVG CONTENT IS STORED. Manifests hold only icon names, variant keys and
 * the path within the package; the actual SVG is fetched from the CDN at
 * runtime. Re-run this script any time to auto-sync with upstream releases:
 *
 *   npm run sync
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { SOURCES, treeUrl, versionsUrl } from "../src/lib/sources";
import type { ManifestIcon, SetManifest, SetSummary } from "../src/lib/types";

const DATA_DIR = join(process.cwd(), "src", "data");
const PUBLIC_DATA_DIR = join(process.cwd(), "public", "data");

type JsdFile = { name: string };

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "user-agent": "open-icons-sync" } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return (await res.json()) as T;
}

async function resolveVersion(source: (typeof SOURCES)[number]): Promise<string> {
  if (source.ref) return source.ref;
  const meta = await getJson<{
    tags?: Record<string, string>;
    versions?: { version: string }[];
  }>(versionsUrl(source));
  const latest = meta.tags?.latest ?? meta.versions?.[0]?.version;
  if (!latest) throw new Error(`No versions found for ${source.pkg}`);
  return latest;
}

async function syncOne(
  source: (typeof SOURCES)[number],
  syncedAt: string,
): Promise<{ summary: SetSummary; manifest: SetManifest }> {
  const version = await resolveVersion(source);
  const tree = await getJson<{ files?: JsdFile[] }>(treeUrl(source, version));
  const files = tree.files ?? [];

  // Group parsed files by icon name -> { variant: path }.
  const byName = new Map<string, ManifestIcon>();
  for (const file of files) {
    if (!file.name.endsWith(".svg")) continue;
    const parsed = source.parse(file.name);
    if (!parsed) continue;
    let icon = byName.get(parsed.name);
    if (!icon) {
      icon = { n: parsed.name, v: {} };
      if (parsed.category) icon.c = parsed.category;
      byName.set(parsed.name, icon);
    }
    icon.v[parsed.variant] = parsed.path;
  }

  const icons = [...byName.values()].sort((a, b) => a.n.localeCompare(b.n));

  const manifest: SetManifest = {
    id: source.id,
    name: source.name,
    version,
    type: source.type,
    pkg: source.pkg,
    license: source.license,
    homepage: source.homepage,
    repoUrl: source.repoUrl,
    defaultVariant: source.defaultVariant,
    variants: source.variants,
    mono: source.mono !== false,
    count: icons.length,
    syncedAt,
    icons,
  };

  await writeFile(join(DATA_DIR, `${source.id}.json`), JSON.stringify(manifest));

  const summary: SetSummary = {
    id: source.id,
    name: source.name,
    version,
    count: icons.length,
    defaultVariant: source.defaultVariant,
    variants: source.variants,
    mono: source.mono !== false,
    license: source.license,
    homepage: source.homepage,
    repoUrl: source.repoUrl,
    syncedAt,
  };
  return { summary, manifest };
}

async function main() {
  await mkdir(DATA_DIR, { recursive: true });
  await mkdir(PUBLIC_DATA_DIR, { recursive: true });
  const syncedAt = new Date().toISOString();
  const summaries: SetSummary[] = [];
  const manifests: SetManifest[] = [];

  for (const source of SOURCES) {
    process.stdout.write(`• ${source.name.padEnd(18)} `);
    try {
      const { summary, manifest } = await syncOne(source, syncedAt);
      summaries.push(summary);
      manifests.push(manifest);
      console.log(`${String(summary.count).padStart(6)} icons  (${summary.version})`);
    } catch (err) {
      console.log(`FAILED — ${(err as Error).message}`);
    }
  }

  summaries.sort((a, b) => a.name.localeCompare(b.name));
  const total = summaries.reduce((n, s) => n + s.count, 0);
  await writeFile(
    join(DATA_DIR, "index.json"),
    JSON.stringify({ syncedAt, total, sets: summaries }, null, 2),
  );

  // Combined global search index — served statically at /data/search.json
  // (same-origin for the website, absolute URL for the Figma plugin). Holds
  // every icon's name + variant paths plus minimal per-set CDN metadata.
  const searchIndex = {
    syncedAt,
    total,
    sets: Object.fromEntries(
      manifests.map((m) => [
        m.id,
        { name: m.name, version: m.version, type: m.type, pkg: m.pkg, mono: m.mono, defaultVariant: m.defaultVariant },
      ]),
    ),
    icons: manifests.flatMap((m) => m.icons.map((i) => ({ n: i.n, s: m.id, v: i.v }))),
  };
  await writeFile(join(PUBLIC_DATA_DIR, "search.json"), JSON.stringify(searchIndex));

  console.log(
    `\n✓ ${summaries.length} sets, ${total.toLocaleString()} icons total → src/data/` +
      `\n✓ global search index (${searchIndex.icons.length.toLocaleString()} icons) → public/data/search.json`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
