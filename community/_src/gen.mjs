// Generates the Figma Community visuals (cover + 9 carousel slides + OG image)
// as standalone HTML files. Rendered to PNG by Chrome headless (see render.sh).
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const logo = readFileSync(join(ROOT, "Open Icons Logo.png")).toString("base64");
const LOGO = `data:image/png;base64,${logo}`;

// Real icons from the live CDN — a curated, recognizable wall.
const CDN = "https://cdn.jsdelivr.net";
const ICONS = [
  `${CDN}/gh/lucide-icons/lucide@1.21.0/icons/house.svg`,
  `${CDN}/gh/lucide-icons/lucide@1.21.0/icons/heart.svg`,
  `${CDN}/gh/lucide-icons/lucide@1.21.0/icons/star.svg`,
  `${CDN}/gh/lucide-icons/lucide@1.21.0/icons/camera.svg`,
  `${CDN}/gh/lucide-icons/lucide@1.21.0/icons/settings.svg`,
  `${CDN}/gh/lucide-icons/lucide@1.21.0/icons/bell.svg`,
  `${CDN}/gh/lucide-icons/lucide@1.21.0/icons/search.svg`,
  `${CDN}/gh/lucide-icons/lucide@1.21.0/icons/cloud.svg`,
  `${CDN}/npm/@tabler/icons@3.44.0/icons/outline/rocket.svg`,
  `${CDN}/npm/@tabler/icons@3.44.0/icons/outline/bolt.svg`,
  `${CDN}/npm/@tabler/icons@3.44.0/icons/outline/flame.svg`,
  `${CDN}/npm/@tabler/icons@3.44.0/icons/outline/map-pin.svg`,
  `${CDN}/gh/phosphor-icons/core@2.0.8/assets/regular/airplane.svg`,
  `${CDN}/gh/phosphor-icons/core@2.0.8/assets/regular/gear.svg`,
  `${CDN}/gh/phosphor-icons/core@2.0.8/assets/regular/lightbulb.svg`,
  `${CDN}/gh/feathericons/feather@4.29.2/icons/anchor.svg`,
  `${CDN}/gh/feathericons/feather@4.29.2/icons/aperture.svg`,
  `${CDN}/gh/iconoir-icons/iconoir@7.11.1/icons/regular/bell.svg`,
];
const variants = {
  outline: `${CDN}/npm/@tabler/icons@3.44.0/icons/outline/home.svg`,
  filled: `${CDN}/npm/@tabler/icons@3.44.0/icons/filled/home.svg`,
  phHeart: `${CDN}/gh/phosphor-icons/core@2.0.8/assets/regular/heart.svg`,
  phHeartFill: `${CDN}/gh/phosphor-icons/core@2.0.8/assets/fill/heart-fill.svg`,
  phHeartDuo: `${CDN}/gh/phosphor-icons/core@2.0.8/assets/duotone/heart-duotone.svg`,
};
const housePacks = [
  ["Lucide", `${CDN}/gh/lucide-icons/lucide@1.21.0/icons/house.svg`],
  ["Phosphor", `${CDN}/gh/phosphor-icons/core@2.0.8/assets/regular/house.svg`],
  ["Tabler", `${CDN}/npm/@tabler/icons@3.44.0/icons/outline/home.svg`],
  ["Material", `${CDN}/npm/@material-design-icons/svg@0.14.15/outlined/home.svg`],
  ["Bootstrap", `${CDN}/gh/twbs/icons@1.13.1/icons/house.svg`],
  ["Feather", `${CDN}/gh/feathericons/feather@4.29.2/icons/home.svg`],
];

// Mono icon rendered in a theme color via CSS mask.
const mIcon = (url, size = 70, color = "var(--fg)") =>
  `<span class="mi" style="width:${size}px;height:${size}px;background:${color};-webkit-mask:url('${url}') center/contain no-repeat;mask:url('${url}') center/contain no-repeat"></span>`;

