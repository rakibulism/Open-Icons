import type { IconSource, ParsedIcon } from "./types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Split a "/a/b/c.svg" path into ["a","b","c.svg"] (drops leading ""). */
function parts(path: string): string[] {
  return path.replace(/^\//, "").split("/");
}

/** Filename without the .svg extension. */
function baseName(path: string): string {
  const last = path.split("/").pop() ?? "";
  return last.replace(/\.svg$/i, "");
}

const isSvg = (p: string) => /\.svg$/i.test(p);

// ---------------------------------------------------------------------------
// Source registry — one adapter per pack. Ground-truthed against the live
// jsDelivr file trees. parse() returns null for anything that isn't a real,
// user-facing icon (docs, logos, build artifacts, etc).
// ---------------------------------------------------------------------------

export const SOURCES: IconSource[] = [
  // 1. Lucide — /icons/<name>.svg (flat)
  {
    id: "lucide",
    name: "Lucide",
    type: "gh",
    pkg: "lucide-icons/lucide",
    license: { name: "ISC", url: "https://github.com/lucide-icons/lucide/blob/main/LICENSE" },
    homepage: "https://lucide.dev",
    repoUrl: "https://github.com/lucide-icons/lucide",
    defaultVariant: "default",
    variants: ["default"],
    parse(path) {
      if (!isSvg(path)) return null;
      const p = parts(path);
      if (p.length !== 2 || p[0] !== "icons") return null; // icons/x.svg only
      return { name: baseName(path), variant: "default", path };
    },
  },

  // 2. Phosphor — /assets/<weight>/<name>[-weight].svg
  {
    id: "phosphor",
    name: "Phosphor",
    type: "gh",
    pkg: "phosphor-icons/core",
    license: { name: "MIT", url: "https://github.com/phosphor-icons/core/blob/main/LICENSE" },
    homepage: "https://phosphoricons.com",
    repoUrl: "https://github.com/phosphor-icons/core",
    defaultVariant: "regular",
    variants: ["thin", "light", "regular", "bold", "fill", "duotone"],
    parse(path) {
      if (!isSvg(path)) return null;
      const p = parts(path);
      if (p.length !== 3 || p[0] !== "assets") return null; // skip /raw
      const weight = p[1];
      if (!["thin", "light", "regular", "bold", "fill", "duotone"].includes(weight)) return null;
      let name = baseName(path);
      const suffix = `-${weight}`;
      if (weight !== "regular" && name.endsWith(suffix)) name = name.slice(0, -suffix.length);
      return { name, variant: weight, path };
    },
  },

  // 3. Tabler — npm /icons/<outline|filled>/<name>.svg
  {
    id: "tabler",
    name: "Tabler",
    type: "npm",
    pkg: "@tabler/icons",
    license: { name: "MIT", url: "https://github.com/tabler/tabler-icons/blob/main/LICENSE" },
    homepage: "https://tabler.io/icons",
    repoUrl: "https://github.com/tabler/tabler-icons",
    defaultVariant: "outline",
    variants: ["outline", "filled"],
    parse(path) {
      if (!isSvg(path)) return null;
      const p = parts(path);
      if (p.length !== 3 || p[0] !== "icons") return null; // skip /categories
      if (p[1] !== "outline" && p[1] !== "filled") return null;
      return { name: baseName(path), variant: p[1], path };
    },
  },

  // 4. Heroicons — /optimized/<size>/<style>/<name>.svg
  {
    id: "heroicons",
    name: "Heroicons",
    type: "gh",
    pkg: "tailwindlabs/heroicons",
    license: { name: "MIT", url: "https://github.com/tailwindlabs/heroicons/blob/master/LICENSE" },
    homepage: "https://heroicons.com",
    repoUrl: "https://github.com/tailwindlabs/heroicons",
    defaultVariant: "24-outline",
    variants: ["24-outline", "24-solid", "20-solid", "16-solid"],
    parse(path) {
      if (!isSvg(path)) return null;
      const p = parts(path);
      if (p.length !== 4 || p[0] !== "optimized") return null;
      return { name: baseName(path), variant: `${p[1]}-${p[2]}`, path };
    },
  },

  // 5. Material Design Icons — npm /<style>/<name>.svg
  {
    id: "material",
    name: "Material Symbols",
    type: "npm",
    pkg: "@material-design-icons/svg",
    license: { name: "Apache-2.0", url: "https://github.com/google/material-design-icons/blob/master/LICENSE" },
    homepage: "https://fonts.google.com/icons",
    repoUrl: "https://github.com/google/material-design-icons",
    defaultVariant: "outlined",
    variants: ["filled", "outlined", "round", "sharp", "two-tone"],
    parse(path) {
      if (!isSvg(path)) return null;
      const p = parts(path);
      if (p.length !== 2) return null;
      if (!["filled", "outlined", "round", "sharp", "two-tone"].includes(p[0])) return null;
      return { name: baseName(path), variant: p[0], path };
    },
  },

  // 6. Feather — /icons/<name>.svg
  {
    id: "feather",
    name: "Feather",
    type: "gh",
    pkg: "feathericons/feather",
    license: { name: "MIT", url: "https://github.com/feathericons/feather/blob/main/LICENSE" },
    homepage: "https://feathericons.com",
    repoUrl: "https://github.com/feathericons/feather",
    defaultVariant: "default",
    variants: ["default"],
    parse(path) {
      if (!isSvg(path)) return null;
      const p = parts(path);
      if (p.length !== 2 || p[0] !== "icons") return null;
      return { name: baseName(path), variant: "default", path };
    },
  },

  // 7. Bootstrap Icons — /icons/<name>.svg
  {
    id: "bootstrap",
    name: "Bootstrap Icons",
    type: "gh",
    pkg: "twbs/icons",
    license: { name: "MIT", url: "https://github.com/twbs/icons/blob/main/LICENSE" },
    homepage: "https://icons.getbootstrap.com",
    repoUrl: "https://github.com/twbs/icons",
    defaultVariant: "default",
    variants: ["default"],
    parse(path) {
      if (!isSvg(path)) return null;
      const p = parts(path);
      if (p.length !== 2 || p[0] !== "icons") return null;
      return { name: baseName(path), variant: "default", path };
    },
  },

  // 8. Remix Icon — /icons/<Category>/<name>-<line|fill>.svg
  {
    id: "remix",
    name: "Remix Icon",
    type: "gh",
    pkg: "Remix-Design/RemixIcon",
    license: { name: "Apache-2.0", url: "https://github.com/Remix-Design/RemixIcon/blob/master/License" },
    homepage: "https://remixicon.com",
    repoUrl: "https://github.com/Remix-Design/RemixIcon",
    defaultVariant: "line",
    variants: ["line", "fill"],
    parse(path) {
      if (!isSvg(path)) return null;
      const p = parts(path);
      if (p.length !== 3 || p[0] !== "icons") return null;
      const category = p[1];
      let name = baseName(path);
      let variant = "default";
      if (name.endsWith("-fill")) {
        variant = "fill";
        name = name.slice(0, -5);
      } else if (name.endsWith("-line")) {
        variant = "line";
        name = name.slice(0, -5);
      }
      return { name, variant, category, path };
    },
  },

  // 9. Eva Icons — /package/icons/<fill|outline>/svg/<name>.svg
  {
    id: "eva",
    name: "Eva Icons",
    type: "gh",
    pkg: "akveo/eva-icons",
    license: { name: "MIT", url: "https://github.com/akveo/eva-icons/blob/master/LICENSE.txt" },
    homepage: "https://akveo.github.io/eva-icons",
    repoUrl: "https://github.com/akveo/eva-icons",
    defaultVariant: "outline",
    variants: ["outline", "fill"],
    parse(path) {
      if (!isSvg(path)) return null;
      const p = parts(path);
      if (p.length !== 5 || p[0] !== "package" || p[1] !== "icons" || p[3] !== "svg") return null;
      if (p[2] !== "fill" && p[2] !== "outline") return null;
      return { name: baseName(path), variant: p[2], path };
    },
  },

  // 10. Pixelarticons — /svg/<name>.svg
  {
    id: "pixelart",
    name: "Pixelart Icons",
    type: "gh",
    pkg: "halfmage/pixelarticons",
    license: { name: "MIT", url: "https://github.com/halfmage/pixelarticons/blob/master/LICENSE" },
    homepage: "https://pixelarticons.com",
    repoUrl: "https://github.com/halfmage/pixelarticons",
    defaultVariant: "default",
    variants: ["default"],
    parse(path) {
      if (!isSvg(path)) return null;
      const p = parts(path);
      if (p.length !== 2 || p[0] !== "svg") return null;
      return { name: baseName(path), variant: "default", path };
    },
  },

  // 11. Flagpack — /svg/<s|m|l>/<CODE>.svg
  {
    id: "flagpack",
    name: "Flagpack",
    type: "gh",
    pkg: "Yummygum/flagpack-core",
    license: { name: "MIT", url: "https://github.com/Yummygum/flagpack-core/blob/main/LICENSE" },
    homepage: "https://flagpack.xyz",
    repoUrl: "https://github.com/Yummygum/flagpack-core",
    defaultVariant: "m",
    variants: ["s", "m", "l"],
    mono: false, // flags are multicolor — render as <img>, don't recolor
    parse(path) {
      if (!isSvg(path)) return null;
      const p = parts(path);
      if (p.length !== 3 || p[0] !== "svg") return null; // skip /lib/flags numeric set
      if (!["s", "m", "l"].includes(p[1])) return null;
      return { name: baseName(path), variant: p[1], path };
    },
  },

  // 12. Iconoir — /icons/<regular|solid>/<name>.svg
  {
    id: "iconoir",
    name: "Iconoir",
    type: "gh",
    pkg: "iconoir-icons/iconoir",
    license: { name: "MIT", url: "https://github.com/iconoir-icons/iconoir/blob/main/LICENSE" },
    homepage: "https://iconoir.com",
    repoUrl: "https://github.com/iconoir-icons/iconoir",
    defaultVariant: "regular",
    variants: ["regular", "solid"],
    parse(path) {
      if (!isSvg(path)) return null;
      const p = parts(path);
      if (p.length !== 3 || p[0] !== "icons") return null;
      if (p[1] !== "regular" && p[1] !== "solid") return null;
      return { name: baseName(path), variant: p[1], path };
    },
  },

  // 13. Flowbite — npm /src/<outline|solid>/<category>/<name>.svg
  {
    id: "flowbite",
    name: "Flowbite",
    type: "npm",
    pkg: "flowbite-icons",
    license: { name: "MIT", url: "https://github.com/themesberg/flowbite-icons/blob/main/LICENSE" },
    homepage: "https://flowbite.com/icons",
    repoUrl: "https://github.com/themesberg/flowbite-icons",
    defaultVariant: "outline",
    variants: ["outline", "solid"],
    parse(path) {
      if (!isSvg(path)) return null;
      const p = parts(path);
      if (p.length !== 4 || p[0] !== "src") return null;
      if (p[1] !== "outline" && p[1] !== "solid") return null;
      return { name: baseName(path), variant: p[1], category: p[2], path };
    },
  },
];

export function getSource(id: string): IconSource | undefined {
  return SOURCES.find((s) => s.id === id);
}

/** Build a jsDelivr CDN URL for a given source + resolved version + path. */
export function cdnUrl(
  source: Pick<IconSource, "type" | "pkg">,
  version: string,
  path: string,
): string {
  return `https://cdn.jsdelivr.net/${source.type}/${source.pkg}@${version}${path}`;
}

/** Build the jsDelivr data-API URL listing a package's flat file tree. */
export function treeUrl(source: Pick<IconSource, "type" | "pkg">, version: string): string {
  return `https://data.jsdelivr.com/v1/packages/${source.type}/${source.pkg}@${version}?structure=flat`;
}

/** Build the jsDelivr data-API URL that lists available versions. */
export function versionsUrl(source: Pick<IconSource, "type" | "pkg">): string {
  return `https://data.jsdelivr.com/v1/packages/${source.type}/${source.pkg}`;
}

export type { ParsedIcon };
