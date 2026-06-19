import type { Metadata, Viewport } from "next";
import { Libertinus_Serif, Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { SITE_URL, CREATOR_X, CREATOR_HANDLE } from "@/lib/site";
import SearchHotkey from "@/components/SearchHotkey";
import SiteHeader from "@/components/SiteHeader";
import ServiceWorker from "@/components/ServiceWorker";
import "./globals.css";

// Libertinus Serif → titles/headings only. Geist → body + UI. Geist Mono → code.
const libertinus = Libertinus_Serif({
  variable: "--font-libertinus",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
});
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const SITE = SITE_URL;

const OG_DESC =
  "Search and copy 17,000+ free, open-source SVG icons across 14 packs — Lucide, Phosphor, Tabler, Material and more. Live from source, nothing stored.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  applicationName: "Open Icons",
  title: {
    default: "Open Icons — Browse & search open-source icon packs",
    template: "%s · Open Icons",
  },
  description:
    "Search thousands of free, open-source SVG icons across Lucide, Phosphor, Tabler, Material, Heroicons, Bootstrap, Remix and more — copy, download, or grab the CDN link instantly.",
  keywords: [
    "icons", "svg icons", "open source icons", "icon library", "icon search",
    "iconography", "lucide", "phosphor", "tabler icons", "material symbols",
    "heroicons", "feather icons", "bootstrap icons", "figma icons", "free icons",
  ],
  authors: [{ name: "rakibulism", url: CREATOR_X }],
  creator: "rakibulism",
  publisher: "Open Icons",
  alternates: { canonical: "/" },
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Open Icons" },
  icons: {
    icon: "/icon.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    siteName: "Open Icons",
    title: "Open Icons — Every open-source icon, in one place",
    description: OG_DESC,
    url: SITE,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Open Icons — open-source icon library" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Open Icons — Every open-source icon, in one place",
    description: OG_DESC,
    creator: "@rakibulism",
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fcfcf7" },
    { media: "(prefers-color-scheme: dark)", color: "#14180f" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${libertinus.variable} ${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
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
        <ServiceWorker />
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
