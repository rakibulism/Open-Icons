import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { SITE_URL, CREATOR_X, CREATOR_HANDLE } from "@/lib/site";
import SearchHotkey from "@/components/SearchHotkey";
import SiteHeader from "@/components/SiteHeader";
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
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/* Set the theme before paint to avoid a flash of the wrong colors. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('oi-theme')||'device';var d=t==='dark'||(t==='device'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light';}catch(e){}})();",
          }}
        />
      </head>
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
        <SiteHeader />

        <SearchHotkey />
        <main className="flex-1">{children}</main>

        <footer className="border-t">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-8 text-sm text-muted">
            <p>
              Open Icons aggregates open-source icon sets. No icons are stored — each
              SVG is served live from its source via jsDelivr.
            </p>
            <p>All icons remain under their original licenses. Check each set for details.</p>
            <p className="pt-2">
              <Link href="/docs" className="hover:text-foreground">Docs</Link>
              <span className="mx-2">·</span>
              <Link href="/updates" className="hover:text-foreground">Updates</Link>
              <span className="mx-2">·</span>
              <a href={CREATOR_X} target="_blank" rel="noreferrer" className="hover:text-foreground">
                {CREATOR_HANDLE}
              </a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
