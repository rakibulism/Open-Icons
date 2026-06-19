// Core domain types for Open Icons.
// No SVG content is ever stored — only metadata pointing back to each pack's
// source repo, served through the jsDelivr CDN. See lib/sources.ts.

export type LicenseInfo = {
  name: string;
  url: string;
};

/** A single parsed SVG file from a source repo. */
export type ParsedIcon = {
  /** Normalized icon name, shared across variants (e.g. "arrow-up"). */
  name: string;
  /** Variant key within the set (e.g. "outline", "bold", "24-solid"). */
  variant: string;
  /** Optional category/grouping from the repo's folder structure. */
  category?: string;
  /** Path within the package, beginning with "/" (e.g. "/icons/x.svg"). */
  path: string;
};

/** A source pack adapter — knows how to locate and interpret one repo. */
export type IconSource = {
  /** Stable slug used in URLs and the manifest (e.g. "lucide"). */
  id: string;
  /** Human display name (e.g. "Lucide"). */
  name: string;
  /** jsDelivr origin: GitHub repo or npm package. */
  type: "gh" | "npm";
  /** "user/repo" for gh, or "@scope/pkg" / "pkg" for npm. */
  pkg: string;
  /** Optional ref override (branch/tag/version). Defaults to latest. */
  ref?: string;
  license: LicenseInfo;
  homepage: string;
  repoUrl: string;
  /** Default variant to show in grids/thumbnails. */
  defaultVariant: string;
  /** Ordered list of known variants (for filter UIs); informational. */
  variants: string[];
  /**
   * Whether icons are single-color (themed via CSS mask). Defaults true.
   * Set false for inherently multicolor sets (e.g. flags) which render as
   * real <img> so their colors are preserved.
   */
  mono?: boolean;
  /** Map a "/.../*.svg" path to an icon record, or null to skip it. */
  parse: (path: string) => ParsedIcon | null;
};

/** One icon in the generated manifest: a name with one-or-more variant paths. */
export type ManifestIcon = {
  /** Icon name. */
  n: string;
  /** Variant -> path map. */
  v: Record<string, string>;
  /** Optional category. */
  c?: string;
};

/** Per-set manifest written to src/data/<id>.json (gitignored, auto-synced). */
export type SetManifest = {
  id: string;
  name: string;
  version: string;
  type: "gh" | "npm";
  pkg: string;
  license: LicenseInfo;
  homepage: string;
  repoUrl: string;
  defaultVariant: string;
  variants: string[];
  mono: boolean;
  count: number;
  /** ISO timestamp of when this manifest was generated. */
  syncedAt: string;
  icons: ManifestIcon[];
};

/** Lightweight index entry across all sets (src/data/index.json). */
export type SetSummary = {
  id: string;
  name: string;
  version: string;
  count: number;
  defaultVariant: string;
  variants: string[];
  mono: boolean;
  license: LicenseInfo;
  homepage: string;
  repoUrl: string;
  syncedAt: string;
};
