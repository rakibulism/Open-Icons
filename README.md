# Open Icons

Browse and search thousands of free, open-source SVG icons across 13 of the
best icon packs — in one place. Copy the SVG, download it, or grab a CDN link
instantly.

**No icons are stored in this repo.** Every icon is fetched live from its source
pack (via the [jsDelivr](https://www.jsdelivr.com/) CDN, which mirrors each
pack's GitHub repo / npm package). Re-running the sync auto-updates everything
to each pack's latest release.

## Icon packs

Lucide · Phosphor · Tabler · Heroicons · Material Symbols · Feather ·
Bootstrap Icons · Remix Icon · Eva Icons · Pixelart Icons · Flagpack ·
Iconoir · Flowbite — **~18,000 icons total.**

All icons keep their original licenses (see each set page).

## How it works

```
scripts/sync.ts    → fetches each pack's file tree from the jsDelivr data API,
                     parses real icons, writes src/data/<set>.json (gitignored)
src/lib/sources.ts → one adapter per pack (where its SVGs live, how to name them)
src/app/[set]      → static, SEO-friendly page per pack; client-side search
src/components     → IconExplorer (search + variants + copy/download/CDN URL)
```

Icons are rendered theme-aware via the CSS `mask` technique (monochrome packs)
or as `<img>` (multicolor packs like flags). Nothing is bundled.

## Develop

```bash
npm install
npm run sync     # fetch latest icon metadata from all sources (one-time / to refresh)
npm run dev      # http://localhost:3000
npm run build    # runs sync automatically (prebuild), then builds
```

## Roadmap

- Global search across all packs
- Per-icon pages for deep SEO
- Figma plugin (shares the same source adapters)

## Tech

Next.js (App Router) · TypeScript · Tailwind CSS v4. SEO via per-set static
generation, sitemap, robots, and JSON-LD structured data.
