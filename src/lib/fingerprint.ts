/**
 * Geometry fingerprinting for shape-based icon matching.
 *
 * Shared by the fingerprint script (Node, over source SVGs) and the Figma
 * plugin (browser, over a selection's exported SVG) — both must compute the
 * SAME signature. Pure JS, no platform APIs.
 *
 * Approach: sample a point cloud from the SVG's geometry (path data with line +
 * cubic-bezier sampling, plus basic shapes), normalize it into the unit square
 * by its bounding box WITH ASPECT PRESERVED (letterboxed), then build a 16×16
 * density histogram and quantize each cell to 4 bits → a 256-char hex signature.
 * Similarity is cosine distance over the per-cell densities, which is robust to
 * the coordinate rounding / reformatting Figma introduces when round-tripping
 * SVG (a round-tripped icon still scores ~1.0 against its source).
 */

const GRID = 16;
const NUM_RE = /-?\d*\.?\d+(?:e[-+]?\d+)?/gi;

type Pt = [number, number];

function nums(s: string): number[] {
  return (s.match(NUM_RE) ?? []).map(Number);
}

/** Point cloud from one path `d` string, sampling along lines and curves. */
function pathPoints(d: string): Pt[] {
  const pts: Pt[] = [];
  let x = 0, y = 0, sx = 0, sy = 0;
  const seg = (x0: number, y0: number, x1: number, y1: number) => {
    const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / 2));
    for (let k = 1; k <= n; k++) pts.push([x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n]);
  };
  const re = /([astvzqmhlc])([^astvzqmhlc]*)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(d))) {
    const raw = m[1];
    const rel = raw === raw.toLowerCase();
    const C = raw.toUpperCase();
    const a = nums(m[2]);
    const ax = (v: number) => (rel ? x + v : v);
    const ay = (v: number) => (rel ? y + v : v);
    let i = 0;
    switch (C) {
      case "M":
        for (; i + 1 < a.length; i += 2) {
          const nx = ax(a[i]), ny = ay(a[i + 1]);
          if (i === 0) { sx = nx; sy = ny; pts.push([nx, ny]); } else seg(x, y, nx, ny);
          x = nx; y = ny;
        }
        break;
      case "L":
        for (; i + 1 < a.length; i += 2) { const nx = ax(a[i]), ny = ay(a[i + 1]); seg(x, y, nx, ny); x = nx; y = ny; }
        break;
      case "H":
        for (; i < a.length; i++) { const nx = rel ? x + a[i] : a[i]; seg(x, y, nx, y); x = nx; }
        break;
      case "V":
        for (; i < a.length; i++) { const ny = rel ? y + a[i] : a[i]; seg(x, y, x, ny); y = ny; }
        break;
      case "C":
        for (; i + 5 < a.length; i += 6) {
          const c1x = ax(a[i]), c1y = ay(a[i + 1]), c2x = ax(a[i + 2]), c2y = ay(a[i + 3]);
          const ex = ax(a[i + 4]), ey = ay(a[i + 5]);
          for (let t = 1; t <= 8; t++) {
            const u = t / 8, mt = 1 - u;
            pts.push([
              mt * mt * mt * x + 3 * mt * mt * u * c1x + 3 * mt * u * u * c2x + u * u * u * ex,
              mt * mt * mt * y + 3 * mt * mt * u * c1y + 3 * mt * u * u * c2y + u * u * u * ey,
            ]);
          }
          x = ex; y = ey;
        }
        break;
      case "S":
      case "Q":
        for (; i + 3 < a.length; i += 4) { const ex = ax(a[i + 2]), ey = ay(a[i + 3]); seg(x, y, ex, ey); x = ex; y = ey; }
        break;
      case "T":
        for (; i + 1 < a.length; i += 2) { const ex = ax(a[i]), ey = ay(a[i + 1]); seg(x, y, ex, ey); x = ex; y = ey; }
        break;
      case "A":
        for (; i + 6 < a.length; i += 7) { const ex = ax(a[i + 5]), ey = ay(a[i + 6]); seg(x, y, ex, ey); x = ex; y = ey; }
        break;
      case "Z":
        seg(x, y, sx, sy); x = sx; y = sy;
        break;
    }
  }
  return pts;
}

