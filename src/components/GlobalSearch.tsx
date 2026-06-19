"use client";

import { useEffect, useMemo, useState, useDeferredValue } from "react";
import { cdnUrl } from "@/lib/sources";
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
    const q = deferredQuery.trim().toLowerCase();
    if (!q) return { results: [], capped: false, matchCount: 0 };
    const out: Hit[] = [];
    let total = 0;
    for (const it of index.icons) {
      if (activeSet && it.s !== activeSet) continue;
      if (it.n.toLowerCase().includes(q)) {
        total++;
        if (out.length < MAX_RESULTS) out.push(it);
      }
    }
    return { results: out, capped: total > MAX_RESULTS, matchCount: total };
  }, [index, deferredQuery, activeSet]);

  const setList = useMemo(
    () => (index ? Object.entries(index.sets).sort((a, b) => a[1].name.localeCompare(b[1].name)) : []),
    [index],
  );

  const thumbUrl = (hit: Hit) => {
    const sm = index!.sets[hit.s];
    const path = hit.v[sm.defaultVariant] ?? Object.values(hit.v)[0];
    return cdnUrl({ type: sm.type, pkg: sm.pkg }, sm.version, path);
  };

  return (
    <div>
      {/* Search bar */}
      <div className="relative">
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            index
              ? `Search ${index.total.toLocaleString()} icons across all packs…`
              : "Loading icons…"
          }
          className="w-full rounded-xl border bg-surface px-5 py-4 text-base outline-none transition-colors focus:border-border-strong"
        />
      </div>

      {/* Set filter */}
      {index && (
        <div className="mt-3 flex flex-wrap gap-1.5">
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

      {/* Status line */}
      <p className="mt-4 text-xs text-muted">
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

      {/* Results */}
      {index && deferredQuery.trim() && (
        results.length === 0 ? (
          <p className="py-20 text-center text-muted">No icons match “{deferredQuery}”.</p>
        ) : (
          <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9">
            {results.map((hit) => (
              <button
                key={`${hit.s}:${hit.n}`}
                onClick={() => setSelected(hit)}
                title={`${hit.n} · ${index.sets[hit.s].name}`}
                className="group flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border bg-surface p-2 text-foreground transition-all hover:border-border-strong hover:shadow-sm"
              >
                <IconImage
                  src={thumbUrl(hit)}
                  alt={hit.n}
                  mono={index.sets[hit.s].mono}
                  className="h-7 w-7"
                />
                <span className="line-clamp-1 w-full text-center text-[10px] text-muted group-hover:text-foreground">
                  {hit.n}
                </span>
                <span className="line-clamp-1 w-full text-center text-[9px] text-muted/70">
                  {index.sets[hit.s].name}
                </span>
              </button>
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
        />
      )}
    </div>
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
