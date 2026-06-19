import Link from "next/link";
import { getIndex } from "@/lib/data";
import Hero from "@/components/Hero";

export const revalidate = 86400; // re-check upstream once a day

export default async function Home() {
  const { sets, total } = await getIndex();

  return (
    <div className="mx-auto max-w-6xl px-5">
      <Hero total={total} sets={sets.length} />

      {/* Set grid */}
      <section className="pb-24">
        <h2 className="mb-5 font-sans text-sm font-medium uppercase tracking-wider text-muted">
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
