# Changelog

All notable changes to Open Icons are documented here. This project adheres to
[Semantic Versioning](https://semver.org/).

## [0.2.0] — 2026-06-20

A big one — a 14th icon pack, a completely rebuilt Figma plugin, a fresh visual
identity, and full launch prep (SEO, PWA, and a Figma Community submission kit).

### New pack

- **Doodle Icons** — 451 hand-drawn icons, bundled and served from the project
  itself. The library is now **14 packs / ~17,745 icons**.

### Figma plugin — rebuilt

- **Browse-first home**: opens on an "All libraries" overview — every pack as a
  row with its icon count, a 2-row preview, and a Browse button. Library +
  variant selectors, infinite-scroll grid, a back button inside a pack.
- **Insert with intent**: choose a size (presets + custom px, Shift+Arrow nudges
  by 4), auto-filled from the selected layer; inserted icons are clipped,
  aspect-locked and scaled.
- **Identify a selection**: tells you which library an icon is from — by its
  `library/icon` layer name, the plugin's own stamp, or by **shape**.
- **Swap packs**: turn one icon into another pack in place; **multi-select** and
  swap a whole selection at once — exact name first, then closest by shape.
- **Variants** (e.g. Bootstrap outline/fill), **favorites & recents**,
  **light / dark / device theme**, **compact / default / large density**, a
  resizable panel, and an about menu.

### Website

- **New look** inspired by ruul.io — warm cream palette with a bright orange accent,
  **Libertinus Serif** for titles + Geist for body, and a redesigned hero with
  a designers/developers toggle.
- **Light / Dark / Device** theme switcher (no flash, follows your OS).
- New **Docs** and **Updates** pages, a **notification bell**, an **Install in
  Figma** button, and a fully **mobile-responsive** header.
- **Bootstrap** now exposes outline + fill variants on its page too.

### SEO, PWA & launch

- Open Graph + Twitter cards, richer metadata, author/creator, theme-color.
- Installable **PWA** (web-app manifest, maskable icons, service worker).
- **Figma Community kit** in `community/`: plugin icon, cover, 9 carousel
  images, an animated 1080p demo video with sound, and a publish checklist.
- Project logo used as the site logo + favicon; tidied the `public/` folder.
- Fixed the Vercel build (excluded the plugin from the site's type-check).

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
