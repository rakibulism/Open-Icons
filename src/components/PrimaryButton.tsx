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

/** Figma glyph — outline (line) style, inherits color. */
export function FigmaGlyph({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      className={className}
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 12a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
      <path d="M6 6a3 3 0 0 1 3 -3h6a3 3 0 0 1 3 3a3 3 0 0 1 -3 3h-6a3 3 0 0 1 -3 -3" />
      <path d="M9 9a3 3 0 0 0 0 6h3m-3 0a3 3 0 1 0 3 3v-15" />
    </svg>
  );
}
