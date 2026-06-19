"use client";

import { useState } from "react";
import Link from "next/link";
import PrimaryButton, { FigmaGlyph } from "./PrimaryButton";
import { FIGMA_PLUGIN_URL } from "@/lib/site";

type Audience = "designers" | "developers";

export default function Hero({ total, sets }: { total: number; sets: number }) {
  const [aud, setAud] = useState<Audience>("designers");
  const isDesigner = aud === "designers";

  return (
    <section className="mx-auto flex max-w-3xl flex-col items-center px-5 py-16 text-center sm:py-24">
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

      {/* CTAs */}
      <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
        {isDesigner ? (
          <PrimaryButton href={FIGMA_PLUGIN_URL} external>
            <FigmaGlyph /> Install Figma plugin
          </PrimaryButton>
        ) : (
          <PrimaryButton href="/docs">
            Read the docs <Arrow />
          </PrimaryButton>
        )}
        <Link
          href="/search"
          className="inline-flex items-center gap-2 rounded-xl border bg-surface px-5 py-3 text-sm font-medium transition-colors hover:border-border-strong"
        >
          <SearchIcon /> Search all icons
        </Link>
      </div>

      {/* Brand status pill — soft orange-tinted label on the orange accent */}
      <div className="mt-9 inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-[#ffd9c9]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#ffd9c9]/80" />
        {total.toLocaleString()} icons · {sets} packs · live from source
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
