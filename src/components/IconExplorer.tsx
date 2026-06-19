"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { cdnUrl } from "@/lib/sources";
import type { ManifestIcon, SetManifest } from "@/lib/types";
import IconImage from "./IconImage";

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
          manifest={manifest}
          icon={selected}
          variant={variant}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function IconDetail({
  manifest,
  icon,
  variant,
  onClose,
}: {
  manifest: SetManifest;
  icon: ManifestIcon;
  variant: string;
  onClose: () => void;
}) {
  const { type, pkg, version } = manifest;
  const [activeVariant, setActiveVariant] = useState(
    icon.v[variant] ? variant : Object.keys(icon.v)[0],
  );
  const [copied, setCopied] = useState<string | null>(null);

  const path = icon.v[activeVariant] ?? Object.values(icon.v)[0];
  const url = cdnUrl({ type, pkg }, version, path);

  const flash = (label: string) => {
    setCopied(label);
    setTimeout(() => setCopied(null), 1400);
  };

  const copySvg = async () => {
    const svg = await fetch(url).then((r) => r.text());
    await navigator.clipboard.writeText(svg);
    flash("svg");
  };
  const copyName = async () => {
    await navigator.clipboard.writeText(icon.n);
    flash("name");
  };
  const copyUrl = async () => {
    await navigator.clipboard.writeText(url);
    flash("url");
  };
  const download = async () => {
    const svg = await fetch(url).then((r) => r.text());
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${icon.n}${activeVariant !== "default" ? `-${activeVariant}` : ""}.svg`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-5"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-2xl border bg-surface p-6 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-mono text-lg font-medium">{icon.n}</h2>
            <p className="text-xs text-muted">
              {manifest.name} · {manifest.version}
            </p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-foreground" aria-label="Close">
            ✕
          </button>
        </div>

        <div className="my-6 grid place-items-center rounded-xl border bg-background py-10 text-foreground">
          <IconImage src={url} alt={icon.n} mono={manifest.mono} className="h-16 w-16" />
        </div>

        {Object.keys(icon.v).length > 1 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {Object.keys(icon.v).map((v) => (
              <button
                key={v}
                onClick={() => setActiveVariant(v)}
                className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
                  v === activeVariant
                    ? "border-border-strong bg-accent text-accent-foreground"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <ActionButton onClick={copySvg} active={copied === "svg"} label="Copy SVG" done="Copied!" />
          <ActionButton onClick={download} label="Download" />
          <ActionButton onClick={copyName} active={copied === "name"} label="Copy name" done="Copied!" />
          <ActionButton onClick={copyUrl} active={copied === "url"} label="Copy CDN URL" done="Copied!" />
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  onClick,
  label,
  done,
  active,
}: {
  onClick: () => void;
  label: string;
  done?: string;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg border bg-background px-3 py-2.5 text-sm font-medium transition-colors hover:border-border-strong"
    >
      {active && done ? done : label}
    </button>
  );
}
