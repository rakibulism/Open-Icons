/**
 * JSON-LD builders + FAQ content — the single source for the site's structured
 * data (SEO), answer-engine FAQs (AEO), and the machine-readable graph that
 * generative engines read (GEO). Keep the FAQ copy here so the visible FAQ on
 * the home page and the FAQPage schema never drift.
 */
import { SITE_URL, SITE_NAME, CREATOR_X } from "./site";
import type { SetSummary } from "./types";

export const SITE_DESCRIPTION =
  "Open Icons is a free, open-source icon browser to search and copy 17,000+ SVG icons across 14 of the best icon packs — Lucide, Phosphor, Tabler, Material Symbols, Heroicons, Bootstrap, Remix, Feather, Eva, Pixelart, Flagpack, Iconoir, Flowbite and Doodle — in one place. Every icon is served live from its source via the jsDelivr CDN, and there's a Figma plugin to insert them as editable vectors.";

const GITHUB_URL = "https://github.com/rakibulism/Open-Icons";

/** WebSite + Organization + WebApplication graph for the site root. */
export function siteGraph() {
  const org = {
    "@type": "Organization",
    "@id": `${SITE_URL}/#org`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/brand/logo.png`,
    sameAs: [CREATOR_X, GITHUB_URL],
  };
  const website = {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    inLanguage: "en",
    publisher: { "@id": `${SITE_URL}/#org` },
    // Sitelinks search box → routes a query straight into global search.
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
  const app = {
    "@type": "WebApplication",
    "@id": `${SITE_URL}/#app`,
    name: SITE_NAME,
    url: SITE_URL,
    applicationCategory: "DesignApplication",
    operatingSystem: "Any (web)",
    browserRequirements: "Requires JavaScript",
    description: SITE_DESCRIPTION,
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    publisher: { "@id": `${SITE_URL}/#org` },
  };
  return { "@context": "https://schema.org", "@graph": [org, website, app] };
}

/** Frequently asked questions — rendered on the home page and as FAQPage JSON-LD. */
export const FAQS: { q: string; a: string }[] = [
  {
    q: "What is Open Icons?",
    a: "Open Icons is a free, open-source icon browser that lets you search and copy more than 17,000 SVG icons from 14 popular icon packs in one place. You can copy any icon as SVG, download it, grab a CDN link, or drop it into Figma with the plugin.",
  },
  {
    q: "Is Open Icons free?",
    a: "Yes. Open Icons is completely free and open source. Every icon keeps its original pack's license — most are MIT or Apache-2.0 — so they're free to use, including in commercial projects.",
  },
  {
    q: "Which icon packs are included?",
    a: "14 open-source packs: Lucide, Phosphor, Tabler, Heroicons, Material Symbols, Feather, Bootstrap Icons, Remix Icon, Eva Icons, Pixelart Icons, Flagpack, Iconoir, Flowbite and Doodle Icons — about 17,745 icons in total.",
  },
  {
    q: "Can I use these icons commercially?",
    a: "In almost all cases, yes. The packs are mostly MIT or Apache-2.0 licensed, which permit commercial use. Each pack's page links to its exact license so you can confirm before shipping.",
  },
  {
    q: "How do I download or copy an icon?",
    a: "Search across every pack or open a single pack, click an icon, then copy its SVG markup, download the .svg file, or copy a jsDelivr CDN URL to hotlink it.",
  },
  {
    q: "Are the icons stored on Open Icons?",
    a: "No. Nothing is stored. Every icon is served live from its source pack through the jsDelivr CDN, so the library always reflects each pack's latest release.",
  },
  {
    q: "Does Open Icons have a Figma plugin?",
    a: "Yes. The Open Icons Figma plugin lets you search and insert any icon as an editable vector, switch variants, swap a selection from one pack to another, and identify which pack a selected icon came from.",
  },
];

export function faqLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${SITE_URL}/#faq`,
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

/** CollectionPage + ItemList of every pack — helps engines enumerate the catalog. */
export function collectionLd(sets: SetSummary[], total: number) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${SITE_URL}/#collection`,
    name: "Open-source icon packs",
    description: `${total.toLocaleString()} free SVG icons across ${sets.length} open-source icon packs.`,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: sets.length,
      itemListElement: sets.map((s, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${SITE_URL}/${s.id}`,
        name: `${s.name} — ${s.count.toLocaleString()} icons`,
      })),
    },
  };
}
