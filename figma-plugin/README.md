# Open Icons — Figma plugin

Search ~18k open-source icons and insert any of them into Figma as editable
vector layers. Powered by the [Open Icons](https://open-icons.vercel.app)
index — **no icons are bundled**; SVGs are fetched live from the jsDelivr CDN at
insert time, and the searchable index is loaded from the deployed website (so it
stays in sync automatically).

## Build

```bash
cd figma-plugin
npm install
npm run build      # → dist/code.js + dist/ui.html
```

## Run it in Figma

1. Figma desktop → **Plugins → Development → Import plugin from manifest…**
2. Select `figma-plugin/manifest.json`.
3. Run **Open Icons** from the Plugins menu. Search, then click an icon to drop
   it onto the canvas.

## Configuration

The plugin loads its index from `https://open-icons.vercel.app/data/search.json`
by default. To point it at a different deployment, open the **⚙ settings** in the
plugin and paste your URL (persisted via `figma.clientStorage`). If you use a
custom domain, also add it to `networkAccess.allowedDomains` in `manifest.json`.

## How it shares code with the website

`src/ui.tsx` imports `cdnUrl` directly from the website's `src/lib/sources.ts`,
so CDN URL construction is defined once and reused. The controller
(`src/code.ts`) runs in Figma's sandbox and only handles inserting the SVG
(`figma.createNodeFromSvg`) and persisting settings — all network calls happen
in the UI iframe.
