import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import IconExplorer from "@/components/IconExplorer";
import { getSet, getSetIds } from "@/lib/data";

export const revalidate = 86400;

export async function generateStaticParams() {
  const ids = await getSetIds();
  return ids.map((set) => ({ set }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ set: string }>;
}): Promise<Metadata> {
  const { set: id } = await params;
  const set = await getSet(id);
  if (!set) return {};
  const title = `${set.name} icons — ${set.count.toLocaleString()} free SVGs`;
  const description = `Browse and copy all ${set.count.toLocaleString()} ${set.name} icons (${set.license.name} licensed). Search, switch variants, download SVG or grab a CDN link — free and open source.`;
  return {
    title,
    description,
    alternates: { canonical: `/${id}` },
    openGraph: { title: `${title} · Open Icons`, description, url: `/${id}` },
  };
}

export default async function SetPage({
  params,
}: {
  params: Promise<{ set: string }>;
}) {
  const { set: id } = await params;
  const set = await getSet(id);
  if (!set) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${set.name} icons`,
    description: `${set.count} free ${set.name} SVG icons.`,
    license: set.license.url,
    isPartOf: { "@type": "WebSite", name: "Open Icons" },
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="mb-6 text-sm text-muted">
        <Link href="/" className="hover:text-foreground">Browse</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{set.name}</span>
      </nav>

      <div className="mb-2 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">{set.name}</h1>
        <div className="flex items-center gap-3 text-sm text-muted">
          <a href={set.license.url} target="_blank" rel="noreferrer" className="hover:text-foreground">
            {set.license.name}
          </a>
          <span>·</span>
          <a href={set.repoUrl} target="_blank" rel="noreferrer" className="hover:text-foreground">
            Source
          </a>
          <span>·</span>
          <span className="font-mono">v{set.version}</span>
        </div>
      </div>
      <p className="mb-8 text-muted">
        {set.count.toLocaleString()} icons · served live from{" "}
        <a href={set.homepage} target="_blank" rel="noreferrer" className="underline">
          {set.name}
        </a>{" "}
        via jsDelivr.
      </p>

      <IconExplorer manifest={set} />
    </div>
  );
}
