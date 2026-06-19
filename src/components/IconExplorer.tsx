"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { cdnUrl } from "@/lib/sources";
import type { ManifestIcon, SetManifest } from "@/lib/types";
import IconImage from "./IconImage";
import IconDetail from "./IconDetail";

const PAGE = 120;

type Props = { manifest: SetManifest };

export default function IconExplorer({ manifest }: Props) {
  const { type, pkg, version, variants, defaultVariant } = manifest;
  const [query, setQuery] = useState("");
  const [variant, setVariant] = useState(defaultVariant);
  const [limit, setLimit] = useState(PAGE);
  const [selected, setSelected] = useState<ManifestIcon | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return manifest.icons;
    return manifest.icons.filter(
      (i) => i.n.toLowerCase().includes(q) || i.c?.toLowerCase().includes(q),
    );
  }, [query, manifest.icons]);

  // Reset pagination whenever the query changes.
  useEffect(() => setLimit(PAGE), [query]);

  const url = useCallback(
    (icon: ManifestIcon) => {
      const path = icon.v[variant] ?? Object.values(icon.v)[0];
      return cdnUrl({ type, pkg }, version, path);
    },
    [type, pkg, version, variant],
  );

  const visible = filtered.slice(0, limit);

  return (
    <div>
      {/* Controls */}
      <div className="sticky top-14 z-20 -mx-5 mb-6 border-b bg-background/85 px-5 py-3 backdrop-blur-md">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${manifest.count.toLocaleString()} ${manifest.name} icons…`}
              className="w-full rounded-lg border bg-surface px-4 py-2.5 text-sm outline-none transition-colors focus:border-border-strong"
            />
          </div>
          {variants.length > 1 && (
            <div className="flex flex-wrap gap-1">
              {variants.map((v) => (
                <button
                  key={v}
                  onClick={() => setVariant(v)}
                  className={`rounded-md border px-2.5 py-1.5 text-xs transition-colors ${
                    v === variant
                      ? "border-border-strong bg-accent text-accent-foreground"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          )}
        </div>
        <p className="mt-2 text-xs text-muted">
          {filtered.length.toLocaleString()} result{filtered.length === 1 ? "" : "s"}
        </p>
      </div>

      {/* Grid */}
      {visible.length === 0 ? (
        <p className="py-20 text-center text-muted">No icons match “{query}”.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9">
          {visible.map((icon) => (
            <button
              key={icon.n}
              onClick={() => setSelected(icon)}
              title={icon.n}
              className="group flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border bg-surface p-2 text-foreground transition-all hover:border-border-strong hover:shadow-sm"
            >
              <IconImage src={url(icon)} alt={icon.n} mono={manifest.mono} className="h-7 w-7" />
              <span className="line-clamp-1 w-full text-center text-[10px] text-muted group-hover:text-foreground">
                {icon.n}
              </span>
            </button>
          ))}
        </div>
      )}

      {limit < filtered.length && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => setLimit((l) => l + PAGE * 3)}
            className="rounded-lg border bg-surface px-5 py-2.5 text-sm font-medium transition-colors hover:border-border-strong"
          >
            Load more ({(filtered.length - limit).toLocaleString()} left)
          </button>
        </div>
      )}

      {selected && (
        <IconDetail
          setMeta={{
            name: manifest.name,
            version: manifest.version,
            type: manifest.type,
            pkg: manifest.pkg,
            mono: manifest.mono,
          }}
          icon={selected}
          initialVariant={variant}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
