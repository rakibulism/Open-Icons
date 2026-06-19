/**
 * Open Icons — Figma plugin controller (sandbox).
 *
 * The sandbox has no network access, so the UI iframe does all fetching and
 * hands us finished SVG markup. The controller:
 *  - inserts/replaces SVGs as editable vectors;
 *  - stamps each with pluginData (set/name/variant) AND names the layer
 *    "set/icon" (e.g. "phosphor/house") when naming is enabled, so a later
 *    selection can be identified exactly;
 *  - reports the current selection (one or many nodes) with each node's
 *    identity (pluginData → "set/icon" name → none), plus an exported SVG for
 *    shape-matching a single unidentified node;
 *  - swaps one or many selected icons in place (batch);
 *  - persists settings + favorites/recents in clientStorage.
 */

const SETTINGS_KEY = "open-icons:settings"; // { naming, shapeDetect }
const LISTS_KEY = "open-icons:lists"; // { favorites, recents }
const DATA_KEY = "openIcons"; // pluginData namespace on inserted nodes

type IconMeta = { set: string; name: string; variant: string };
type Settings = {
  naming: boolean;
  shapeDetect: boolean;
  theme: "auto" | "light" | "dark";
  density: "compact" | "default" | "large";
};
type Lists = { favorites: unknown[]; recents: unknown[] };

let settings: Settings = { naming: true, shapeDetect: true, theme: "auto", density: "default" };

const NAME_RE = /^([a-z0-9][a-z0-9-]*)\/(.+)$/i;

figma.showUI(__html__, { width: 400, height: 620, themeColors: true });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function applyMeta(node: BaseNode & { name: string }, meta: IconMeta) {
  node.name = settings.naming ? `${meta.set}/${meta.name}` : meta.name;
  node.setPluginData(DATA_KEY, JSON.stringify(meta));
}

/**
 * Make an inserted icon frame behave well: clip its contents, lock aspect ratio
 * ("scale"), let the content scale with the frame, and size it square.
 */
function applyFrameProps(frame: FrameNode, size: number) {
  for (const child of frame.children) {
    if ("constraints" in child) {
      (child as SceneNode & ConstraintMixin).constraints = { horizontal: "SCALE", vertical: "SCALE" };
    }
  }
  frame.clipsContent = true;
  frame.constrainProportions = true;
  if (size > 0) frame.resize(size, size);
}

function placeAtCenter(node: SceneNode) {
  if ("width" in node) {
    node.x = Math.round(figma.viewport.center.x - node.width / 2);
    node.y = Math.round(figma.viewport.center.y - node.height / 2);
  }
}

/** Identify a node: pluginData first, then "set/icon" layer name. */
function identify(node: BaseNode): IconMeta | { set: string; name: string } | null {
  const raw = node.getPluginData(DATA_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as IconMeta;
    } catch {
      /* fall through */
    }
  }
  if (settings.naming) {
    const m = node.name.match(NAME_RE);
    if (m) return { set: m[1].toLowerCase(), name: m[2] };
  }
  return null;
}

/** Replace one node in place with new SVG, at `size` (square), preserving slot. */
function replaceNode(old: SceneNode, svg: string, meta: IconMeta, size: number): SceneNode {
  const node = figma.createNodeFromSvg(svg);
  applyMeta(node, meta);
  applyFrameProps(node, size);
  // Center the new (square) node over the old node's footprint.
  node.x = old.x;
  node.y = old.y;
  if ("width" in old) {
    node.x = Math.round(old.x + (old.width - node.width) / 2);
    node.y = Math.round(old.y + (old.height - node.height) / 2);
  }
  const parent = old.parent;
  if (parent) {
    const index = parent.children.indexOf(old);
    parent.insertChild(index, node);
  }
  old.remove();
  return node;
}

