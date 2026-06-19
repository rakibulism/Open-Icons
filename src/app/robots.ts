import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Explicitly welcome both classic search crawlers and AI / answer-engine
// crawlers (GEO/AEO): we *want* to be cited by ChatGPT, Claude, Perplexity,
// Gemini, etc. The catch-all already allows them; the named rules make intent
// unambiguous and survive any future restrictive defaults.
const AI_BOTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot",
  "Applebot-Extended",
  "Bingbot",
  "DuckDuckBot",
  "CCBot",
  "Amazonbot",
  "cohere-ai",
  "YouBot",
  "Meta-ExternalAgent",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      ...AI_BOTS.map((userAgent) => ({ userAgent, allow: "/" })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
