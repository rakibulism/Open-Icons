import { createRoot } from "react-dom/client";
import { useEffect, useMemo, useRef, useState } from "react";
// Shared with the website — the single source of truth for CDN URL building.
import { cdnUrl } from "../../src/lib/sources";

const DEFAULT_DATA_URL = "https://open-icons.vercel.app";
const MAX_RESULTS = 150;

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

function post(msg: unknown) {
  parent.postMessage({ pluginMessage: msg }, "*");
}

function pathFor(sm: SetMeta, hit: Hit) {
  return hit.v[sm.defaultVariant] ?? Object.values(hit.v)[0];
}
function urlFor(sm: SetMeta, hit: Hit) {
  return cdnUrl({ type: sm.type, pkg: sm.pkg }, sm.version, pathFor(sm, hit));
}

/** Normalize a layer name / icon name for fuzzy library matching. */
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
  const svgUrlRef = useRef<string | null>(null);

  // Receive config + selection from the sandbox.
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const msg = e.data?.pluginMessage;
      if (!msg) return;
      if (msg.type === "config") {
        const url = (msg.dataUrl as string | null) ?? DEFAULT_DATA_URL;
        setDataUrl(url);
        setDraftUrl(url);
      } else if (msg.type === "selection") {
        setSelection(msg.node as Selection);
        if (svgUrlRef.current) {
          URL.revokeObjectURL(svgUrlRef.current);
          svgUrlRef.current = null;
        }
        if (msg.svg) {
          const blob = new Blob([msg.svg as BlobPart], { type: "image/svg+xml" });
          const u = URL.createObjectURL(blob);
          svgUrlRef.current = u;
          setSelectionSvgUrl(u);
        } else {
          setSelectionSvgUrl(null);
        }
      }
    };
    window.addEventListener("message", handler);
    post({ type: "get-config" });
    post({ type: "get-selection" });
    const t = setTimeout(() => setDataUrl((cur) => cur ?? DEFAULT_DATA_URL), 600);
    return () => {
      window.removeEventListener("message", handler);
      clearTimeout(t);
    };
  }, []);

  // Load the search index whenever the data URL changes.
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

  // Fast lookups for selection identification.
  const { byKey, byNorm } = useMemo(() => {
    const byKey = new Map<string, Hit>();
    const byNorm = new Map<string, Hit[]>();
    if (index) {
      for (const it of index.icons) {
        byKey.set(`${it.s}:${it.n}`, it);
        const k = normalize(it.n);
        const arr = byNorm.get(k);
        if (arr) arr.push(it);
        else byNorm.set(k, [it]);
      }
    }
    return { byKey, byNorm };
  }, [index]);

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

  async function send(hit: Hit, mode: "insert" | "replace") {
    if (!index) return;
    const sm = index.sets[hit.s];
    const meta: IconMeta = { set: hit.s, name: hit.n, variant: sm.defaultVariant };
    try {
      const svg = await fetch(urlFor(sm, hit)).then((r) => r.text());
      post({ type: mode === "replace" ? "replace-svg" : "insert-svg", svg, meta });
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
              <div className="ident-sub">
                {sm ? sm.name : meta.set} · {meta.variant}
              </div>
            </div>
          </div>
          {others.length > 0 && (
            <>
              <div className="panel-sub">Swap to another pack ({others.length})</div>
              <div className="grid small">
                {others.map((h) => {
                  const osm = index.sets[h.s];
                  return (
                    <button
                      key={`${h.s}:${h.n}`}
                      className="cell"
                      title={`${h.n} · ${osm.name}`}
                      onClick={() => send(h, "replace")}
                    >
                      <Icon src={urlFor(osm, h)} mono={osm.mono} />
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      );
    } else {
      const guesses = byNorm.get(normalize(selection.name)) ?? [];
      panel = (
        <div className="panel">
          <div className="panel-head">Selected layer</div>
          {guesses.length > 0 ? (
            <>
              <div className="panel-sub">Looks like “{selection.name}” — swap with a library icon</div>
              <div className="grid small">
                {guesses.map((h) => {
                  const osm = index.sets[h.s];
                  return (
                    <button
                      key={`${h.s}:${h.n}`}
                      className="cell"
                      title={`${h.n} · ${osm.name}`}
                      onClick={() => send(h, "replace")}
                    >
                      <Icon src={urlFor(osm, h)} mono={osm.mono} />
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="ident">
              {selectionSvgUrl && <img className="ident-thumb" src={selectionSvgUrl} alt="" />}
              <div className="ident-sub">
                “{selection.name}” isn’t recognized. Insert one below, or rename the layer to an
                icon name (e.g. “home”) and reselect.
              </div>
            </div>
          )}
        </div>
      );
    }
  }

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
            <button className="primary" onClick={saveSettings}>
              Save
            </button>
          </div>
          <p className="hint">Points at any Open Icons deployment serving /data/search.json.</p>
        </div>
      )}

      {index && (
        <div className="chips">
          <button
            className={`chip ${activeSet === null ? "active" : ""}`}
            onClick={() => setActiveSet(null)}
          >
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

      <div className="grid">
        {results.map((hit) => {
          const sm = index!.sets[hit.s];
          return (
            <button
              key={`${hit.s}:${hit.n}`}
              className="cell"
              title={`${hit.n} · ${sm.name}`}
              onClick={() => send(hit, "insert")}
            >
              <Icon src={urlFor(sm, hit)} mono={sm.mono} />
            </button>
          );
        })}
      </div>

      {index && query.trim() && results.length === 0 && (
        <p className="status">No icons match “{query}”.</p>
      )}
      {index && !query.trim() && !panel && (
        <p className="empty">Type to search every Open Icons pack, then click to insert.</p>
      )}
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
