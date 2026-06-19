import Link from "next/link";
import type { ReactNode } from "react";

/**
 * The site's primary CTA — a simple solid button in the brand accent color
 * (#ff3d03) with white label. Renders as a Next Link, external anchor, or
 * button.
 */
export default function PrimaryButton({
  href,
  external,
  children,
  className = "",
  ariaLabel,
  size = "md",
}: {
  href?: string;
  external?: boolean;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
  size?: "sm" | "md";
}) {
  const sizeCls = size === "sm" ? "px-3.5 py-2 text-[13px]" : "px-5 py-3 text-sm";
  const cls =
    `inline-flex items-center justify-center gap-2 rounded-xl bg-accent font-medium text-accent-foreground transition-opacity hover:opacity-90 ${sizeCls} ${className}`.trim();

  if (href && external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={cls} aria-label={ariaLabel}>
        {children}
      </a>
    );
  }
  if (href) {
    return (
      <Link href={href} className={cls} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }
  return (
    <button className={cls} aria-label={ariaLabel}>
      {children}
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
