import { createRoot } from "react-dom/client";
import { useEffect, useMemo, useState } from "react";
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

function post(msg: unknown) {
  parent.postMessage({ pluginMessage: msg }, "*");
}

function pathFor(sm: SetMeta, hit: Hit) {
  return hit.v[sm.defaultVariant] ?? Object.values(hit.v)[0];
}
function urlFor(sm: SetMeta, hit: Hit) {
  return cdnUrl({ type: sm.type, pkg: sm.pkg }, sm.version, pathFor(sm, hit));
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

  // Receive persisted config from the sandbox, then load the index.
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const msg = e.data?.pluginMessage;
      if (msg?.type === "config") {
        const url = (msg.dataUrl as string | null) ?? DEFAULT_DATA_URL;
        setDataUrl(url);
        setDraftUrl(url);
      }
    };
    window.addEventListener("message", handler);
    post({ type: "get-config" });
    // Fallback: if no config arrives quickly, use the default so we never hang.
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

  async function insert(hit: Hit) {
    if (!index) return;
    const sm = index.sets[hit.s];
    try {
      const svg = await fetch(urlFor(sm, hit)).then((r) => r.text());
      post({ type: "insert-svg", svg, name: hit.n });
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

  return (
    <div className="app">
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
              onClick={() => insert(hit)}
            >
              <Icon src={urlFor(sm, hit)} mono={sm.mono} />
            </button>
          );
        })}
      </div>

      {index && query.trim() && results.length === 0 && (
        <p className="status">No icons match “{query}”.</p>
      )}
      {index && !query.trim() && (
        <p className="empty">Type to search every Open Icons pack, then click to insert.</p>
      )}
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
