import type { Metadata } from "next";
import { UPDATES } from "@/lib/updates";

export const metadata: Metadata = {
  title: "Updates",
  description: "What's new in Open Icons — new packs, features, and the Figma plugin.",
  alternates: { canonical: "/updates" },
};

const TAG_STYLE: Record<string, string> = {
  new: "text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  improved: "text-blue-600 dark:text-blue-400 border-blue-500/30",
  fixed: "text-amber-600 dark:text-amber-400 border-amber-500/30",
};

function fmt(date: string) {
  return new Date(date + "T00:00:00").toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function UpdatesPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:py-14">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Updates</h1>
      <p className="mt-3 text-lg text-muted">What&apos;s new in Open Icons.</p>

      <ol className="mt-10 space-y-8">
        {UPDATES.map((u, i) => (
          <li key={i} className="relative border-l pl-6">
            <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-accent" />
            <time className="text-xs uppercase tracking-wide text-muted">{fmt(u.date)}</time>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold tracking-tight">{u.title}</h2>
              {u.tag && (
                <span className={`rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${TAG_STYLE[u.tag]}`}>
                  {u.tag}
                </span>
              )}
            </div>
            <p className="mt-1.5 text-[15px] leading-relaxed text-foreground/90">{u.summary}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
