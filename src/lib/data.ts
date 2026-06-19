import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { cache } from "react";
import type { SetManifest, SetSummary } from "./types";

const DATA_DIR = join(process.cwd(), "src", "data");

export type IndexFile = {
  syncedAt: string;
  total: number;
  sets: SetSummary[];
};

/** Load the cross-set index (cheap — names/counts only). */
export const getIndex = cache(async (): Promise<IndexFile> => {
  const raw = await readFile(join(DATA_DIR, "index.json"), "utf8");
  return JSON.parse(raw) as IndexFile;
});

/** Load a single set's full manifest, or null if it doesn't exist. */
export const getSet = cache(async (id: string): Promise<SetManifest | null> => {
  try {
    const raw = await readFile(join(DATA_DIR, `${id}.json`), "utf8");
    return JSON.parse(raw) as SetManifest;
  } catch {
    return null;
  }
});

/** All set ids (used for static params / sitemaps). */
export const getSetIds = cache(async (): Promise<string[]> => {
  const index = await getIndex();
  return index.sets.map((s) => s.id);
});
