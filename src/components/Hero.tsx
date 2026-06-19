"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import PrimaryButton from "./PrimaryButton";

type Audience = "designers" | "developers";

export default function Hero({ total, sets }: { total: number; sets: number }) {
  const [aud, setAud] = useState<Audience>("designers");
  const [query, setQuery] = useState("");
  const router = useRouter();
  const isDesigner = aud === "designers";

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  }

  return (
    <section className="relative isolate overflow-hidden">
      {/* Sunset sky background — fades out toward the bottom, sits low so the
          content stays legible. Scales with the section (bg-cover) at any width. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[url('/brand/hero-bg.jpg')] bg-cover bg-center opacity-35 [mask-image:linear-gradient(to_bottom,black_0%,black_35%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_0%,black_35%,transparent_100%)]"
      />

      <div className="mx-auto flex max-w-3xl flex-col items-center px-5 py-16 text-center sm:py-24">
      {/* Audience toggle */}
      <div className="inline-flex rounded-full border bg-foreground/[0.035] p-1">
        <Toggle active={isDesigner} onClick={() => setAud("designers")}>For designers</Toggle>
        <Toggle active={!isDesigner} onClick={() => setAud("developers")}>For developers</Toggle>
      </div>

      {/* Two-tone serif headline */}
      <h1 className="mt-10 text-4xl font-semibold leading-[1.08] tracking-tight sm:text-6xl">
        Every open-source icon,
        <br />
        <span className="text-muted">searchable in one place.</span>
      </h1>

      {/* Audience-specific subtitle */}
      <p className="mt-6 max-w-xl text-lg text-muted">
        {isDesigner
          ? `Browse ${total.toLocaleString()} icons across ${sets} packs — copy any SVG, or drop them straight into Figma with the plugin.`
          : `Every icon on a live CDN — copy, download, or hotlink the SVG. No installs, no storage, always in sync with each pack.`}
      </p>

      {/* Full-width search — spans the hero text width */}
      <form onSubmit={onSearch} className="mt-9 w-full">
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted">
            <SearchIcon />
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${total.toLocaleString()} icons across all packs…`}
            aria-label="Search all icons"
            className="w-full rounded-2xl border bg-surface py-4 pl-12 pr-28 text-base shadow-sm outline-none transition-colors placeholder:text-muted focus:border-border-strong"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
          >
            Search
          </button>
        </div>
      </form>

      {!isDesigner && (
        <PrimaryButton href="/docs" className="mt-4">
          Read the docs <Arrow />
        </PrimaryButton>
      )}
      </div>
    </section>
  );
}

function Toggle({
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
      className={`rounded-full px-5 py-2 text-sm transition-all ${
        active
          ? "bg-surface font-medium text-foreground shadow-sm"
          : "text-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Arrow() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
