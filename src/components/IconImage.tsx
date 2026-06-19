/**
 * Renders an icon from a CDN URL.
 *
 * - Monochrome packs use the CSS `mask` technique: the SVG's alpha becomes a
 *   mask over a `currentColor` background, so the icon inherits the surrounding
 *   text color and is automatically correct in light/dark themes.
 * - Multicolor packs (flags) render as a plain <img> to preserve their colors.
 */
type Props = {
  src: string;
  alt: string;
  mono: boolean;
  className?: string;
};

export default function IconImage({ src, alt, mono, className = "" }: Props) {
  if (!mono) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} loading="lazy" className={className} />;
  }
  return (
    <span
      role="img"
      aria-label={alt}
      className={className}
      style={{
        display: "inline-block",
        backgroundColor: "currentColor",
        WebkitMaskImage: `url("${src}")`,
        maskImage: `url("${src}")`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
    />
  );
}
