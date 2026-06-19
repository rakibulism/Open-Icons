import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";
import SearchHotkey from "@/components/SearchHotkey";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const SITE = SITE_URL;

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "Open Icons — Browse & search open-source icon packs",
    template: "%s · Open Icons",
  },
  description:
    "Search thousands of free, open-source SVG icons across Lucide, Phosphor, Tabler, Material, Heroicons, Bootstrap, Remix and more — copy, download, or grab the CDN link instantly.",
  keywords: [
    "icons", "svg icons", "open source icons", "icon search", "lucide",
    "phosphor", "tabler icons", "material icons", "heroicons", "free icons",
  ],
  openGraph: {
    type: "website",
    siteName: "Open Icons",
    title: "Open Icons — Browse & search open-source icon packs",
    description: "Search thousands of free, open-source SVG icons in one place.",
    url: SITE,
  },
  twitter: {
    card: "summary_large_image",
    title: "Open Icons",
    description: "Search thousands of free, open-source SVG icons in one place.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "Open Icons",
              url: SITE,
              description:
                "Browse and search thousands of free, open-source SVG icons across the best icon packs.",
              potentialAction: {
                "@type": "SearchAction",
                target: `${SITE}/{set}`,
                "query-input": "required name=set",
              },
            }),
          }}
        />
        <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
            <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-accent text-accent-foreground text-xs font-bold">
                OI
              </span>
              Open Icons
            </Link>
            <nav className="flex items-center gap-5 text-sm text-muted">
              <Link href="/" className="hover:text-foreground transition-colors">Browse</Link>
              <Link href="/search" className="hover:text-foreground transition-colors">Search</Link>
              <a
                href="https://github.com/rakibulism/Open-Icons"
                target="_blank"
                rel="noreferrer"
                className="hover:text-foreground transition-colors"
              >
                GitHub
              </a>
            </nav>
          </div>
        </header>

        <SearchHotkey />
        <main className="flex-1">{children}</main>

        <footer className="border-t">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-5 py-8 text-sm text-muted">
            <p>
              Open Icons aggregates open-source icon sets. No icons are stored — each
              SVG is served live from its source via jsDelivr.
            </p>
            <p>All icons remain under their original licenses. Check each set for details.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
