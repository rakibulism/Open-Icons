import Link from "next/link";
import { getIndex, getSet } from "@/lib/data";
import { cdnUrl } from "@/lib/sources";
import IconImage from "@/components/IconImage";
import Hero from "@/components/Hero";
import type { SetManifest } from "@/lib/types";

export const revalidate = 86400; // re-check upstream once a day

/** Pick a deterministic spread of sample icons across a set for the card preview. */
function previewSrcs(m: SetManifest, n = 5): string[] {
  const out: string[] = [];
  const total = m.icons.length;
  if (!total) return out;
  for (let i = 0; i < n; i++) {
    const idx = Math.min(total - 1, Math.floor(((i + 0.5) / n) * total));
    const ic = m.icons[idx];
    if (!ic) continue;
    const path = ic.v[m.defaultVariant] ?? Object.values(ic.v)[0];
    if (path) out.push(cdnUrl(m, m.version, path));
  }
  return out;
}

// Fanned arc — rotation + vertical offset per tile (outer tiles lower, center raised).
const FAN = [
  { rot: -13, y: 10, z: 8 },
  { rot: -6, y: 2, z: 9 },
  { rot: 0, y: -7, z: 10 },
  { rot: 6, y: 2, z: 9 },
  { rot: 13, y: 10, z: 8 },
];

export default async function Home() {
  const { sets, total } = await getIndex();
  const manifests = await Promise.all(sets.map((s) => getSet(s.id)));

  return (
    <>
      <Hero total={total} sets={sets.length} />

      {/* Set grid */}
      <section className="mx-auto max-w-6xl px-5 pb-24">
        <h2 className="mb-5 font-sans text-sm font-medium uppercase tracking-wider text-muted">
          Icon packs
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sets.map((set, i) => {
            const srcs = manifests[i] ? previewSrcs(manifests[i]!) : [];
            return (
              <Link
                key={set.id}
                href={`/${set.id}`}
                className="group flex flex-col overflow-hidden rounded-2xl border bg-surface transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-foreground/10"
              >
                {/* Visual top panel — fanned sample icons on white tiles */}
                <div className="relative flex h-32 items-end justify-center overflow-hidden bg-gradient-to-br from-accent/[0.18] via-accent/[0.04] to-accent/[0.14] pb-6">
                  {srcs.map((src, j) => {
                    const f = FAN[j] ?? FAN[2];
                    return (
                      <span
                        key={j}
                        className="-mx-2 grid h-[52px] w-[52px] place-items-center rounded-2xl bg-white text-[#1a2018] shadow-md ring-1 ring-black/[0.06] transition-all duration-300 group-hover:-translate-y-1"
                        style={{ transform: `rotate(${f.rot}deg) translateY(${f.y}px)`, zIndex: f.z }}
                      >
                        <IconImage src={src} alt="" mono={set.mono} className="h-7 w-7" />
                      </span>
                    );
                  })}
                </div>

                {/* Body */}
                <div className="flex flex-1 flex-col border-t p-5">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-semibold tracking-tight">{set.name}</h3>
                    <span className="font-mono text-sm text-muted">
                      {set.count.toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm text-muted">
                    {set.count.toLocaleString()} icons · {set.license.name} licensed
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {set.variants.slice(0, 4).map((v) => (
                      <span
                        key={v}
                        className="rounded-md bg-accent/10 px-1.5 py-0.5 text-[11px] font-medium text-accent"
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}