const head = (dark = false) => `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Libertinus+Serif:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root{--bg:${dark ? "#14180f" : "#fcfcf7"};--surface:${dark ? "#1d231a" : "#ffffff"};--fg:${dark ? "#f1f0e6" : "#1a2018"};--muted:${dark ? "#9a9e92" : "#6b7280"};--border:${dark ? "#2a3025" : "#e8e7de"};--lime:#d3f969}
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:1920px;height:1080px}
  body{background:var(--bg);color:var(--fg);font-family:Inter,system-ui,sans-serif;overflow:hidden;position:relative}
  .stage{width:1920px;height:1080px;padding:120px;display:flex;flex-direction:column;position:relative}
  .serif{font-family:'Libertinus Serif',Georgia,serif}
  .eyebrow{display:inline-flex;align-items:center;gap:14px;font-size:26px;font-weight:500;color:var(--muted);letter-spacing:.01em}
  .logo{width:64px;height:64px;border-radius:14px}
  h1{font-size:120px;line-height:1.02;letter-spacing:-.02em;font-weight:600}
  h1 .muted{color:var(--muted)}
  .sub{font-size:40px;color:var(--muted);max-width:1100px;line-height:1.35;margin-top:36px}
  .pill{display:inline-flex;align-items:center;gap:14px;background:var(--lime);color:#1a2018;font-weight:600;font-size:30px;padding:16px 30px;border-radius:999px}
  .dot{width:12px;height:12px;border-radius:50%;background:#1a2018;opacity:.7}
  .mi{display:inline-block}
  .card{background:var(--surface);border:1px solid var(--border);border-radius:28px}
  .badge{display:inline-flex;align-items:center;gap:10px;border:1px solid var(--border);background:var(--surface);border-radius:999px;padding:12px 22px;font-size:26px;color:var(--muted);font-weight:500}
  .num{font-variant-numeric:tabular-nums}
  .foot{position:absolute;left:120px;bottom:90px;display:flex;align-items:center;gap:18px;color:var(--muted);font-size:28px}
  .right{margin-left:auto}
</style></head><body>`;
const foot = `</body></html>`;

// ---- icon wall (decorative grid of real icons) ----
function wall(cols, rows, size = 96, gap = 40, opacity = 1) {
  let cells = "";
  for (let i = 0; i < cols * rows; i++) {
    cells += `<div class="card" style="display:grid;place-items:center;border-radius:24px">${mIcon(ICONS[i % ICONS.length], size)}</div>`;
  }
  return `<div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:${gap}px;opacity:${opacity}">${cells}</div>`;
}

const slides = {};

// COVER
slides["cover"] = head() + `<div class="stage" style="flex-direction:row;align-items:center;gap:90px">
  <div style="flex:1">
    <div class="eyebrow"><img class="logo" src="${LOGO}">Open Icons</div>
    <h1 class="serif" style="margin-top:40px">Every open-source<br>icon, <span class="muted">inside Figma.</span></h1>
    <p class="sub">Search, insert and swap 17,000+ icons from 14 of the best packs — copy the SVG or drop it straight onto the canvas.</p>
    <div style="margin-top:50px"><span class="pill"><span class="dot"></span><span class="num">17,745</span> icons · 14 packs · live from source</span></div>
  </div>
  <div style="width:760px">${wall(4, 5, 92, 34)}</div>
</div>` + foot;

// 01 — title
slides["01"] = head() + `<div class="stage" style="align-items:center;justify-content:center;text-align:center">
  <div class="eyebrow" style="justify-content:center"><img class="logo" src="${LOGO}">Open Icons · Figma plugin</div>
  <h1 class="serif" style="margin-top:44px;font-size:140px">17,000+ icons.<br><span class="muted">One search.</span></h1>
  <div style="margin-top:64px;display:flex;gap:30px;flex-wrap:wrap;justify-content:center;max-width:1300px">
    ${["Lucide","Phosphor","Tabler","Material","Heroicons","Feather","Bootstrap","Remix","Eva","Pixelart","Flagpack","Iconoir","Flowbite","Doodle"].map(p=>`<span class="badge">${p}</span>`).join("")}
  </div>
</div>` + foot;

