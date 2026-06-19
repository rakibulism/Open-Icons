/** Canonical site URL — override per environment with NEXT_PUBLIC_SITE_URL. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://open-icons.vercel.app"
).replace(/\/$/, "");

export const SITE_NAME = "Open Icons";

/** Figma plugin install URL — placeholder until the plugin is published. */
export const FIGMA_PLUGIN_URL = "#";

/** Creator's X / Twitter. */
export const CREATOR_X = "https://x.com/rakibulism";
export const CREATOR_HANDLE = "@rakibulism";
