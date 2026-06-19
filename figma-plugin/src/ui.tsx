import { createRoot } from "react-dom/client";
import { useEffect, useMemo, useRef, useState } from "react";
// Shared with the website — single source of truth for CDN URLs + geometry.
import { cdnUrl } from "../../src/lib/sources";
import { fingerprint, similarity } from "../../src/lib/fingerprint";

const DATA_URL = "https://open-icons.vercel.app";
const DEFAULT_LIBRARY = "all";
const MAX_RESULTS = 1000;
const PAGE = 150; // grid render window; grows on scroll
const PREVIEW = 28; // per-library preview icons on the "All" overview
const MAX_RECENTS = 24;
const SHAPE_THRESHOLD = 0.55;

type SetMeta = {
  name: string;
  version: string;
  type: "gh" | "npm";
  pkg: string;
  mono: boolean;
  defaultVariant: string;
  variants: string[];
};
type Hit = { n: string; s: string; v: Record<string, string> };
type Index = { total: number; sets: Record<string, SetMeta>; icons: Hit[] };
type IconMeta = { set: string; name: string; variant: string };
type Detected = { set: string; name: string; variant?: string } | null;
type SelNode = { id: string; name: string; detected: Detected };
type Ref = { s: string; n: string };
type Settings = { naming: boolean; shapeDetect: boolean };

function post(msg: unknown) {
  parent.postMessage({ pluginMessage: msg }, "*");
}
const keyOf = (r: { s: string; n: string }) => `${r.s}:${r.n}`;

function pathForVariant(sm: SetMeta, hit: Hit, variant: string) {
  return hit.v[variant] ?? hit.v[sm.defaultVariant] ?? Object.values(hit.v)[0];
}
function urlFor(sm: SetMeta, hit: Hit, variant?: string) {
  return cdnUrl(
    { type: sm.type, pkg: sm.pkg },
    sm.version,
    pathForVariant(sm, hit, variant ?? sm.defaultVariant),
  );
}
function normalize(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/\.(svg|png|jpg)$/i, "")
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/^-+|-+$/g, "");
}

