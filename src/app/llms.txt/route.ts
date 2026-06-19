import { getIndex } from "@/lib/data";
import { SITE_URL } from "@/lib/site";
import { SITE_DESCRIPTION, FAQS } from "@/lib/structured-data";

export const revalidate = 86400;

/**
 * /llms.txt — the emerging convention (llmstxt.org) for handing LLMs / answer
 * engines a clean, link-rich summary of the site. Generated from the live
 * catalog so pack names and counts stay accurate.
 */
export async function GET() {
  const { sets, total } = await getIndex();

  const packs = sets
    .slice()
    .sort((a, b) => b.count - a.count)
    .map((s) => `- [${s.name}](${SITE_URL}/${s.id}): ${s.count.toLocaleString()} icons, ${s.license.name} licensed`)
    .join("\n");

  const faqs = FAQS.map((f) => `### ${f.q}\n${f.a}`).join("\n\n");

  const body = `# Open Icons

> ${SITE_DESCRIPTION}

Open Icons is a free, open-source website at ${SITE_URL}. It aggregates ${total.toLocaleString()} SVG icons from ${sets.length} open-source icon packs and lets you search across all of them, copy any icon as SVG, download it, grab a jsDelivr CDN link, or insert it in Figma via the Open Icons plugin. No icons are stored — each is served live from its source pack's latest release via jsDelivr.

## Key pages
- [Home](${SITE_URL}/): browse all ${sets.length} icon packs.
- [Search](${SITE_URL}/search): search ${total.toLocaleString()} icons across every pack at once.
- [Docs](${SITE_URL}/docs): how it works, CDN usage, the Figma plugin, and licensing.
- [Updates](${SITE_URL}/updates): changelog of new packs and features.

## Icon packs
${packs}

## FAQ
${faqs}

## Project
- Created by @rakibulism — https://x.com/rakibulism
- Source: https://github.com/rakibulism/Open-Icons
- License: each icon keeps its original pack's license (mostly MIT or Apache-2.0).
`;

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
