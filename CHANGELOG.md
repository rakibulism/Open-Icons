# Changelog

All notable changes to Open Icons are documented here. This project adheres to
[Semantic Versioning](https://semver.org/).

## [0.1.0] — 2026-06-19

First public release — the website and the Figma plugin.

### Website

- Browse **13 open-source icon packs** — Lucide, Phosphor, Tabler, Heroicons,
  Material Symbols, Feather, Bootstrap Icons, Remix Icon, Eva Icons, Pixelart
  Icons, Flagpack, Iconoir, Flowbite — **~18,000 icons** total.
- **Nothing stored**: every icon is fetched live from its source pack via the
  jsDelivr CDN. `npm run sync` regenerates the metadata index from each pack's
  latest release.
- Per-pack pages with instant search, variant switching, and pagination.
- Copy SVG, download, copy CDN URL, copy name from a detail view.
- **Global search** (`/search`) across every pack at once, with per-pack filters
  and a `/` keyboard shortcut.
- Theme-aware rendering (CSS mask for monochrome packs, `<img>` for multicolor).
- SEO: static per-pack pages, metadata, `sitemap.xml`, `robots.txt`, and JSON-LD.

### Figma plugin (`figma-plugin/`)

- Search and insert any icon as an editable vector (`createNodeFromSvg`).
- **Variant picker** — choose outline/solid, weights, or sizes before inserting.
- **Favorites & recents**, persisted via `figma.clientStorage`.
- **Identify a selection** — tells you which library icon is selected:
  exact (plugin-stamped), by name, or **by shape** via a geometry fingerprint.
- **Swap packs** — replace the selected icon in place with another pack's version.
- Loads its index live from the deployed site, so it stays in sync.

[0.1.0]: https://github.com/rakibulism/Open-Icons/releases/tag/v0.1.0