async function sendSelection() {
  const sel = figma.currentPage.selection;
  if (sel.length === 0) {
    figma.ui.postMessage({ type: "selection", nodes: [] });
    return;
  }

  const nodes = sel.slice(0, 100).map((n) => ({
    id: n.id,
    name: n.name,
    detected: identify(n),
    w: "width" in n ? Math.round(n.width) : 0,
    h: "height" in n ? Math.round(n.height) : 0,
  }));

  // Export an SVG only for a single, unidentified node (for shape matching).
  let svg: Uint8Array | null = null;
  if (sel.length === 1 && !nodes[0].detected && "exportAsync" in sel[0]) {
    try {
      svg = await (sel[0] as SceneNode & ExportMixin).exportAsync({ format: "SVG" });
    } catch {
      svg = null;
    }
  }

  figma.ui.postMessage({ type: "selection", nodes, svg });
}

// ---------------------------------------------------------------------------
// Message handling
// ---------------------------------------------------------------------------

type UiMessage =
  | { type: "get-settings" }
  | { type: "set-settings"; settings: Settings }
  | { type: "get-selection" }
  | { type: "get-lists" }
  | { type: "set-lists"; lists: Lists }
  | { type: "insert-svg"; svg: string; meta: IconMeta; size: number }
  | { type: "replace-batch"; items: { id: string; svg: string; meta: IconMeta }[]; size: number }
  | { type: "resize"; width: number; height: number }
  | { type: "close" };

figma.ui.onmessage = async (msg: UiMessage) => {
  switch (msg.type) {
    case "get-settings": {
      const stored = (await figma.clientStorage.getAsync(SETTINGS_KEY)) as Settings | undefined;
      if (stored) settings = { ...settings, ...stored };
      figma.ui.postMessage({ type: "settings", settings });
      break;
    }

    case "set-settings":
      settings = { ...settings, ...msg.settings };
      await figma.clientStorage.setAsync(SETTINGS_KEY, settings);
      break;

    case "get-selection":
      await sendSelection();
      break;

    case "get-lists": {
      const lists = (await figma.clientStorage.getAsync(LISTS_KEY)) ?? { favorites: [], recents: [] };
      figma.ui.postMessage({ type: "lists", lists });
      break;
    }

    case "set-lists":
      await figma.clientStorage.setAsync(LISTS_KEY, msg.lists);
      break;

    case "insert-svg": {
      try {
        const node = figma.createNodeFromSvg(msg.svg);
        applyMeta(node, msg.meta);
        applyFrameProps(node, msg.size);
        placeAtCenter(node);
        figma.currentPage.selection = [node];
        figma.viewport.scrollAndZoomIntoView([node]);
        figma.notify(`Inserted “${msg.meta.name}”`);
      } catch (e) {
        figma.notify(`Couldn't insert icon: ${(e as Error).message}`, { error: true });
      }
      break;
    }

    case "replace-batch": {
      try {
        const items = new Map(msg.items.map((it) => [it.id, it]));
        const snapshot = figma.currentPage.selection.slice();
        const fresh: SceneNode[] = [];
        for (const old of snapshot) {
          const it = items.get(old.id);
          if (!it) continue;
          fresh.push(replaceNode(old, it.svg, it.meta, msg.size));
        }
        if (fresh.length) {
          figma.currentPage.selection = fresh;
          figma.notify(fresh.length === 1 ? `Swapped to “${msg.items[0].meta.name}”` : `Swapped ${fresh.length} icons`);
        }
      } catch (e) {
        figma.notify(`Couldn't swap: ${(e as Error).message}`, { error: true });
      }
      break;
    }

    case "resize": {
      const w = Math.min(900, Math.max(300, Math.round(msg.width)));
      const h = Math.min(900, Math.max(360, Math.round(msg.height)));
      figma.ui.resize(w, h);
      break;
    }

    case "close":
      figma.closePlugin();
      break;
  }
};

figma.on("selectionchange", () => {
  void sendSelection();
});
