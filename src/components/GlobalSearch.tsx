"use client";

import { useEffect, useMemo, useState, useDeferredValue } from "react";
import { cdnUrl } from "@/lib/sources";
import { searchMatches } from "@/lib/search-aliases";
import IconImage from "./IconImage";
import IconDetail, { type SetMeta } from "./IconDetail";

type SetMetaIdx = SetMeta & { defaultVariant: string };
type Hit = { n: string; s: string; v: Record<string, string> };
type Index = { total: number; sets: Record<string, SetMetaIdx>; icons: Hit[] };

const MAX_RESULTS = 300;

export default function GlobalSearch({ initialQuery = "" }: { initialQuery?: string }) {
  const [index, setIndex] = useState<Index | null>(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState(initialQuery);
  const [activeSet, setActiveSet] = useState<string | null>(null);
  const [selected, setSelected] = useState<Hit | null>(null);

  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    let alive = true;
    fetch("/data/search.json")
      .then((r) => r.json())
      .then((d: Index) => alive && setIndex(d))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, []);

  const { results, capped, matchCount } = useMemo(() => {
    if (!index) return { results: [] as Hit[], capped: false, matchCount: 0 };
    const q = deferredQuery.trim();
    if (!q) return { results: [], capped: false, matchCount: 0 };
    const pool = activeSet ? index.icons.filter((it) => it.s === activeSet) : index.icons;
    const matched = searchMatches(pool, q, (it) => it.n.toLowerCase());
    return { results: matched.slice(0, MAX_RESULTS), capped: matched.length > MAX_RESULTS, matchCount: matched.length };
  }, [index, deferredQuery, activeSet]);

  const setList = useMemo(
    () => (index ? Object.entries(index.sets).sort((a, b) => a[1].name.localeCompare(b[1].name)) : []),
    [index],
  );

  // Searching across all packs: group matches by pack instead of one mixed
  // grid, so results read as "Bootstrap: bell", "Doodle Icons: bell-related".
  const groupedResults = useMemo(() => {
    if (!index || activeSet) return [] as { id: string; name: string; hits: Hit[] }[];
    const q = deferredQuery.trim();
    if (!q) return [];
    const matched = searchMatches(index.icons, q, (it) => it.n.toLowerCase()).slice(0, MAX_RESULTS);
    const bySet = new Map<string, Hit[]>();
    for (const it of matched) (bySet.get(it.s) ?? bySet.set(it.s, []).get(it.s)!).push(it);
    return setList.filter(([id]) => bySet.has(id)).map(([id, m]) => ({ id, name: m.name, hits: bySet.get(id)! }));
  }, [index, deferredQuery, activeSet, setList]);

  // Other icons in the same pack sharing the selected icon's core keyword.
  const categoryIcons = useMemo(() => {
    if (!selected || !index) return [];
    const keyword = selected.n.split("-")[0];
    if (!keyword) return [];
    return index.icons
      .filter((it) => it.s === selected.s && it.n !== selected.n && it.n.includes(keyword))
      .slice(0, 21);
  }, [selected, index]);

  return (
    <div>
      <div className="sticky top-14 z-20 -mx-5 mb-6 border-b bg-background/85 px-5 py-4 backdrop-blur-md">
        <div className="flex flex-col gap-3 md:flex-row md:items-start">
          {/* Search bar — first half */}
          <div className="relative md:w-1/2">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                index
                  ? `Search ${index.total.toLocaleString()} icons across all packs…`
                  : "Loading icons…"
              }
              className="w-full rounded-xl border bg-surface px-5 py-4 pr-11 text-base outline-none transition-colors focus:border-border-strong"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded p-1.5 text-muted hover:bg-accent hover:text-foreground"
              >
                ✕
              </button>
            )}
          </div>

          {/* Set filter — second half */}
          {index && (
            <div className="flex flex-wrap content-start gap-1.5 md:w-1/2">
              <Chip active={activeSet === null} onClick={() => setActiveSet(null)}>
                All packs
              </Chip>
              {setList.map(([id, meta]) => (
                <Chip key={id} active={activeSet === id} onClick={() => setActiveSet(id)}>
                  {meta.name}
                </Chip>
              ))}
            </div>
          )}
        </div>

        {/* Status line */}
        <p className="mt-3 text-xs text-muted">
          {error
            ? "Couldn’t load the icon index. Try refreshing."
            : !index
              ? "Loading icon index…"
              : !deferredQuery.trim()
                ? "Type to search every icon across all packs."
                : `${matchCount.toLocaleString()} match${matchCount === 1 ? "" : "es"}${
                    capped ? ` · showing first ${MAX_RESULTS}` : ""
                  }`}
        </p>
      </div>

      {/* Results */}
      {index && deferredQuery.trim() && (
        activeSet === null ? (
          groupedResults.length === 0 ? (
            <p className="py-20 text-center text-muted">No icons match “{deferredQuery}”.</p>
          ) : (
            <div className="mt-4 divide-y">
              {groupedResults.map(({ id, name, hits }) => (
                <div key={id} className="py-4 first:pt-0">
                  <div className="mb-2.5 flex items-baseline justify-between">
                    <div className="flex items-baseline gap-2">
                      <b className="text-sm font-semibold">{name}</b>
                      <span className="text-xs text-muted">
                        {hits.length.toLocaleString()} match{hits.length === 1 ? "" : "es"}
                      </span>
                    </div>
                    <button
                      onClick={() => setActiveSet(id)}
                      className="rounded-md border px-2.5 py-1 text-xs font-medium text-muted transition-colors hover:border-border-strong hover:text-foreground"
                    >
                      See all →
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9">
                    {hits.map((hit) => (
                      <HitCell key={`${hit.s}:${hit.n}`} hit={hit} index={index} onSelect={setSelected} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : results.length === 0 ? (
          <p className="py-20 text-center text-muted">No icons match “{deferredQuery}”.</p>
        ) : (
          <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9">
            {results.map((hit) => (
              <HitCell key={`${hit.s}:${hit.n}`} hit={hit} index={index} onSelect={setSelected} />
            ))}
          </div>
        )
      )}

      {selected && index && (
        <IconDetail
          setMeta={index.sets[selected.s]}
          icon={{ n: selected.n, v: selected.v }}
          initialVariant={index.sets[selected.s].defaultVariant}
          onClose={() => setSelected(null)}
          categoryIcons={categoryIcons}
          onSelectIcon={(h) => setSelected({ n: h.n, s: selected.s, v: h.v })}
        />
      )}
    </div>
  );
}

function HitCell({ hit, index, onSelect }: { hit: Hit; index: Index; onSelect: (hit: Hit) => void }) {
  const sm = index.sets[hit.s];
  const path = hit.v[sm.defaultVariant] ?? Object.values(hit.v)[0];
  const url = cdnUrl({ type: sm.type, pkg: sm.pkg }, sm.version, path);
  return (
    <button
      onClick={() => onSelect(hit)}
      title={`${hit.n} · ${sm.name}`}
      className="group flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border bg-surface p-2 text-foreground transition-all hover:border-border-strong hover:shadow-sm"
    >
      <IconImage src={url} alt={hit.n} mono={sm.mono} className="h-7 w-7" />
      <span className="line-clamp-1 w-full text-center text-[10px] text-muted group-hover:text-foreground">
        {hit.n}
      </span>
      <span className="line-clamp-1 w-full text-center text-[9px] text-muted/70">{sm.name}</span>
    </button>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
        active
          ? "border-border-strong bg-accent text-accent-foreground"
          : "text-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
