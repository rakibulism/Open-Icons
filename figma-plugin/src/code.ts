/**
 * Open Icons — Figma plugin controller (sandbox).
 *
 * The sandbox has no network access, so the UI iframe does all fetching and
 * hands us finished SVG markup to insert. We also:
 *  - stamp every inserted icon with pluginData (set/name/variant) so a later
 *    selection can be identified exactly ("which pack is this icon?");
 *  - watch selection changes and report back what's selected (the stamped
 *    identity if present, otherwise the layer name + an SVG preview for a
 *    name-based guess);
 *  - swap the selected icon for another pack's version in place.
 */

const STORAGE_KEY = "open-icons:data-url";
const LISTS_KEY = "open-icons:lists"; // { favorites, recents }
const DATA_KEY = "openIcons"; // pluginData namespace on inserted nodes

figma.showUI(__html__, { width: 380, height: 600, themeColors: true });

type IconMeta = { set: string; name: string; variant: string };

type Lists = { favorites: unknown[]; recents: unknown[] };

type UiMessage =
  | { type: "get-config" }
  | { type: "set-config"; dataUrl: string }
  | { type: "get-selection" }
  | { type: "get-lists" }
  | { type: "set-lists"; lists: Lists }
  | { type: "insert-svg"; svg: string; meta: IconMeta }
  | { type: "replace-svg"; svg: string; meta: IconMeta }
  | { type: "resize"; height: number }
  | { type: "close" };

function placeAtCenter(node: SceneNode) {
  if ("width" in node) {
    node.x = Math.round(figma.viewport.center.x - node.width / 2);
    node.y = Math.round(figma.viewport.center.y - node.height / 2);
  }
}

function stamp(node: BaseNode, meta: IconMeta) {
  node.setPluginData(DATA_KEY, JSON.stringify(meta));
}

async function sendSelection() {
  const sel = figma.currentPage.selection;
  if (sel.length !== 1) {
    figma.ui.postMessage({ type: "selection", node: null });
    return;
  }
  const node = sel[0];

  let detected: IconMeta | null = null;
  const raw = node.getPluginData(DATA_KEY);
  if (raw) {
    try {
      detected = JSON.parse(raw) as IconMeta;
    } catch {
      detected = null;
    }
  }

  // For un-stamped nodes, export an SVG preview so the UI can show what's
  // selected and offer name-based guesses.
  let svg: Uint8Array | null = null;
  if (!detected && "exportAsync" in node) {
    try {
      svg = await (node as SceneNode & ExportMixin).exportAsync({ format: "SVG" });
    } catch {
      svg = null;
    }
  }

  figma.ui.postMessage({
    type: "selection",
    node: { name: node.name, nodeType: node.type, detected },
    svg,
  });
}

figma.ui.onmessage = async (msg: UiMessage) => {
  switch (msg.type) {
    case "get-config": {
      const dataUrl = (await figma.clientStorage.getAsync(STORAGE_KEY)) ?? null;
      figma.ui.postMessage({ type: "config", dataUrl });
      break;
    }

    case "set-config":
      await figma.clientStorage.setAsync(STORAGE_KEY, msg.dataUrl);
      break;

    case "get-selection":
      await sendSelection();
      break;

    case "get-lists": {
      const lists = (await figma.clientStorage.getAsync(LISTS_KEY)) ?? {
        favorites: [],
        recents: [],
      };
      figma.ui.postMessage({ type: "lists", lists });
      break;
    }

    case "set-lists":
      await figma.clientStorage.setAsync(LISTS_KEY, msg.lists);
      break;

    case "insert-svg": {
      try {
        const node = figma.createNodeFromSvg(msg.svg);
        node.name = msg.meta.name;
        stamp(node, msg.meta);
        placeAtCenter(node);
        figma.currentPage.selection = [node];
        figma.viewport.scrollAndZoomIntoView([node]);
        figma.notify(`Inserted “${msg.meta.name}”`);
      } catch (e) {
        figma.notify(`Couldn't insert icon: ${(e as Error).message}`, { error: true });
      }
      break;
    }

    case "replace-svg": {
      try {
        const sel = figma.currentPage.selection;
        const old = sel.length === 1 ? sel[0] : null;
        const node = figma.createNodeFromSvg(msg.svg);
        node.name = msg.meta.name;
        stamp(node, msg.meta);

        if (old && old.parent) {
          // Match the old node's footprint and slot, then remove it.
          node.x = old.x;
          node.y = old.y;
          if ("width" in old && "resize" in node) {
            node.resize(old.width, old.height);
          }
          const index = old.parent.children.indexOf(old);
          old.parent.insertChild(index, node);
          old.remove();
        } else {
          placeAtCenter(node);
        }
        figma.currentPage.selection = [node];
        figma.notify(`Swapped to “${msg.meta.name}”`);
      } catch (e) {
        figma.notify(`Couldn't swap icon: ${(e as Error).message}`, { error: true });
      }
      break;
    }

    case "resize":
      figma.ui.resize(380, Math.max(360, Math.round(msg.height)));
      break;

    case "close":
      figma.closePlugin();
      break;
  }
};

figma.on("selectionchange", () => {
  void sendSelection();
});
void sendSelection();
