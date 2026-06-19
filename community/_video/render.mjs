// Open Icons — animated product demo (1920×1080, ~24s, 30fps).
// Renders frames with @napi-rs/canvas and pipes raw RGBA to ffmpeg → MP4 + audio.
import { createCanvas, loadImage, GlobalFonts } from "@napi-rs/canvas";
import ffmpegPath from "ffmpeg-static";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");

// ---- fonts (system) ----
const F = "/System/Library/Fonts/Supplemental/";
GlobalFonts.registerFromPath(F + "Georgia.ttf", "OISerif");
GlobalFonts.registerFromPath(F + "Georgia Bold.ttf", "OISerifB");
GlobalFonts.registerFromPath(F + "Arial.ttf", "OISans");
GlobalFonts.registerFromPath(F + "Arial Bold.ttf", "OISansB");

const W = 1920, H = 1080, FPS = 30, DUR = 24;
const FRAMES = DUR * FPS;
const C = { cream: "#fcfcf7", fg: "#1a2018", muted: "#6b7280", lime: "#d3f969", surface: "#ffffff", border: "#e8e7de" };

// ---- easing ----
const clampf = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const eOut = (t) => 1 - Math.pow(1 - clampf(t), 3);
const eInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const eBack = (t) => { t = clampf(t); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const fade = (local, dur, fi = 0.5, fo = 0.45) => clampf(local / fi) * clampf((dur - local) / fo);

const CDN = "https://cdn.jsdelivr.net";
const WALL = [
  "gh/lucide-icons/lucide@1.21.0/icons/house","gh/lucide-icons/lucide@1.21.0/icons/heart","gh/lucide-icons/lucide@1.21.0/icons/star",
  "gh/lucide-icons/lucide@1.21.0/icons/camera","gh/lucide-icons/lucide@1.21.0/icons/bell","gh/lucide-icons/lucide@1.21.0/icons/cloud",
  "gh/lucide-icons/lucide@1.21.0/icons/settings","gh/lucide-icons/lucide@1.21.0/icons/search","npm/@tabler/icons@3.44.0/icons/outline/rocket",
  "npm/@tabler/icons@3.44.0/icons/outline/bolt","npm/@tabler/icons@3.44.0/icons/outline/flame","npm/@tabler/icons@3.44.0/icons/outline/map-pin",
  "gh/phosphor-icons/core@2.0.8/assets/regular/airplane","gh/phosphor-icons/core@2.0.8/assets/regular/gear","gh/phosphor-icons/core@2.0.8/assets/regular/lightbulb",
  "gh/feathericons/feather@4.29.2/icons/anchor","gh/feathericons/feather@4.29.2/icons/aperture","gh/iconoir-icons/iconoir@7.11.1/icons/regular/bell",
  "gh/lucide-icons/lucide@1.21.0/icons/compass","gh/lucide-icons/lucide@1.21.0/icons/music","gh/lucide-icons/lucide@1.21.0/icons/coffee",
  "npm/@tabler/icons@3.44.0/icons/outline/heart","npm/@tabler/icons@3.44.0/icons/outline/star","gh/phosphor-icons/core@2.0.8/assets/regular/camera",
  "gh/feathericons/feather@4.29.2/icons/feather","gh/lucide-icons/lucide@1.21.0/icons/sun","gh/lucide-icons/lucide@1.21.0/icons/moon",
  "npm/@tabler/icons@3.44.0/icons/outline/world",
];
const HOMES = [
  ["Lucide", "gh/lucide-icons/lucide@1.21.0/icons/house"],
  ["Phosphor", "gh/phosphor-icons/core@2.0.8/assets/regular/house"],
  ["Tabler", "npm/@tabler/icons@3.44.0/icons/outline/home"],
  ["Material", "npm/@material-design-icons/svg@0.14.15/outlined/home"],
  ["Bootstrap", "gh/twbs/icons@1.13.1/icons/house"],
  ["Feather", "gh/feathericons/feather@4.29.2/icons/home"],
];

// ---- preload SVGs as images ----
async function load(u) {
  const svg = await fetch(`${CDN}/${u}.svg`).then((r) => r.text());
  return loadImage(Buffer.from(svg));
}
const logo = await loadImage(join(ROOT, "Open Icons Logo.png"));
const wallImgs = await Promise.all(WALL.map(load));
const homeImgs = await Promise.all(HOMES.map(([, u]) => load(u)));
console.log("loaded", wallImgs.length + homeImgs.length + 1, "images");

// ---- tinting (mono icons → brand color), cached per image object ----
const tintCache = new WeakMap();
function tinted(img, color, size) {
  let inner = tintCache.get(img);
  if (!inner) { inner = new Map(); tintCache.set(img, inner); }
  const key = `${color}:${size}`;
  let cv = inner.get(key);
  if (cv) return cv;
  cv = createCanvas(size, size);
  const x = cv.getContext("2d");
  x.drawImage(img, 0, 0, size, size);
  x.globalCompositeOperation = "source-in";
  x.fillStyle = color;
  x.fillRect(0, 0, size, size);
  inner.set(key, cv);
  return cv;
}

const canvas = createCanvas(W, H);
const ctx = canvas.getContext("2d");

function rrect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function text(str, x, y, { fam = "OISans", size = 40, color = C.fg, align = "left", alpha = 1 } = {}) {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.font = `${size}px ${fam}`;
  ctx.textAlign = align;
  ctx.fillText(str, x, y);
  ctx.globalAlpha = 1;
}
function card(x, y, w, h, r, { fill = C.surface, stroke = C.border, alpha = 1 } = {}) {
  ctx.globalAlpha = alpha;
  rrect(x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) { ctx.lineWidth = 2; ctx.strokeStyle = stroke; ctx.stroke(); }
  ctx.globalAlpha = 1;
}
function icon(img, cx, cy, size, { color = C.fg, alpha = 1, scale = 1 } = {}) {
  const s = size * scale;
  ctx.globalAlpha = alpha;
  ctx.drawImage(tinted(img, color, Math.max(2, Math.round(size))), cx - s / 2, cy - s / 2, s, s);
  ctx.globalAlpha = 1;
}

// =================== SCENES ===================
function scene1(t) { // logo intro (dur 3.4)
  const a = fade(t, 3.4, 0.01, 0.4);
  const cx = W / 2;
  const ls = lerp(0.8, 1, eBack(clampf(t / 0.8)));
  const la = clampf(t / 0.5);
  const lsz = 150 * ls;
  ctx.globalAlpha = la * a;
  ctx.drawImage(logo, cx - lsz / 2, 250 - lsz / 2, lsz, lsz);
  ctx.globalAlpha = 1;
  const ty = lerp(30, 0, eOut(clampf((t - 0.5) / 0.7)));
  text("Open Icons", cx, 470 + ty, { fam: "OISerifB", size: 130, color: C.fg, align: "center", alpha: clampf((t - 0.5) / 0.6) * a });
  text("Every open-source icon, inside Figma.", cx, 560, { fam: "OISans", size: 44, color: C.muted, align: "center", alpha: clampf((t - 1.1) / 0.6) * a });
  // lime pill
  const pa = clampf((t - 1.6) / 0.6);
  const py = lerp(30, 0, eOut(pa));
  ctx.globalAlpha = pa * a;
  const label = "17,745 icons · 14 packs · live from source";
  ctx.font = "500 32px OISans"; const pw = ctx.measureText(label).width + 80;
  card(cx - pw / 2, 640 + py, pw, 64, 32, { fill: C.lime, stroke: null });
  ctx.fillStyle = "#1a2018"; ctx.beginPath(); ctx.arc(cx - pw / 2 + 34, 672 + py, 7, 0, 7); ctx.fill();
  text(label, cx + 18, 683 + py, { fam: "OISans", size: 32, color: "#1a2018", align: "center" });
  ctx.globalAlpha = 1;
}

function scene2(t) { // icon wall (dur 5.5)
  const a = fade(t, 5.5);
  text("14 packs. 17,745 icons.", W / 2, 175, { fam: "OISerifB", size: 92, color: C.fg, align: "center", alpha: clampf(t / 0.6) * a });
  const cols = 7, rows = 4, cell = 200, gap = 26;
  const gw = cols * cell + (cols - 1) * gap, gh = rows * cell + (rows - 1) * gap;
  const ox = (W - gw) / 2, oy = 270;
  for (let i = 0; i < cols * rows; i++) {
    const col = i % cols, row = (i / cols) | 0;
    const delay = 0.3 + (col + row) * 0.07;
    const p = clampf((t - delay) / 0.5);
    if (p <= 0) continue;
    const sc = eBack(p), al = clampf(p / 0.6) * a;
    const x = ox + col * (cell + gap), y = oy + row * (cell + gap);
    ctx.save();
    ctx.translate(x + cell / 2, y + cell / 2); ctx.scale(sc, sc); ctx.translate(-(x + cell / 2), -(y + cell / 2));
    card(x, y, cell, cell, 28, { alpha: al });
    icon(wallImgs[i % wallImgs.length], x + cell / 2, y + cell / 2, 96, { alpha: al });
    ctx.restore();
  }
}

function scene3(t) { // search (dur 6)
  const a = fade(t, 6);
  text("Search every pack at once.", W / 2, 165, { fam: "OISerifB", size: 92, color: C.fg, align: "center", alpha: clampf(t / 0.5) * a });
  // search bar
  const bw = 1180, bx = (W - bw) / 2, by = 250;
  card(bx, by, bw, 96, 22, { alpha: a });
  icon(wallImgs[7], bx + 56, by + 48, 44, { color: C.muted, alpha: a }); // search glyph
  const full = clampf((t - 0.4) / 0.7);
  const shown = "home".slice(0, Math.round(full * 4));
  text(shown + (Math.floor(t * 2) % 2 && t < 1.4 ? "|" : ""), bx + 100, by + 62, { fam: "OISans", size: 44, color: C.fg, alpha: a });
  // matches badge
  const mb = clampf((t - 1.2) / 0.4);
  text("863 matches", bx + bw - 60, by + 60, { fam: "OISans", size: 32, color: C.muted, align: "right", alpha: mb * a });
  // results grid (home icons)
  const cols = 6, rows = 3, cell = 175, gap = 26;
  const gw = cols * cell + (cols - 1) * gap, ox = (W - gw) / 2, oy = 430;
  for (let i = 0; i < cols * rows; i++) {
    const col = i % cols, row = (i / cols) | 0;
    const delay = 1.3 + i * 0.07;
    const p = clampf((t - delay) / 0.45);
    if (p <= 0) continue;
    const sc = eBack(p), al = clampf(p / 0.5) * a;
    const x = ox + col * (cell + gap), y = oy + row * (cell + gap);
    ctx.save();
    ctx.translate(x + cell / 2, y + cell / 2); ctx.scale(sc, sc); ctx.translate(-(x + cell / 2), -(y + cell / 2));
    card(x, y, cell, cell, 24, { alpha: al });
    icon(homeImgs[i % homeImgs.length], x + cell / 2, y + cell / 2, 84, { alpha: al });
    ctx.restore();
  }
}

function scene4(t) { // swap (dur 5)
  const a = fade(t, 5);
  text("Swap an icon's pack in one click.", W / 2, 175, { fam: "OISerifB", size: 84, color: C.fg, align: "center", alpha: clampf(t / 0.5) * a });
  const cx = W / 2, cy = 560;
  // which pack is showing
  const step = 0.72, idxF = clampf((t - 0.5) / step);
  const idx = Math.min(HOMES.length - 1, Math.floor(idxF));
  const within = clampf(idxF - idx);
  const swapA = Math.sin(clampf(within / 0.35) * Math.PI / 2); // 0..1 ease for crossfade end
  // pulse on change
  const pulse = 1 + 0.06 * Math.sin(clampf(within / 0.3) * Math.PI);
  card(cx - 230, cy - 230, 460, 460, 40, { alpha: a });
  // crossfade current → next
  const cur = homeImgs[idx];
  const nxt = homeImgs[Math.min(HOMES.length - 1, idx + 1)];
  const k = clampf((within - 0.55) / 0.35); // start blending late
  icon(cur, cx, cy, 270 * pulse, { alpha: (1 - k) * a });
  if (k > 0) icon(nxt, cx, cy, 270 * pulse, { alpha: k * a });
  // label
  const nameIdx = k > 0.5 ? Math.min(HOMES.length - 1, idx + 1) : idx;
  text(HOMES[nameIdx][0], cx, cy + 360, { fam: "OISerif", size: 56, color: C.fg, align: "center", alpha: a });
}

function scene5(t) { // CTA (dur 4.1)
  const a = fade(t, 4.1, 0.5, 0.3);
  const cx = W / 2;
  const ls = lerp(0.85, 1, eBack(clampf(t / 0.7))), lsz = 130 * ls;
  ctx.globalAlpha = clampf(t / 0.5) * a;
  ctx.drawImage(logo, cx - lsz / 2, 300 - lsz / 2, lsz, lsz);
  ctx.globalAlpha = 1;
  text("Free & open source.", cx, 520, { fam: "OISerifB", size: 120, color: C.fg, align: "center", alpha: clampf((t - 0.4) / 0.6) * a });
  const pa = clampf((t - 0.9) / 0.6);
  ctx.font = "500 36px OISans"; const label = "open-icons.vercel.app"; const pw = ctx.measureText(label).width + 90;
  ctx.globalAlpha = pa * a;
  card(cx - pw / 2, 600, pw, 74, 37, { fill: C.lime, stroke: null });
  ctx.fillStyle = "#1a2018"; ctx.beginPath(); ctx.arc(cx - pw / 2 + 38, 637, 7, 0, 7); ctx.fill();
  text(label, cx + 20, 650, { fam: "OISansB", size: 36, color: "#1a2018", align: "center" });
  ctx.globalAlpha = 1;
  text("Made by @rakibulism", cx, 740, { fam: "OISans", size: 30, color: C.muted, align: "center", alpha: clampf((t - 1.3) / 0.6) * a });
}

function renderFrame(t) {
  ctx.fillStyle = C.cream;
  ctx.fillRect(0, 0, W, H);
  if (t < 3.4) scene1(t);
  else if (t < 8.9) scene2(t - 3.4);
  else if (t < 14.9) scene3(t - 8.9);
  else if (t < 19.9) scene4(t - 14.9);
  else scene5(t - 19.9);
}

// ---- encode via ffmpeg (raw RGBA frames on stdin + audio.wav) ----
const out = join(__dirname, "..", "demo.mp4");
const ff = spawn(ffmpegPath, [
  "-y",
  "-f", "rawvideo", "-pix_fmt", "rgba", "-s", `${W}x${H}`, "-r", String(FPS), "-i", "pipe:0",
  "-i", join(__dirname, "audio.wav"),
  "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "19", "-preset", "medium",
  "-c:a", "aac", "-b:a", "192k",
  "-shortest", "-movflags", "+faststart", out,
], { stdio: ["pipe", "inherit", "inherit"] });

function write(buf) {
  return new Promise((res) => { if (ff.stdin.write(buf)) res(); else ff.stdin.once("drain", res); });
}

for (let f = 0; f < FRAMES; f++) {
  renderFrame(f / FPS);
  const data = ctx.getImageData(0, 0, W, H).data;
  await write(Buffer.from(data.buffer, data.byteOffset, data.byteLength));
  if (f % 60 === 0) process.stdout.write(`  frame ${f}/${FRAMES}\n`);
}
ff.stdin.end();
await new Promise((res) => ff.on("close", res));
console.log("✓ demo.mp4 written");
