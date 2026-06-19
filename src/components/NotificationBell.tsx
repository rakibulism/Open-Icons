"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { UPDATES, LATEST_UPDATE } from "@/lib/updates";

const SEEN_KEY = "oi-updates-seen";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      setUnread(localStorage.getItem(SEEN_KEY) !== LATEST_UPDATE);
    } catch {
      setUnread(true);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      try {
        localStorage.setItem(SEEN_KEY, LATEST_UPDATE);
      } catch {}
      setUnread(false);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        aria-label="What's new"
        className="relative grid h-9 w-9 place-items-center rounded-lg text-muted transition-colors hover:text-foreground"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unread && (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-background" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border bg-surface shadow-lg">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <span className="text-sm font-semibold">What&apos;s new</span>
            <Link href="/updates" onClick={() => setOpen(false)} className="text-xs text-muted hover:text-foreground">
              See all →
            </Link>
          </div>
          <ul className="max-h-80 divide-y overflow-y-auto">
            {UPDATES.slice(0, 4).map((u, i) => (
              <li key={i} className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {u.tag && (
                    <span className="rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted">
                      {u.tag}
                    </span>
                  )}
                  <span className="text-sm font-medium">{u.title}</span>
                </div>
                <p className="mt-1 text-xs text-muted">{u.summary}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
