"use client";

import { useEffect, useState } from "react";
import { cdnUrl } from "@/lib/sources";
import IconImage from "./IconImage";

/** Minimal per-set metadata needed to build CDN URLs and render an icon. */
export type SetMeta = {
  name: string;
  version: string;
  type: "gh" | "npm";
  pkg: string;
  mono: boolean;
};

/** One icon: a name plus a variant -> path map. */
export type IconHit = { n: string; v: Record<string, string>; c?: string };

export default function IconDetail({
  setMeta,
  icon,
  initialVariant,
  onClose,
}: {
  setMeta: SetMeta;
  icon: IconHit;
  initialVariant?: string;
  onClose: () => void;
}) {
  const { type, pkg, version } = setMeta;
  const variantKeys = Object.keys(icon.v);
  const [activeVariant, setActiveVariant] = useState(
    initialVariant && icon.v[initialVariant] ? initialVariant : variantKeys[0],
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
              {setMeta.name} · {setMeta.version}
            </p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-foreground" aria-label="Close">
            ✕
          </button>
        </div>

        <div className="my-6 grid place-items-center rounded-xl border bg-background py-10 text-foreground">
          <IconImage src={url} alt={icon.n} mono={setMeta.mono} className="h-16 w-16" />
        </div>

        {variantKeys.length > 1 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {variantKeys.map((v) => (
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
