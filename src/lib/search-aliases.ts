// Some packs name a concept differently than the common search term for it
// (e.g. Remix Icon ships "group"/"team", not "user-group"). This lets a
// search for the common term still surface those icons.
export const SEARCH_ALIASES: Record<string, string[]> = {
  "user group": ["group", "team"],
  "user groups": ["group", "team"],
};

function normalizeQuery(q: string): string {
  return q.trim().toLowerCase().replace(/[-_]+/g, " ").replace(/\s+/g, " ");
}

/** True if `text` matches `query`, either directly or via a known alias. */
export function matchesQuery(text: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (text.includes(q)) return true;
  const aliasTargets = SEARCH_ALIASES[normalizeQuery(q)];
  return aliasTargets?.some((t) => text.includes(t)) ?? false;
}
