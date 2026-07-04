# Changelog

All notable changes to Open Icons are documented here. This project adheres to
[Semantic Versioning](https://semver.org/).

## [0.3.0] — 2026-07-04

A visual refresh of the website, a much smarter search everywhere, and a
substantial round of Figma plugin upgrades: auto-navigation, related-icon
browsing, an Auto size mode, color-safe swapping, and a real Settings modal.

### Search, everywhere

- **Fuzzy prefix fallback** — search now surfaces close relatives even without
  an exact substring match (typing "globe" also finds "global"), by
  progressively trying shorter prefixes once exact/alias matches run thin.
- **Search aliases** — packs that name a concept differently now still surface
  under the common term (e.g. "user group" finds Remix Icon's `group`/`team`),
  matching progressively as you type rather than only once fully typed.
- **Grouped results** — searching across all packs (site global search and the
  Figma plugin) now groups matches by pack with a "See all →" per group,
  instead of one mixed grid.
- **Icons in this category** — viewing an icon (site detail modal or an
  identified selection in the plugin) now surfaces other icons in the same
  pack sharing its core keyword, one click away.
- One-click **clear (×)** button on every search box (site and plugin).

### Figma plugin

- **Auto-jump to library**: selecting an identified icon on canvas now jumps
  the browser into that icon's library and reveals it via search, with a
  brief highlight — instead of leaving you wherever you were browsing.
- **Auto size**: an explicit "Auto" mode that keeps the insert/replace size in
  sync with the selected icon, alongside the fixed presets (16/24/32/48/64 +
  custom px) — picking a preset now locks it until Auto is re-enabled.
- **Color-safe swapping**: replacing a single-color icon now keeps the
  outgoing icon's fill color instead of resetting to the fetched SVG's
  default (multicolor packs like Flagpack are left untouched).
- **Settings is now a popup modal**, with new toggles for auto-jump-to-library
  and grouped search results — both default on, either can be switched off.
- UI polish pass: consistent control heights, tighter spacing rhythm, and
  quieter secondary buttons instead of a repeated glowing CTA.
- Fixed a manifest bug where a stray duplicate `id` key could make Figma fail
  to load the plugin ("An error occurred while loading the plugin environment").

### Brand & look

- **New brand color** — a vivid orange (`#FF3D03`), matched to the logo, drives
  buttons, accents and chips across the site. Primary buttons are now orange.
- **Sunset hero** — a warm sky background sits behind the hero, faded out toward
  the bottom so content stays legible; scalable and responsive at any width.
- **Water-ripple hero** — a lightweight WebGL2 effect ripples the hero
  background as the cursor moves over it (hero only), idling when inactive and
  degrading gracefully to the static image where WebGL2 isn't available.

### Icon-pack cards

- Redesigned as two-zone cards: a soft gradient panel previewing **real sample
  icons** from each pack on **fanned tiles** that spread into a straight row on
  hover, above a clean body with the name, count and license.
- Variant chips restyled as **transparent orange**; cards stay put on hover
  (no shadow or position shift).

### Hero & search

- A **full-width search bar** now lives in the hero — `/` focuses it, a clear
  (×) button appears while typing, and submitting jumps to `/search?q=…`.
- Moved the library stat line to the right of the **Icon packs** heading and
  removed the redundant hero install button (still in the header).

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