function Icon({ src, mono }: { src: string; mono: boolean }) {
  if (!mono) return <img className="thumb" src={src} alt="" />;
  return (
    <span
      className="thumb"
      style={{
        backgroundColor: "currentColor",
        WebkitMaskImage: `url("${src}")`,
        maskImage: `url("${src}")`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
    />
  );
}

function App() {
  const [index, setIndex] = useState<Index | null>(null);
  const [status, setStatus] = useState("Loading icon index…");
  const [query, setQuery] = useState("");
  const [library, setLibrary] = useState(DEFAULT_LIBRARY);
  const [variant, setVariant] = useState<string | null>(null);
  const [view, setView] = useState<"library" | "recent" | "favorites">("library");
  const [limit, setLimit] = useState(PAGE);
  const [modeOverride, setModeOverride] = useState<"insert" | "replace" | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<Settings>({ naming: true, shapeDetect: true });

  const [selection, setSelection] = useState<SelNode[]>([]);
  const [selectionSvgText, setSelectionSvgText] = useState<string | null>(null);
  const [selectionSvgUrl, setSelectionSvgUrl] = useState<string | null>(null);
  const svgUrlRef = useRef<string | null>(null);

  const [favorites, setFavorites] = useState<Ref[]>([]);
  const [recents, setRecents] = useState<Ref[]>([]);

  const [fingerprints, setFingerprints] = useState<Record<string, string> | null>(null);
  const [shapeMatches, setShapeMatches] = useState<{ hit: Hit; score: number }[]>([]);
  const fpFetching = useRef(false);

  // ---- Sandbox messages ----
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const msg = e.data?.pluginMessage;
      if (!msg) return;
      if (msg.type === "settings") {
        setSettings(msg.settings as Settings);
      } else if (msg.type === "lists") {
        setFavorites((msg.lists?.favorites as Ref[]) ?? []);
        setRecents((msg.lists?.recents as Ref[]) ?? []);
      } else if (msg.type === "selection") {
        setSelection((msg.nodes as SelNode[]) ?? []);
        if (svgUrlRef.current) {
          URL.revokeObjectURL(svgUrlRef.current);
          svgUrlRef.current = null;
        }
        if (msg.svg) {
          const bytes = msg.svg as Uint8Array;
          const u = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "image/svg+xml" }));
          svgUrlRef.current = u;
          setSelectionSvgUrl(u);
          setSelectionSvgText(new TextDecoder().decode(bytes));
        } else {
          setSelectionSvgUrl(null);
          setSelectionSvgText(null);
        }
      }
    };
    window.addEventListener("message", handler);
    post({ type: "get-settings" });
    post({ type: "get-selection" });
    post({ type: "get-lists" });
    return () => window.removeEventListener("message", handler);
  }, []);

  // ---- Load search index ----
  useEffect(() => {
    let alive = true;
    fetch(`${DATA_URL}/data/search.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: Index) => {
        if (!alive) return;
        setIndex(d);
        setStatus("");
      })
      .catch((err) => alive && setStatus(`Couldn't load icons. (${err.message})`));
    return () => {
      alive = false;
    };
  }, []);

  // Reset the variant when the library changes.
  useEffect(() => {
    if (!index || library === "all") return setVariant(null);
    setVariant(index.sets[library]?.defaultVariant ?? null);
  }, [library, index]);

  // Reset the render window when the grid contents change.
  useEffect(() => setLimit(PAGE), [query, library, view]);

  // Grow the render window as the user scrolls near the bottom (infinite scroll).
  function onScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 600) {
      setLimit((l) => (l < allIcons.length ? l + PAGE : l));
    }
  }

  const { byKey, byNorm } = useMemo(() => {
    const byKey = new Map<string, Hit>();
    const byNorm = new Map<string, Hit[]>();
    if (index) {
      for (const it of index.icons) {
        byKey.set(keyOf(it), it);
        const k = normalize(it.n);
        (byNorm.get(k) ?? byNorm.set(k, []).get(k)!).push(it);
      }
    }
    return { byKey, byNorm };
  }, [index]);

  const favSet = useMemo(() => new Set(favorites.map(keyOf)), [favorites]);
  const setEntries = useMemo(
    () => (index ? Object.entries(index.sets).sort((a, b) => a[1].name.localeCompare(b[1].name)) : []),
    [index],
  );

  // Icons grouped by set, and variants per set, in one pass over the index.
  const { iconsBySet, variantsBySet } = useMemo(() => {
    const iconsBySet: Record<string, Hit[]> = {};
    const variantsBySet: Record<string, string[]> = {};
    if (index) {
      for (const it of index.icons) {
        (iconsBySet[it.s] ?? (iconsBySet[it.s] = [])).push(it);
        const vs = variantsBySet[it.s] ?? (variantsBySet[it.s] = []);
        for (const v of Object.keys(it.v)) if (!vs.includes(v)) vs.push(v);
      }
    }
    return { iconsBySet, variantsBySet };
  }, [index]);
  const variantsOf = (setId: string) => index?.sets[setId]?.variants ?? variantsBySet[setId] ?? [];

  // ---- Mode (auto: replace when selection, insert otherwise; manual override) ----
  const selCount = selection.length;
  const prevHadSel = useRef(false);
  useEffect(() => {
    const has = selCount > 0;
    if (has !== prevHadSel.current) {
      prevHadSel.current = has;
      setModeOverride(null); // selection presence flipped → re-derive
    }
  }, [selCount]);
  const mode: "insert" | "replace" = modeOverride ?? (selCount >= 1 ? "replace" : "insert");

  // ---- Search / home grid ----
  const variantFor = (hit: Hit) =>
    hit.s === library && variant ? variant : index!.sets[hit.s].defaultVariant;

  // Full filtered list for the grid (windowed at render via `limit`).
  const allIcons = useMemo(() => {
    if (!index) return [] as Hit[];
    const q = query.trim().toLowerCase();
    if (q) {
      const out: Hit[] = [];
      for (const it of index.icons) {
        if (library !== "all" && it.s !== library) continue;
        if (it.n.toLowerCase().includes(q)) {
          out.push(it);
          if (out.length >= MAX_RESULTS) break;
        }
      }
      return out;
    }
    if (view === "recent") return refsToHits(recents);
    if (view === "favorites") return refsToHits(favorites);
    if (library === "all") return [];
    return iconsBySet[library] ?? [];

    function refsToHits(refs: Ref[]) {
      return refs.map((r) => byKey.get(keyOf(r))).filter((h): h is Hit => !!h);
    }
  }, [index, query, library, view, recents, favorites, byKey, iconsBySet]);

  // ---- Identified selection ----
  const identified = useMemo(() => {
    if (!index) return [] as { node: SelNode; meta: { set: string; name: string }; hit?: Hit }[];
    return selection
      .filter((n) => n.detected && index.sets[n.detected.set])
      .map((n) => ({
        node: n,
        meta: { set: n.detected!.set, name: n.detected!.name },
        hit: byKey.get(`${n.detected!.set}:${n.detected!.name}`),
      }));
  }, [index, selection, byKey]);

  const nameGuesses = useMemo(() => {
    if (!index || selCount !== 1 || identified.length) return [];
    return byNorm.get(normalize(selection[0].name)) ?? [];
  }, [index, selCount, identified, selection, byNorm]);

  // ---- Shape matching (single, unidentified, no name guess) ----
  const needShape = !!(
    settings.shapeDetect &&
    index &&
    selCount === 1 &&
    identified.length === 0 &&
    nameGuesses.length === 0 &&
    selectionSvgText
  );
  useEffect(() => {
    if (!needShape || fingerprints || fpFetching.current) return;
    fpFetching.current = true;
    fetch(`${DATA_URL}/data/fingerprints.json`)
      .then((r) => (r.ok ? r.json() : {}))
      .then((d) => setFingerprints(d as Record<string, string>))
      .catch(() => setFingerprints({}))
      .finally(() => (fpFetching.current = false));
  }, [needShape, fingerprints]);
  useEffect(() => {
    if (!needShape || !fingerprints || !index || !selectionSvgText) return setShapeMatches([]);
    const sig = fingerprint(selectionSvgText);
    if (!sig) return setShapeMatches([]);
    const scored: { hit: Hit; score: number }[] = [];
    for (const it of index.icons) {
      const fp = fingerprints[keyOf(it)];
      if (!fp) continue;
      const score = similarity(sig, fp);
      if (score >= SHAPE_THRESHOLD) scored.push({ hit: it, score });
    }
    scored.sort((a, b) => b.score - a.score);
    setShapeMatches(scored.slice(0, 12));
  }, [needShape, fingerprints, index, selectionSvgText]);

  // ---- Persistence ----
  function persist(next: { favorites?: Ref[]; recents?: Ref[] }) {
    post({ type: "set-lists", lists: { favorites: next.favorites ?? favorites, recents: next.recents ?? recents } });
  }
  function toggleFav(hit: Hit) {
    const k = keyOf(hit);
    const next = favSet.has(k) ? favorites.filter((f) => keyOf(f) !== k) : [{ s: hit.s, n: hit.n }, ...favorites];
    setFavorites(next);
    persist({ favorites: next });
  }
  function addRecent(hit: Hit) {
    const k = keyOf(hit);
    const next = [{ s: hit.s, n: hit.n }, ...recents.filter((r) => keyOf(r) !== k)].slice(0, MAX_RECENTS);
    setRecents(next);
    persist({ recents: next });
  }
  function updateSettings(patch: Partial<Settings>) {
    const next = { ...settings, ...patch };
    setSettings(next);
    post({ type: "set-settings", settings: next });
  }

  // ---- Actions ----
  async function doInsert(hit: Hit, v: string) {
    try {
      const svg = await fetch(urlFor(index!.sets[hit.s], hit, v)).then((r) => r.text());
      post({ type: "insert-svg", svg, meta: { set: hit.s, name: hit.n, variant: v } });
      addRecent(hit);
    } catch {
      setStatus("Couldn't fetch that icon — try again.");
    }
  }
  async function replaceNodes(entries: { id: string; hit: Hit; v: string }[]) {
    const cache = new Map<string, string>();
    const items: { id: string; svg: string; meta: IconMeta }[] = [];
    for (const e of entries) {
      const url = urlFor(index!.sets[e.hit.s], e.hit, e.v);
      const cached = cache.get(url);
      const svg: string = cached ?? (await fetch(url).then((r) => r.text()));
      if (cached === undefined) cache.set(url, svg);
      items.push({ id: e.id, svg, meta: { set: e.hit.s, name: e.hit.n, variant: e.v } });
    }
    if (items.length) post({ type: "replace-batch", items });
    const seen = new Set<string>();
    for (const e of entries) if (!seen.has(keyOf(e.hit))) (seen.add(keyOf(e.hit)), addRecent(e.hit));
  }

  function onCellClick(hit: Hit) {
    const v = variantFor(hit);
    if (mode === "replace" && selCount >= 1) {
      replaceNodes(selection.map((n) => ({ id: n.id, hit, v })));
    } else {
      doInsert(hit, v);
    }
  }

  // Library swap targets for the batch swap panel.
  const swapTargets = useMemo(() => {
    if (!index || identified.length < 2) return [];
    return setEntries
      .map(([id, meta]) => {
        const matched = identified.filter((d) => byKey.has(`${id}:${normalizeNameTo(id, d.meta.name)}`));
        return { id, name: meta.name, matched: matched.length };
      })
      .filter((t) => t.matched > 0)
      .sort((a, b) => b.matched - a.matched);
    // exact name in target lib (icon names are shared kebab slugs across packs)
    function normalizeNameTo(_lib: string, name: string) {
      return name;
    }
  }, [index, identified, setEntries, byKey]);

  function batchSwap(targetLib: string) {
    const entries = identified
      .map((d) => {
        const hit = byKey.get(`${targetLib}:${d.meta.name}`);
        return hit ? { id: d.node.id, hit, v: index!.sets[targetLib].defaultVariant } : null;
      })
      .filter((e): e is { id: string; hit: Hit; v: string } => !!e);
    if (entries.length) replaceNodes(entries);
  }

  // ---- Resize handle ----
  function onResizeStart(e: React.PointerEvent) {
    e.preventDefault();
    (e.target as Element).setPointerCapture(e.pointerId);
    const startX = e.clientX, startY = e.clientY;
    const startW = window.innerWidth, startH = window.innerHeight;
    const move = (ev: PointerEvent) => {
      post({ type: "resize", width: startW + (ev.clientX - startX), height: startH + (ev.clientY - startY) });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  if (!index) return <div className="app"><p className="status">{status}</p></div>;

  const cur = library === "all" ? null : index.sets[library];

  return (
    <div className="app">
      {/* Selection bar */}
      {selCount > 0 && <SelectionBar />}

      {/* Header */}
      <div className="topbar">
        <input
          autoFocus
          className="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            library === "all" ? `Search ${index.total.toLocaleString()} icons…` : `Search ${cur?.name}…`
          }
        />
        <button className="iconbtn" title="Settings" onClick={() => setSettingsOpen((s) => !s)}>⚙</button>
      </div>

      {settingsOpen && (
        <div className="settings">
          <label className="toggle">
            <input
              type="checkbox"
              checked={settings.naming}
              onChange={(e) => updateSettings({ naming: e.target.checked })}
            />
            Name layers as <code>library/icon</code>
          </label>
          <label className="toggle">
            <input
              type="checkbox"
              checked={settings.shapeDetect}
              onChange={(e) => updateSettings({ shapeDetect: e.target.checked })}
            />
            Identify unknown icons by shape
          </label>
        </div>
      )}

      {/* Controls */}
      <div className="controls">
        <div className="seg">
          <button className={mode === "insert" ? "on" : ""} onClick={() => setModeOverride("insert")}>Insert</button>
          <button className={mode === "replace" ? "on" : ""} onClick={() => setModeOverride("replace")}>Replace</button>
        </div>
        <select className="select" value={library} onChange={(e) => setLibrary(e.target.value)}>
          <option value="all">All libraries</option>
          {setEntries.map(([id, m]) => (
            <option key={id} value={id}>{m.name}</option>
          ))}
        </select>
        {cur && variantsOf(library).length > 1 && (
          <select className="select" value={variant ?? cur.defaultVariant} onChange={(e) => setVariant(e.target.value)}>
            {variantsOf(library).map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        )}
        <div className="seg view">
          <button className={view === "library" ? "on" : ""} onClick={() => setView("library")} title="Library">▦</button>
          <button className={view === "recent" ? "on" : ""} onClick={() => setView("recent")} title="Recent">↺</button>
          <button className={view === "favorites" ? "on" : ""} onClick={() => setView("favorites")} title="Favorites">★</button>
        </div>
      </div>

      {/* Body */}
      <div className="scroll" onScroll={onScroll}>
        {library === "all" && !query.trim() && view === "library" ? (
          // All-libraries overview: each pack as a 2-row preview row.
          <div className="overview">
            {setEntries.map(([id, m]) => (
              <div className="lib" key={id}>
                <div className="lib-head">
                  <div className="lib-meta">
                    <b>{m.name}</b>
                    <span>{(iconsBySet[id]?.length ?? 0).toLocaleString()} icons</span>
                  </div>
                  <button className="chip" onClick={() => setLibrary(id)}>Browse →</button>
                </div>
                <div className="preview">
                  {(iconsBySet[id] ?? []).slice(0, PREVIEW).map((hit) => (
                    <Cell key={keyOf(hit)} hit={hit} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : allIcons.length === 0 ? (
          <p className="empty">
            {query.trim()
              ? `No icons match “${query}”.`
              : view === "favorites"
                ? "No favorites yet — hover an icon and tap ★."
                : view === "recent"
                  ? "No recent icons yet."
                  : "No icons."}
          </p>
        ) : (
          <>
            <div className="grid">
              {allIcons.slice(0, limit).map((hit) => (
                <Cell key={keyOf(hit)} hit={hit} />
              ))}
            </div>
            {limit < allIcons.length && (
              <p className="status">Scroll for more ({(allIcons.length - limit).toLocaleString()} left)</p>
            )}
          </>
        )}
      </div>

      <div className="resize" onPointerDown={onResizeStart} title="Drag to resize" />
    </div>
  );

  function Cell({ hit }: { hit: Hit }) {
    const sm = index!.sets[hit.s];
    const isFav = favSet.has(keyOf(hit));
    return (
      <button
        className="cell"
        title={`${hit.n} · ${sm.name}`}
        onClick={() => onCellClick(hit)}
      >
        <Icon src={urlFor(sm, hit, variantFor(hit))} mono={sm.mono} />
        <span
          className={`star ${isFav ? "on" : ""}`}
          title={isFav ? "Unfavorite" : "Favorite"}
          onClick={(e) => {
            e.stopPropagation();
            toggleFav(hit);
          }}
        >
          {isFav ? "★" : "☆"}
        </span>
      </button>
    );
  }

  function SelectionBar() {
    // Multiple identified → batch swap
    if (identified.length >= 2) {
      return (
        <div className="panel">
          <div className="panel-head">{identified.length} icons selected — swap all to</div>
          <div className="chips">
            {swapTargets.map((t) => (
              <button key={t.id} className="chip" onClick={() => batchSwap(t.id)}>
                {index!.sets[t.id].name} <span className="count">{t.matched}/{identified.length}</span>
              </button>
            ))}
            {swapTargets.length === 0 && <span className="ident-sub">No other library has these icon names.</span>}
          </div>
        </div>
      );
    }
    if (selCount === 1) {
      // Single identified
      if (identified.length === 1) {
        const { meta, hit } = identified[0];
        const sm = index!.sets[meta.set];
        const others = (byNorm.get(normalize(meta.name)) ?? []).filter((h) => h.s !== meta.set);
        return (
          <div className="panel">
            <div className="panel-head">Selected — identified</div>
            <div className="ident">
              {hit && <span className="ident-thumb"><Icon src={urlFor(sm, hit)} mono={sm.mono} /></span>}
              <div>
                <div className="ident-name">{meta.name}</div>
                <div className="ident-sub">{sm.name}</div>
              </div>
            </div>
            {others.length > 0 && (
              <>
                <div className="panel-sub">Same icon in other libraries</div>
                <div className="grid small">
                  {others.map((h) => (
                    <SwapCell key={keyOf(h)} hit={h} targetId={selection[0].id} />
                  ))}
                </div>
              </>
            )}
          </div>
        );
      }
      // Single unidentified
      if (nameGuesses.length > 0) {
        return (
          <div className="panel">
            <div className="panel-head">Selected layer</div>
            <div className="panel-sub">Looks like “{selection[0].name}” — swap with</div>
            <div className="grid small">
              {nameGuesses.map((h) => <SwapCell key={keyOf(h)} hit={h} targetId={selection[0].id} />)}
            </div>
          </div>
        );
      }
      return (
        <div className="panel">
          <div className="panel-head">Selected layer</div>
          {shapeMatches.length > 0 ? (
            <>
              <div className="panel-sub">Closest shapes (approximate)</div>
              <div className="grid small">
                {shapeMatches.map(({ hit, score }) => (
                  <SwapCell key={keyOf(hit)} hit={hit} targetId={selection[0].id} badge={`${Math.round(score * 100)}%`} />
                ))}
              </div>
            </>
          ) : (
            <div className="ident">
              {selectionSvgUrl && <img className="ident-thumb" src={selectionSvgUrl} alt="" />}
              <div className="ident-sub">
                {needShape && !fingerprints
                  ? "Analyzing shape…"
                  : `“${selection[0].name}” isn’t recognized.`}
              </div>
            </div>
          )}
        </div>
      );
    }
    // Multiple, fewer than 2 identified
    return (
      <div className="panel">
        <div className="panel-head">{selCount} layers selected</div>
        <div className="ident-sub">Select icons inserted from a library to swap them all.</div>
      </div>
    );
  }

  function SwapCell({ hit, targetId, badge }: { hit: Hit; targetId: string; badge?: string }) {
    const sm = index!.sets[hit.s];
    return (
      <button
        className="cell"
        title={`${hit.n} · ${sm.name}${badge ? ` · ${badge}` : ""}`}
        onClick={() => replaceNodes([{ id: targetId, hit, v: sm.defaultVariant }])}
      >
        <Icon src={urlFor(sm, hit)} mono={sm.mono} />
        {badge && <span className="badge">{badge}</span>}
      </button>
    );
  }
}

createRoot(document.getElementById("root")!).render(<App />);
