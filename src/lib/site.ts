/** Canonical site URL — override per environment with NEXT_PUBLIC_SITE_URL. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://open-icons.vercel.app"
).replace(/\/$/, "");

export const SITE_NAME = "Open Icons";
