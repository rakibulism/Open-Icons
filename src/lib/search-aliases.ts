// Some packs name a concept differently than the common search term for it
// (e.g. Remix Icon ships "group"/"team", not "user-group"). This lets a
// search for the common term still surface those icons — and, since search
// runs on every keystroke, it has to match while the phrase is still being
// typed ("user gr…"), not only once it's typed in full.
const SEARCH_ALIASES: [phrase: string, targets: string[]][] = [
  ["user group", ["group", "team"]],
  ["user groups", ["group", "team"]],
];

function normalizeQuery(q: string): string {
  return q.trim().toLowerCase().replace(/[-_]+/g, " ").replace(/\s+/g, " ");
}

/** True if `text` matches `query`, either directly or via a known alias. */
export function matchesQuery(text: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (text.includes(q)) return true;

  const normalized = normalizeQuery(q);
  const squashed = normalized.replace(/\s+/g, "");
  for (const [phrase, targets] of SEARCH_ALIASES) {
    const firstWordLen = phrase.indexOf(" ");
    // Require the first word to be fully typed before the alias kicks in,
    // so a short prefix like "u" doesn't pull in unrelated group/team icons.
    if (normalized.length < firstWordLen) continue;
    const matches =
      phrase.startsWith(normalized) || phrase.replace(/\s+/g, "").startsWith(squashed);
    if (matches) return targets.some((t) => text.includes(t));
  }
  return false;
}
