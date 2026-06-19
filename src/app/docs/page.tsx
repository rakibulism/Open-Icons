import type { Metadata } from "next";
import Link from "next/link";
import PrimaryButton, { FigmaGlyph } from "@/components/PrimaryButton";
import { FIGMA_PLUGIN_URL } from "@/lib/site";
import { getIndex } from "@/lib/data";

export const metadata: Metadata = {
  title: "Docs",
  description:
    "How Open Icons works — browsing and copying icons, the live jsDelivr CDN sourcing, the Figma plugin, and licensing.",
  alternates: { canonical: "/docs" },
};

export default async function DocsPage() {
  const { total, sets } = await getIndex();

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:py-14">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Documentation</h1>
      <p className="mt-3 text-lg text-muted">
        Everything you need to use Open Icons — on the web and in Figma.
      </p>

      <Section title="What is Open Icons?">
        <p>
          Open Icons is a single place to browse and search{" "}
          <strong>{total.toLocaleString()} icons</strong> across {sets.length} of the best
          open-source packs. Nothing is stored here — every SVG is fetched live from its source
          pack through the <a className="lnk" href="https://www.jsdelivr.com" target="_blank" rel="noreferrer">jsDelivr</a> CDN,
          so the library stays in sync with each pack&apos;s latest release.
        </p>
      </Section>

      <Section title="Browsing & copying">
        <ul className="list">
          <li>Open a pack from the <Link className="lnk" href="/">home grid</Link>, or <Link className="lnk" href="/search">search across every pack</Link> at once (press <kbd className="kbd">/</kbd>).</li>
          <li>Switch variants (outline / solid / weights) where a pack offers them.</li>
          <li>Click any icon to copy its SVG, download it, copy the name, or copy a CDN URL.</li>
        </ul>
      </Section>

      <Section title="Using an icon via CDN">
        <p>Every icon is reachable directly from jsDelivr — no install needed:</p>
        <pre className="code">{`<img
  src="https://cdn.jsdelivr.net/gh/lucide-icons/lucide@latest/icons/house.svg"
  width="24" height="24" alt="house" />`}</pre>
        <p className="text-sm text-muted">
          The exact URL for any icon is shown in its detail view (&ldquo;Copy CDN URL&rdquo;).
        </p>
      </Section>

      <Section title="Figma plugin">
        <p>
          The Open Icons Figma plugin lets you search and insert any icon as an editable vector,
          pick a size, swap an icon&apos;s pack in place, and identify a selected icon by name or
          shape — without leaving Figma.
        </p>
        <div className="mt-4">
          <PrimaryButton href={FIGMA_PLUGIN_URL} external>
            <FigmaGlyph /> Install the Figma plugin
          </PrimaryButton>
        </div>
      </Section>

      <Section title="Licensing">
        <p>
          Each pack keeps its own license (MIT, Apache-2.0, ISC, …). Open Icons doesn&apos;t
          relicense anything — check the source link on a pack&apos;s page before shipping.
        </p>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10 border-t pt-8">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <div className="prose-docs mt-3 space-y-3 text-[15px] leading-relaxed text-foreground/90">
        {children}
      </div>
    </section>
  );
}