// 02 — search across all packs
slides["02"] = head() + `<div class="stage">
  <h1 class="serif" style="font-size:104px">Search every<br>pack at once.</h1>
  <div class="card" style="margin-top:70px;padding:30px 40px;display:flex;align-items:center;gap:28px;max-width:1300px">
    ${mIcon(ICONS[6],44,"var(--muted)")}<span style="font-size:42px;color:var(--muted)">house</span><span class="right badge"><span class="num">863</span> matches</span>
  </div>
  <div style="margin-top:50px;display:grid;grid-template-columns:repeat(8,1fr);gap:28px;max-width:1680px">
    ${housePacks.concat(housePacks).map(([n,u])=>`<div class="card" style="display:grid;place-items:center;height:160px;border-radius:22px">${mIcon(u,76)}</div>`).join("")}
  </div>
  <p class="sub" style="margin-top:46px">Filter by pack, or browse one library at a time.</p>
</div>` + foot;

// 03 — insert editable vectors at any size
slides["03"] = head() + `<div class="stage" style="flex-direction:row;align-items:center;gap:100px">
  <div style="flex:1"><h1 class="serif" style="font-size:104px">Insert as<br>editable vectors.</h1>
  <p class="sub">Pick the size, lock the aspect ratio, clip the frame — set up for you, ready to tweak.</p>
  <div style="margin-top:46px;display:flex;gap:18px">${["16","24","32","48","64"].map((s,i)=>`<span class="badge" style="${i===1?'background:#d3f969;color:#1a2018;border-color:transparent':''}">${s}px</span>`).join("")}</div></div>
  <div class="card" style="width:620px;height:620px;display:grid;place-items:center">${mIcon(ICONS[8],300)}</div>
</div>` + foot;

// 04 — variants
slides["04"] = head() + `<div class="stage">
  <h1 class="serif" style="font-size:104px">Every variant,<br>one click away.</h1>
  <div style="margin-top:80px;display:flex;gap:60px;align-items:center;flex-wrap:wrap">
    ${[["Outline",variants.phHeart],["Fill",variants.phHeartFill],["Duotone",variants.phHeartDuo],["Outline",variants.outline],["Filled",variants.filled]].map(([label,u])=>`<div style="text-align:center"><div class="card" style="width:240px;height:240px;display:grid;place-items:center">${mIcon(u,150)}</div><div style="margin-top:22px;font-size:30px;color:var(--muted);font-weight:500">${label}</div></div>`).join("")}
  </div>
  <p class="sub" style="margin-top:60px">Outline · solid · fill · weights · duotone — wherever a pack offers them.</p>
</div>` + foot;

// 05 — identify selection (dark)
slides["05"] = head(true) + `<div class="stage" style="flex-direction:row;align-items:center;gap:100px">
  <div style="flex:1"><div class="eyebrow">Select an icon →</div><h1 class="serif" style="font-size:100px;margin-top:30px">Which pack<br>is this?</h1>
  <p class="sub">Open Icons identifies any selected icon — by its layer name, or even by its shape.</p></div>
  <div class="card" style="width:640px;padding:60px">
    <div style="display:flex;align-items:center;gap:30px">${mIcon(housePacks[0][1],90)}<div><div class="serif" style="font-size:54px">house</div><div style="font-size:32px;color:var(--muted);margin-top:6px">Lucide · identified</div></div></div>
    <div style="margin-top:46px;font-size:28px;color:var(--muted)">Same icon in other libraries</div>
    <div style="margin-top:24px;display:grid;grid-template-columns:repeat(5,1fr);gap:18px">${housePacks.slice(1).concat([housePacks[2]]).slice(0,5).map(([n,u])=>`<div class="card" style="height:120px;display:grid;place-items:center;border-radius:18px">${mIcon(u,64)}</div>`).join("")}</div>
  </div>
</div>` + foot;

// 06 — swap packs
slides["06"] = head() + `<div class="stage">
  <h1 class="serif" style="font-size:104px">Swap an icon's<br>pack in place.</h1>
  <div style="margin-top:90px;display:flex;align-items:center;gap:50px">
    <div class="card" style="width:240px;height:240px;display:grid;place-items:center">${mIcon(housePacks[0][1],150)}</div>
    <div style="font-size:90px;color:var(--muted)">→</div>
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:30px">${housePacks.slice(1).concat([housePacks[2]]).slice(0,5).map(([n,u])=>`<div class="card" style="width:200px;height:200px;display:grid;place-items:center">${mIcon(u,120)}</div>`).join("")}</div>
  </div>
  <p class="sub" style="margin-top:64px">Turn a Lucide icon into Phosphor, Tabler, Material… without redrawing a thing.</p>
</div>` + foot;

