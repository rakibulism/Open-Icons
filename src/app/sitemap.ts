import type { MetadataRoute } from "next";
import { getIndex } from "@/lib/data";
import { SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { sets, syncedAt } = await getIndex();
  const lastModified = new Date(syncedAt);

  return [
    { url: SITE_URL, lastModified, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/search`, lastModified, changeFrequency: "daily", priority: 0.9 },
    ...sets.map((set) => ({
      url: `${SITE_URL}/${set.id}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
