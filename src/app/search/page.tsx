import type { Metadata } from "next";
import Link from "next/link";
import GlobalSearch from "@/components/GlobalSearch";
import { getIndex } from "@/lib/data";

export const metadata: Metadata = {
  title: "Search all icons",
  description:
    "Search thousands of free, open-source SVG icons across every pack at once — Lucide, Phosphor, Tabler, Material, Heroicons and more.",
  alternates: { canonical: "/search" },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const { total, sets } = await getIndex();

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <nav className="mb-6 text-sm text-muted">
        <Link href="/" className="hover:text-foreground">Browse</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">Search</span>
      </nav>

      <h1 className="mb-1 text-3xl font-semibold tracking-tight">Search all icons</h1>
      <p className="mb-6 text-muted">
        {total.toLocaleString()} icons across {sets.length} packs — searched live, nothing stored.
      </p>

      <GlobalSearch initialQuery={q ?? ""} />
    </div>
  );
}
