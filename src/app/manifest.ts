import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Open Icons — Open-Source Icon Library",
    short_name: "Open Icons",
    description:
      "Search and copy 17,000+ free, open-source SVG icons across 14 packs — live from source, nothing stored.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fcfcf7",
    theme_color: "#fcfcf7",
    categories: ["design", "productivity", "utilities"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
