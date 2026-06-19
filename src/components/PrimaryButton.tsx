import Link from "next/link";
import type { ReactNode } from "react";

/**
 * The site's primary CTA — a dark gradient pill with layered shadows and a
 * slowly-rotating rainbow conic-gradient glow. Styles live in globals.css
 * (.oi-btn-primary). Renders as a Next Link, an external anchor, or a button.
 */
export default function PrimaryButton({
  href,
  external,
  children,
  className = "",
  ariaLabel,
}: {
  href?: string;
  external?: boolean;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
}) {
  const inner = (
    <>
      <span className="oi-btn-glow" aria-hidden />
      <span className="oi-btn-label">{children}</span>
    </>
  );
  const cls = `oi-btn-primary ${className}`.trim();

  if (href && external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={cls} aria-label={ariaLabel}>
        {inner}
      </a>
    );
  }
  if (href) {
    return (
      <Link href={href} className={cls} aria-label={ariaLabel}>
        {inner}
      </Link>
    );
  }
  return (
    <button className={cls} aria-label={ariaLabel}>
      {inner}
    </button>
  );
}

/** Figma wordmark glyph (monochrome, inherits color). */
export function FigmaGlyph({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 38 57" width="13" height="19" className={className} aria-hidden fill="currentColor">
      <path d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0Z" />
      <path d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 1 1-19 0Z" />
      <path d="M19 0v19h9.5a9.5 9.5 0 1 0 0-19H19Z" />
      <path d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5Z" />
      <path d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5Z" />
    </svg>
  );
}
