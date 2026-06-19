"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import PrimaryButton from "./PrimaryButton";

type Audience = "designers" | "developers";

export default function Hero({ total, sets }: { total: number; sets: number }) {
  const [aud, setAud] = useState<Audience>("designers");
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const isDesigner = aud === "designers";

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  }

  // Press "/" to focus this search — intercept (capture phase) so the global
  // hotkey doesn't navigate away to /search while we're on the home page.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = document.activeElement;
      const typing =
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        (el as HTMLElement | null)?.isContentEditable;
      if (typing) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, []);

  return (
    <section className="relative isolate overflow-hidden">
      {/* Sunset sky background — a seamless looping video, faded out toward the
          bottom so the content stays legible. object-cover keeps it scalable and
          responsive; the still serves as the poster for instant first paint. */}
      <video
        aria-hidden
        autoPlay
        muted
        loop
        playsInline
        poster="/brand/hero-bg.jpg"
        className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover object-center opacity-35 [mask-image:linear-gradient(to_bottom,black_0%,black_35%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_0%,black_35%,transparent_100%)]"
      >
        <source src="/brand/hero-bg.mp4" type="video/mp4" />
      </video>

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
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${total.toLocaleString()} icons across all packs…`}
            aria-label="Search all icons"
            className="w-full rounded-2xl border bg-surface py-4 pl-12 pr-14 text-base shadow-sm outline-none transition-colors placeholder:text-muted focus:border-border-strong [&::-webkit-search-cancel-button]:appearance-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-muted transition-colors hover:bg-foreground/5 hover:text-foreground"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          ) : (
            <kbd className="pointer-events-none absolute right-4 top-1/2 hidden h-6 min-w-[1.5rem] -translate-y-1/2 items-center justify-center rounded-md border bg-background px-1.5 font-sans text-xs text-muted sm:inline-flex">
              /
            </kbd>
          )}
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