function attr(tag: string, name: string): number | null {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*"(-?\\d*\\.?\\d+(?:e[-+]?\\d+)?)"`, "i"));
  return m ? Number(m[1]) : null;
}

function collectPoints(svg: string): Pt[] {
  const pts: Pt[] = [];
  for (const m of svg.matchAll(/<path\b[^>]*\bd\s*=\s*"([^"]+)"/gi)) pts.push(...pathPoints(m[1]));
  for (const m of svg.matchAll(/<(?:polygon|polyline)\b[^>]*\bpoints\s*=\s*"([^"]+)"/gi)) {
    const n = nums(m[1]);
    for (let i = 0; i + 1 < n.length; i += 2) pts.push([n[i], n[i + 1]]);
  }
  for (const m of svg.matchAll(/<rect\b[^>]*>/gi)) {
    const w = attr(m[0], "width"), h = attr(m[0], "height");
    if (w != null && h != null) {
      const X = attr(m[0], "x") ?? 0, Y = attr(m[0], "y") ?? 0;
      pts.push([X, Y], [X + w, Y], [X, Y + h], [X + w, Y + h], [X + w / 2, Y + h / 2]);
    }
  }
  for (const m of svg.matchAll(/<(?:circle|ellipse)\b[^>]*>/gi)) {
    const cx = attr(m[0], "cx") ?? 0, cy = attr(m[0], "cy") ?? 0;
    const r = attr(m[0], "r");
    const rx = attr(m[0], "rx") ?? r, ry = attr(m[0], "ry") ?? r;
    if (rx != null && ry != null) {
      for (let k = 0; k < 12; k++) {
        const t = (k / 12) * Math.PI * 2;
        pts.push([cx + Math.cos(t) * rx, cy + Math.sin(t) * ry]);
      }
    }
  }
  for (const m of svg.matchAll(/<line\b[^>]*>/gi)) {
    const x1 = attr(m[0], "x1"), y1 = attr(m[0], "y1"), x2 = attr(m[0], "x2"), y2 = attr(m[0], "y2");
    if (x1 != null && y1 != null && x2 != null && y2 != null) pts.push([x1, y1], [x2, y2]);
  }
  return pts;
}

/** Compute a 256-char hex signature (16×16 density, 4 bits/cell), or "" if no geometry. */
export function fingerprint(svg: string): string {
  const pts = collectPoints(svg);
  if (pts.length < 3) return "";

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of pts) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  const w = maxX - minX || 1, h = maxY - minY || 1;
  const scale = Math.max(w, h);
  const offX = (scale - w) / 2, offY = (scale - h) / 2; // letterbox → preserve aspect

  const g = new Float64Array(GRID * GRID);
  for (const [x, y] of pts) {
    const gx = Math.min(GRID - 1, Math.floor(((x - minX + offX) / scale) * GRID));
    const gy = Math.min(GRID - 1, Math.floor(((y - minY + offY) / scale) * GRID));
    g[gy * GRID + gx]++;
  }

  let mx = 0;
  for (const v of g) if (v > mx) mx = v;
  mx = mx || 1;

  let hex = "";
  for (let i = 0; i < g.length; i++) hex += Math.round((g[i] / mx) * 15).toString(16);
  return hex;
}

/** Cosine similarity in [0,1] between two signatures (1 = identical). */
export function similarity(a: string, b: string): number {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    const va = parseInt(a[i], 16);
    const vb = parseInt(b[i], 16);
    dot += va * vb;
    na += va * va;
    nb += vb * vb;
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom ? dot / denom : 0;
}
