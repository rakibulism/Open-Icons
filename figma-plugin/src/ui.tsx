import { createRoot } from "react-dom/client";
import { useEffect, useMemo, useRef, useState } from "react";
// Shared with the website — single source of truth for CDN URLs + geometry.
import { cdnUrl } from "../../src/lib/sources";
import { fingerprint, similarity } from "../../src/lib/fingerprint";

const DEFAULT_DATA_URL = "https://open-icons.vercel.app";
const MAX_RESULTS = 150;
const MAX_RECENTS = 24;
const SHAPE_THRESHOLD = 0.55;

type SetMeta = {
  name: string;
  version: string;
  type: "gh" | "npm";
  pkg: string;
  mono: boolean;
  defaultVariant: string;
};
type Hit = { n: string; s: string; v: Record<string, string> };
type Index = { total: number; sets: Record<string, SetMeta>; icons: Hit[] };
type IconMeta = { set: string; name: string; variant: string };
type Selection = { name: string; nodeType: string; detected: IconMeta | null } | null;
type Ref = { s: string; n: string };

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
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [index, setIndex] = useState<Index | null>(null);
  const [status, setStatus] = useState("Loading…");
  const [query, setQuery] = useState("");
  const [activeSet, setActiveSet] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [draftUrl, setDraftUrl] = useState("");

  const [selection, setSelection] = useState<Selection>(null);
  const [selectionSvgUrl, setSelectionSvgUrl] = useState<string | null>(null);
  const [selectionSvgText, setSelectionSvgText] = useState<string | null>(null);
  const svgUrlRef = useRef<string | null>(null);

  const [favorites, setFavorites] = useState<Ref[]>([]);
  const [recents, setRecents] = useState<Ref[]>([]);

  const [active, setActive] = useState<{ hit: Hit; variant: string } | null>(null);

  const [fingerprints, setFingerprints] = useState<Record<string, string> | null>(null);
  const [shapeMatches, setShapeMatches] = useState<{ hit: Hit; score: number }[]>([]);
  const fpFetching = useRef(false);

  // ---- Sandbox messages ----
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const msg = e.data?.pluginMessage;
      if (!msg) return;
      if (msg.type === "config") {
        const url = (msg.dataUrl as string | null) ?? DEFAULT_DATA_URL;
        setDataUrl(url);
        setDraftUrl(url);
      } else if (msg.type === "lists") {
        setFavorites((msg.lists?.favorites as Ref[]) ?? []);
        setRecents((msg.lists?.recents as Ref[]) ?? []);
      } else if (msg.type === "selection") {
        setSelection(msg.node as Selection);
        if (svgUrlRef.current) {
          URL.revokeObjectURL(svgUrlRef.current);
          svgUrlRef.current = null;
        }
        if (msg.svg) {
          const bytes = msg.svg as Uint8Array;
          const blob = new Blob([bytes as BlobPart], { type: "image/svg+xml" });
          const u = URL.createObjectURL(blob);
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
    post({ type: "get-config" });
    post({ type: "get-selection" });
    post({ type: "get-lists" });
    const t = setTimeout(() => setDataUrl((cur) => cur ?? DEFAULT_DATA_URL), 600);
    return () => {
      window.removeEventListener("message", handler);
      clearTimeout(t);
    };
  }, []);

  // ---- Load search index ----
  useEffect(() => {
    if (!dataUrl) return;
    let alive = true;
    setIndex(null);
    setStatus("Loading icon index…");
    fetch(`${dataUrl.replace(/\/$/, "")}/data/search.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: Index) => {
        if (!alive) return;
        setIndex(d);
        setStatus("");
      })
      .catch((err) => {
        if (!alive) return;
        setStatus(`Couldn't load icons from ${dataUrl}. Check the URL in settings. (${err.message})`);
      });
    return () => {
      alive = false;
    };
  }, [dataUrl]);

  const { byKey, byNorm } = useMemo(() => {
    const byKey = new Map<string, Hit>();
    const byNorm = new Map<string, Hit[]>();
    if (index) {
      for (const it of index.icons) {
        byKey.set(keyOf(it), it);
        const k = normalize(it.n);
        const arr = byNorm.get(k);
        if (arr) arr.push(it);
        else byNorm.set(k, [it]);
      }
    }
    return { byKey, byNorm };
  }, [index]);

  const favSet = useMemo(() => new Set(favorites.map(keyOf)), [favorites]);

  // ---- Search ----
  const { results, matchCount, capped } = useMemo(() => {
    if (!index) return { results: [] as Hit[], matchCount: 0, capped: false };
    const q = query.trim().toLowerCase();
    if (!q) return { results: [], matchCount: 0, capped: false };
    const out: Hit[] = [];
    let total = 0;
    for (const it of index.icons) {
      if (activeSet && it.s !== activeSet) continue;
      if (it.n.toLowerCase().includes(q)) {
        total++;
        if (out.length < MAX_RESULTS) out.push(it);
      }
    }
    return { results: out, matchCount: total, capped: total > MAX_RESULTS };
  }, [index, query, activeSet]);

  const setList = useMemo(
    () => (index ? Object.entries(index.sets).sort((a, b) => a[1].name.localeCompare(b[1].name)) : []),
    [index],
  );

  const nameGuesses = useMemo(() => {
    if (!index || !selection || selection.detected) return [];
    return byNorm.get(normalize(selection.name)) ?? [];
  }, [index, selection, byNorm]);

  // ---- Shape matching: only when unrecognized by stamp + name ----
  const needShape = !!(
    index && selection && !selection.detected && nameGuesses.length === 0 && selectionSvgText
  );

  useEffect(() => {
    if (!needShape || !dataUrl) return;
    if (fingerprints || fpFetching.current) return;
    fpFetching.current = true;
    fetch(`${dataUrl.replace(/\/$/, "")}/data/fingerprints.json`)
      .then((r) => (r.ok ? r.json() : {}))
      .then((d) => setFingerprints(d as Record<string, string>))
      .catch(() => setFingerprints({}))
      .finally(() => {
        fpFetching.current = false;
      });
  }, [needShape, dataUrl, fingerprints]);

  useEffect(() => {
    if (!needShape || !fingerprints || !index || !selectionSvgText) {
      setShapeMatches([]);
      return;
    }
    const sig = fingerprint(selectionSvgText);
    if (!sig) {
      setShapeMatches([]);
      return;
    }
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

  // ---- Actions ----
  function persist(next: { favorites?: Ref[]; recents?: Ref[] }) {
    post({
      type: "set-lists",
      lists: { favorites: next.favorites ?? favorites, recents: next.recents ?? recents },
    });
  }

  function toggleFav(hit: Hit) {
    const k = keyOf(hit);
    const next = favSet.has(k)
      ? favorites.filter((f) => keyOf(f) !== k)
      : [{ s: hit.s, n: hit.n }, ...favorites];
    setFavorites(next);
    persist({ favorites: next });
  }

  function addRecent(hit: Hit) {
    const k = keyOf(hit);
    const next = [{ s: hit.s, n: hit.n }, ...recents.filter((r) => keyOf(r) !== k)].slice(0, MAX_RECENTS);
    setRecents(next);
    persist({ recents: next });
  }

  async function send(hit: Hit, mode: "insert" | "replace", variant?: string) {
    if (!index) return;
    const sm = index.sets[hit.s];
    const v = variant ?? sm.defaultVariant;
    const meta: IconMeta = { set: hit.s, name: hit.n, variant: v };
    try {
      const svg = await fetch(urlFor(sm, hit, v)).then((r) => r.text());
      post({ type: mode === "replace" ? "replace-svg" : "insert-svg", svg, meta });
      addRecent(hit);
    } catch {
      setStatus("Couldn't fetch that icon — try again.");
    }
  }

  function saveSettings() {
    const url = draftUrl.trim().replace(/\/$/, "");
    if (!url) return;
    post({ type: "set-config", dataUrl: url });
    setSettingsOpen(false);
    setDataUrl(url);
  }

  function refsToHits(refs: Ref[]): Hit[] {
    return refs.map((r) => byKey.get(keyOf(r))).filter((h): h is Hit => !!h);
  }

  const cell = (hit: Hit, onClick: () => void, badge?: string) => {
    const sm = index!.sets[hit.s];
    return (
      <button
        key={keyOf(hit)}
        className="cell"
        title={`${hit.n} · ${sm.name}${badge ? ` · ${badge}` : ""}`}
        onClick={onClick}
      >
        <Icon src={urlFor(sm, hit)} mono={sm.mono} />
        {badge && <span className="badge">{badge}</span>}
      </button>
    );
  };

  const openSheet = (hit: Hit) => setActive({ hit, variant: index!.sets[hit.s].defaultVariant });

  // ---- Selection panel ----
  let panel: React.ReactNode = null;
  if (index && selection) {
    if (selection.detected) {
      const meta = selection.detected;
      const sm = index.sets[meta.set];
      const hit = byKey.get(`${meta.set}:${meta.name}`);
      const others = (byNorm.get(normalize(meta.name)) ?? []).filter((h) => h.s !== meta.set);
      panel = (
        <div className="panel">
          <div className="panel-head">Selected icon — identified</div>
          <div className="ident">
            {sm && hit && (
              <span className="ident-thumb">
                <Icon src={urlFor(sm, hit)} mono={sm.mono} />
              </span>
            )}
            <div>
              <div className="ident-name">{meta.name}</div>
              <div className="ident-sub">{sm ? sm.name : meta.set} · {meta.variant}</div>
            </div>
          </div>
          {others.length > 0 && (
            <>
              <div className="panel-sub">Swap to another pack ({others.length})</div>
              <div className="grid small">{others.map((h) => cell(h, () => send(h, "replace")))}</div>
            </>
          )}
        </div>
      );
    } else if (nameGuesses.length > 0) {
      panel = (
        <div className="panel">
          <div className="panel-head">Selected layer</div>
          <div className="panel-sub">Looks like “{selection.name}” — swap with a library icon</div>
          <div className="grid small">{nameGuesses.map((h) => cell(h, () => send(h, "replace")))}</div>
        </div>
      );
    } else {
      panel = (
        <div className="panel">
          <div className="panel-head">Selected layer</div>
          {shapeMatches.length > 0 ? (
            <>
              <div className="panel-sub">Closest shapes (approximate)</div>
              <div className="grid small">
                {shapeMatches.map(({ hit, score }) =>
                  cell(hit, () => send(hit, "replace"), `${Math.round(score * 100)}%`),
                )}
              </div>
            </>
          ) : (
            <div className="ident">
              {selectionSvgUrl && <img className="ident-thumb" src={selectionSvgUrl} alt="" />}
              <div className="ident-sub">
                {needShape && !fingerprints
                  ? "Analyzing shape…"
                  : `“${selection.name}” isn’t recognized. Insert one below, or rename the layer to an icon name.`}
              </div>
            </div>
          )}
        </div>
      );
    }
  }

  const favHits = refsToHits(favorites);
  const recentHits = refsToHits(recents);

  return (
    <div className="app">
      {panel}

      <div className="topbar">
        <input
          autoFocus
          className="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={index ? `Search ${index.total.toLocaleString()} icons…` : "Loading…"}
        />
        <button className="iconbtn" title="Settings" onClick={() => setSettingsOpen((s) => !s)}>
          ⚙
        </button>
      </div>

      {settingsOpen && (
        <div className="settings">
          <label>Data source URL</label>
          <div className="row">
            <input
              className="search"
              value={draftUrl}
              onChange={(e) => setDraftUrl(e.target.value)}
              placeholder="https://open-icons.vercel.app"
            />
            <button className="primary" onClick={saveSettings}>Save</button>
          </div>
          <p className="hint">Points at any Open Icons deployment serving /data/search.json.</p>
        </div>
      )}

      {index && (
        <div className="chips">
          <button className={`chip ${activeSet === null ? "active" : ""}`} onClick={() => setActiveSet(null)}>
            All
          </button>
          {setList.map(([id, meta]) => (
            <button
              key={id}
              className={`chip ${activeSet === id ? "active" : ""}`}
              onClick={() => setActiveSet(id)}
            >
              {meta.name}
            </button>
          ))}
        </div>
      )}

      {status && <p className="status">{status}</p>}

      {index && query.trim() && (
        <p className="status">
          {matchCount.toLocaleString()} match{matchCount === 1 ? "" : "es"}
          {capped ? ` · showing first ${MAX_RESULTS}` : ""}
        </p>
      )}

      {index && query.trim() && (
        <div className="grid">{results.map((hit) => cell(hit, () => openSheet(hit)))}</div>
      )}
      {index && query.trim() && results.length === 0 && (
        <p className="status">No icons match “{query}”.</p>
      )}

      {index && !query.trim() && (
        <div className="scroll">
          {favHits.length > 0 && (
            <>
              <div className="section">★ Favorites</div>
              <div className="grid">{favHits.map((hit) => cell(hit, () => openSheet(hit)))}</div>
            </>
          )}
          {recentHits.length > 0 && (
            <>
              <div className="section">Recent</div>
              <div className="grid">{recentHits.map((hit) => cell(hit, () => openSheet(hit)))}</div>
            </>
          )}
          {favHits.length === 0 && recentHits.length === 0 && !panel && (
            <p className="empty">Type to search every Open Icons pack, then click to insert.</p>
          )}
        </div>
      )}

      {active && index && (
        <div className="sheet-bg" onClick={() => setActive(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            {(() => {
              const sm = index.sets[active.hit.s];
              const variants = Object.keys(active.hit.v);
              const isFav = favSet.has(keyOf(active.hit));
              return (
                <>
                  <div className="sheet-head">
                    <div className="ident">
                      <span className="ident-thumb">
                        <Icon src={urlFor(sm, active.hit, active.variant)} mono={sm.mono} />
                      </span>
                      <div>
                        <div className="ident-name">{active.hit.n}</div>
                        <div className="ident-sub">{sm.name} · {active.variant}</div>
                      </div>
                    </div>
                    <button
                      className={`heart ${isFav ? "on" : ""}`}
                      title={isFav ? "Unfavorite" : "Favorite"}
                      onClick={() => toggleFav(active.hit)}
                    >
                      {isFav ? "★" : "☆"}
                    </button>
                  </div>
                  {variants.length > 1 && (
                    <div className="chips wrap">
                      {variants.map((v) => (
                        <button
                          key={v}
                          className={`chip ${v === active.variant ? "active" : ""}`}
                          onClick={() => setActive({ hit: active.hit, variant: v })}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="sheet-actions">
                    <button
                      className="primary"
                      onClick={() => {
                        send(active.hit, "insert", active.variant);
                        setActive(null);
                      }}
                    >
                      Insert
                    </button>
                    {selection && (
                      <button
                        className="secondary"
                        onClick={() => {
                          send(active.hit, "replace", active.variant);
                          setActive(null);
                        }}
                      >
                        Replace selection
                      </button>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
