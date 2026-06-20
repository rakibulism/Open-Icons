/** "What's new" entries — single source for the /updates page and the bell. */
export type Update = {
  /** ISO date (YYYY-MM-DD). */
  date: string;
  title: string;
  summary: string;
  tag?: "new" | "improved" | "fixed";
};

export const UPDATES: Update[] = [
  {
    date: "2026-06-20",
    title: "Figma plugin is live",
    summary:
      "The Open Icons plugin is now on the Figma Community — search and insert any icon as an editable vector, switch variants, swap a selection between packs, and identify icons in your file.",
    tag: "new",
  },
  {
    date: "2026-06-20",
    title: "A bolder identity",
    summary:
      "A vivid orange (#FF3D03) is now the brand color across buttons, accents and chips — matched to the logo. The home page leads with a warm sunset hero.",
    tag: "improved",
  },
  {
    date: "2026-06-20",
    title: "Redesigned icon-pack cards",
    summary:
      "Each pack now previews real sample icons on a fanned set of tiles that spread into a row on hover, over a soft gradient panel.",
    tag: "improved",
  },
  {
    date: "2026-06-20",
    title: "Search from the home page",
    summary:
      "A full-width search bar sits right in the hero — press / to focus it, type, and jump straight into results across every pack.",
    tag: "new",
  },
  {
    date: "2026-06-20",
    title: "Water-ripple hero",
    summary:
      "Move your cursor over the hero and the sunset ripples beneath it — a lightweight WebGL effect that falls back to the still image where unsupported.",
    tag: "new",
  },
  {
    date: "2026-06-20",
    title: "Doodle Icons — a 14th pack",
    summary:
      "451 hand-drawn icons join the library, bringing it to 14 packs and ~17,745 icons. Bundled and served from Open Icons itself.",
    tag: "new",
  },
  {
    date: "2026-06-20",
    title: "Rebuilt Figma plugin",
    summary:
      "Browse-first home, size controls, light/dark/device themes, pack & shape detection of a selection, and one-click pack swaps — including swapping a whole multi-selection at once.",
    tag: "improved",
  },
  {
    date: "2026-06-20",
    title: "A fresh look",
    summary:
      "A warm new palette with a bright orange accent, Libertinus Serif titles, a redesigned hero, and a Light / Dark / Device theme switcher across the site.",
    tag: "improved",
  },
  {
    date: "2026-06-20",
    title: "Installable PWA + Bootstrap variants",
    summary:
      "Open Icons is now installable as a PWA, with sharper SEO and social cards. Bootstrap Icons gained an outline/fill variant switch.",
    tag: "improved",
  },
  {
    date: "2026-06-19",
    title: "Figma plugin",
    summary:
      "Search and insert any icon as an editable vector, pick sizes, swap packs, and identify a selected icon by name or shape — all from inside Figma.",
    tag: "new",
  },
  {
    date: "2026-06-19",
    title: "Global search across every pack",
    summary:
      "Search all ~18,000 icons at once with per-pack filters, or jump into a single library.",
    tag: "new",
  },
  {
    date: "2026-06-19",
    title: "13 open-source packs, live from source",
    summary:
      "Lucide, Phosphor, Tabler, Heroicons, Material, Feather, Bootstrap, Remix, Eva, Pixelart, Flagpack, Iconoir and Flowbite — fetched live via jsDelivr, nothing stored.",
    tag: "new",
  },
];

/** The most recent update's date, used to flag "unread" in the bell. */
export const LATEST_UPDATE = UPDATES[0]?.date ?? "";
