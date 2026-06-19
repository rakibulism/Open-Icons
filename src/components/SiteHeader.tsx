"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import NotificationBell from "./NotificationBell";
import ThemeMenu from "./ThemeMenu";
import PrimaryButton, { FigmaGlyph } from "./PrimaryButton";
import { FIGMA_PLUGIN_URL, SITE_URL, CREATOR_X, CREATOR_HANDLE } from "@/lib/site";

const NAV = [
  { href: "/", label: "Browse" },
  { href: "/search", label: "Search" },
  { href: "/docs", label: "Docs" },
  { href: "/updates", label: "Updates" },
];

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false); // mobile sheet
  const [aboutOpen, setAboutOpen] = useState(false);
  const aboutRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aboutOpen) return;
    const onClick = (e: MouseEvent) => {
      if (aboutRef.current && !aboutRef.current.contains(e.target as Node)) setAboutOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [aboutOpen]);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight" onClick={() => setMenuOpen(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Open Icons" width={26} height={26} className="h-[26px] w-[26px] rounded-md" />
          Open Icons
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-5 text-sm text-muted md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="transition-colors hover:text-foreground">
              {n.label}
            </Link>
          ))}
          <a href="https://github.com/rakibulism/Open-Icons" target="_blank" rel="noreferrer" className="transition-colors hover:text-foreground">
            GitHub
          </a>
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-1.5 md:flex">
          <ThemeMenu />
          <NotificationBell />
          <div className="relative" ref={aboutRef}>
            <button
              onClick={() => setAboutOpen((s) => !s)}
              aria-label="About"
              className="grid h-9 w-9 place-items-center rounded-lg text-muted transition-colors hover:text-foreground"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" />
              </svg>
            </button>
            {aboutOpen && <AboutCard />}
          </div>
          <PrimaryButton href={FIGMA_PLUGIN_URL} external size="sm" className="ml-1">
            <FigmaGlyph /> Install plugin
          </PrimaryButton>
        </div>

        {/* Mobile actions */}
        <div className="flex items-center gap-1 md:hidden">
          <ThemeMenu />
          <NotificationBell />
          <button
            onClick={() => setMenuOpen((s) => !s)}
            aria-label="Menu"
            aria-expanded={menuOpen}
            className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:text-foreground"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              {menuOpen ? <path d="M6 6l12 12M18 6 6 18" /> : <><path d="M3 6h18" /><path d="M3 12h18" /><path d="M3 18h18" /></>}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile sheet */}
      {menuOpen && (
        <div className="border-t bg-background md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col px-5 py-2">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setMenuOpen(false)}
                className="border-b py-3 text-base text-foreground last:border-0"
              >
                {n.label}
              </Link>
            ))}
            <a href="https://github.com/rakibulism/Open-Icons" target="_blank" rel="noreferrer" className="border-b py-3 text-base text-foreground">
              GitHub
            </a>
            <div className="py-3">
              <PrimaryButton href={FIGMA_PLUGIN_URL} external className="w-full">
                <FigmaGlyph /> Install Figma plugin
              </PrimaryButton>
            </div>
            <p className="pb-3 text-xs text-muted">
              Open Icons · {SITE_URL.replace("https://", "")} ·{" "}
              <a href={CREATOR_X} target="_blank" rel="noreferrer" className="underline">
                {CREATOR_HANDLE}
              </a>
            </p>
          </nav>
        </div>
      )}
    </header>
  );
}

function AboutCard() {
  return (
    <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border bg-surface p-4 shadow-lg">
      <div className="text-sm font-semibold">Open Icons</div>
      <a href={SITE_URL} target="_blank" rel="noreferrer" className="mt-1 block text-xs text-muted hover:text-foreground">
        {SITE_URL.replace("https://", "")} ↗
      </a>
      <a href={CREATOR_X} target="_blank" rel="noreferrer" className="mt-3 block text-xs text-muted hover:text-foreground">
        Made by {CREATOR_HANDLE} on X →
      </a>
    </div>
  );
}
