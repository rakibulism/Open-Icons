import Link from "next/link";
import { getIndex } from "@/lib/data";

export const revalidate = 86400; // re-check upstream once a day

export default async function Home() {
  const { sets, total } = await getIndex();

  return (
    <div className="mx-auto max-w-6xl px-5">
      {/* Hero */}
      <section className="py-16 sm:py-24">
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border bg-surface px-3 py-1 text-xs font-medium text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {total.toLocaleString()} icons · live from source · nothing stored
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
          Every open-source icon,
          <br />
          searchable in one place.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted">
          Browse {sets.length} of the best open-source icon packs. Copy the SVG,
          download it, or grab a CDN link — instantly. Always synced with each
          pack&apos;s latest release.
        </p>

        <Link
          href="/search"
          className="mt-8 flex max-w-xl items-center gap-3 rounded-xl border bg-surface px-5 py-4 text-muted transition-colors hover:border-border-strong"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <span className="flex-1 text-base">Search all {total.toLocaleString()} icons…</span>
          <kbd className="rounded border px-1.5 py-0.5 text-xs">/</kbd>
        </Link>
      </section>

      {/* Set grid */}
      <section className="pb-24">
        <h2 className="mb-5 text-sm font-medium uppercase tracking-wider text-muted">
          Icon packs
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sets.map((set) => (
            <Link
              key={set.id}
              href={`/${set.id}`}
              className="group rounded-xl border bg-surface p-5 transition-all hover:border-border-strong hover:shadow-sm"
            >
              <div className="flex items-baseline justify-between">
                <h3 className="font-semibold tracking-tight group-hover:underline">
                  {set.name}
                </h3>
                <span className="font-mono text-sm text-muted">
                  {set.count.toLocaleString()}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {set.variants.slice(0, 4).map((v) => (
                  <span
                    key={v}
                    className="rounded-md border px-1.5 py-0.5 text-[11px] text-muted"
                  >
                    {v}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted">{set.license.name} licensed</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