// 07 — batch swap
slides["07"] = head(true) + `<div class="stage">
  <div class="eyebrow">3 icons selected — swap all to</div>
  <h1 class="serif" style="font-size:96px;margin-top:30px">Re-skin a whole<br>selection at once.</h1>
  <div style="margin-top:60px;display:flex;gap:40px;align-items:center">
    <div style="display:flex;gap:24px">${[housePacks[0][1],variants.phHeart,ICONS[13]].map(u=>`<div class="card" style="width:170px;height:170px;display:grid;place-items:center">${mIcon(u,100)}</div>`).join("")}</div>
    <div style="font-size:80px;color:var(--muted)">→</div>
    <div style="display:flex;gap:24px">${[housePacks[1][1],variants.phHeartFill,variants.phHeartDuo].map(()=>"").length?[`${CDN}/npm/@tabler/icons@3.44.0/icons/outline/home.svg`,`${CDN}/npm/@tabler/icons@3.44.0/icons/outline/heart.svg`,`${CDN}/npm/@tabler/icons@3.44.0/icons/outline/settings.svg`].map(u=>`<div class="card" style="width:170px;height:170px;display:grid;place-items:center">${mIcon(u,100)}</div>`).join(""):""}</div>
  </div>
  <p class="sub" style="margin-top:60px">Different libraries → one pack. Exact name match first, then the closest by shape.</p>
</div>` + foot;

// 08 — favorites / recents / themes
slides["08"] = head() + `<div class="stage">
  <h1 class="serif" style="font-size:104px">Made to live<br>in your workflow.</h1>
  <div style="margin-top:80px;display:grid;grid-template-columns:repeat(3,1fr);gap:46px;max-width:1680px">
    ${[["★ Favorites","Pin the icons you reach for."],["↺ Recents","Re-insert what you just used."],["◐ Themes","Light, dark, or device default."]].map(([t,d])=>`<div class="card" style="padding:54px"><div class="serif" style="font-size:50px">${t}</div><div style="margin-top:18px;font-size:30px;color:var(--muted);line-height:1.4">${d}</div></div>`).join("")}
  </div>
  <p class="sub" style="margin-top:60px">Resizable panel · compact / large density · one-click insert or replace.</p>
</div>` + foot;

// 09 — CTA / website
slides["09"] = head() + `<div class="stage" style="align-items:center;justify-content:center;text-align:center">
  <img class="logo" src="${LOGO}" style="width:120px;height:120px;border-radius:26px">
  <h1 class="serif" style="margin-top:50px;font-size:120px">Free & open<br>source.</h1>
  <p class="sub" style="text-align:center;margin-top:36px">Every icon keeps its original license. Browse, copy SVGs and grab CDN links on the web too.</p>
  <div style="margin-top:54px"><span class="pill"><span class="dot"></span>open-icons.vercel.app</span></div>
</div>` + foot;

// OG (1200x630) — separate sizing
slides["og"] = head().replace("width:1920px;height:1080px", "width:1200px;height:630px").replaceAll("1920px", "1200px").replaceAll("1080px", "630px") +
  `<div class="stage" style="width:1200px;height:630px;padding:80px;flex-direction:row;align-items:center;gap:50px">
    <div style="flex:1"><div class="eyebrow"><img class="logo" style="width:48px;height:48px" src="${LOGO}">Open Icons</div>
    <h1 class="serif" style="font-size:78px;margin-top:24px">Every open-source<br>icon, <span class="muted">in one place.</span></h1>
    <div style="margin-top:34px"><span class="pill" style="font-size:24px"><span class="dot"></span>17,745 icons · 14 packs</span></div></div>
    <div style="width:420px">${wall(3, 3, 84, 26)}</div>
  </div>` + foot;

for (const [name, html] of Object.entries(slides)) {
  writeFileSync(join(__dirname, `${name}.html`), html);
}
console.log("wrote", Object.keys(slides).length, "html slides");
