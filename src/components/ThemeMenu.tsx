"use client";

import { useEffect, useRef, useState } from "react";

type Theme = "light" | "dark" | "device";
const KEY = "oi-theme";

function resolve(theme: Theme): "light" | "dark" {
  if (theme === "device") {
    return typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return theme;
}

function apply(theme: Theme) {
  document.documentElement.dataset.theme = resolve(theme);
}

const OPTIONS: { value: Theme; label: string; icon: React.ReactNode }[] = [
  { value: "light", label: "Light", icon: <SunIcon /> },
  { value: "dark", label: "Dark", icon: <MoonIcon /> },
  { value: "device", label: "Device", icon: <MonitorIcon /> },
];

export default function ThemeMenu() {
  const [theme, setTheme] = useState<Theme>("device");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Initialize from storage, and keep multiple instances (desktop + mobile) in sync.
  useEffect(() => {
    const stored = (localStorage.getItem(KEY) as Theme | null) ?? "device";
    setTheme(stored);
    apply(stored);
    const onSync = (e: Event) => setTheme((e as CustomEvent<Theme>).detail);
    window.addEventListener("oi-theme", onSync);
    return () => window.removeEventListener("oi-theme", onSync);
  }, []);

  // Re-resolve when device theme changes while in "device" mode.
  useEffect(() => {
    if (theme !== "device") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("device");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  // Close on outside click / Escape.
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

  function choose(next: Theme) {
    setTheme(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {}
    apply(next);
    window.dispatchEvent(new CustomEvent("oi-theme", { detail: next }));
    setOpen(false);
  }

  const current = OPTIONS.find((o) => o.value === theme) ?? OPTIONS[2];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((s) => !s)}
        aria-label="Theme"
        title={`Theme: ${current.label}`}
        className="grid h-9 w-9 place-items-center rounded-lg text-muted transition-colors hover:text-foreground"
      >
        {current.icon}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-40 overflow-hidden rounded-xl border bg-surface p-1 shadow-lg">
          {OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => choose(o.value)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors hover:bg-foreground/5 ${
                theme === o.value ? "text-foreground" : "text-muted"
              }`}
            >
              {o.icon}
              <span className="flex-1 text-left">{o.label}</span>
              {theme === o.value && <CheckIcon />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}
function MonitorIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
