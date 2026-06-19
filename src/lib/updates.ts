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
