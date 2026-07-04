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

const MIN_PREFIX = 2;
const MAX_PREFIX = 7;
const ENOUGH_RESULTS = 8;

/**
 * Filter `items` by `query`, run against `getText(item)`. Exact/alias matches
 * (see `matchesQuery`) always win. This also always supplements them with a
 * one-shorter-prefix fallback — e.g. typing "globe" also surfaces "global",
 * because they share a "glob" prefix — regardless of how many exact matches
 * there already are, so close relatives never get hidden behind a full word.
 * Only cascades to even shorter prefixes (down to 2 characters) when results
 * are still thin, so a short query doesn't end up matching everything.
 */
export function searchMatches<T>(items: T[], query: string, getText: (item: T) => string): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;

  const seen = new Set<T>();
  const out: T[] = [];
  const addAll = (matches: (text: string) => boolean) => {
    for (const it of items) {
      if (seen.has(it)) continue;
      if (matches(getText(it))) {
        seen.add(it);
        out.push(it);
      }
    }
  };

  addAll((text) => matchesQuery(text, q));

  const firstFallbackLen = Math.min(q.length - 1, MAX_PREFIX);
  for (let len = firstFallbackLen; len >= MIN_PREFIX; len--) {
    if (len < firstFallbackLen && out.length >= ENOUGH_RESULTS) break;
    const prefix = q.slice(0, len);
    addAll((text) => text.includes(prefix));
  }

  return out;
}
