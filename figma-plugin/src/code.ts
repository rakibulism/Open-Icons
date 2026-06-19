/**
 * Open Icons — Figma plugin controller (sandbox).
 *
 * The sandbox has no network access, so the UI iframe does all fetching and
 * hands us finished SVG markup to insert. We also proxy clientStorage so the
 * UI can persist the data-source URL.
 */

const STORAGE_KEY = "open-icons:data-url";

figma.showUI(__html__, { width: 380, height: 560, themeColors: true });

type UiMessage =
  | { type: "get-config" }
  | { type: "set-config"; dataUrl: string }
  | { type: "insert-svg"; svg: string; name: string }
  | { type: "resize"; height: number }
  | { type: "close" };

figma.ui.onmessage = async (msg: UiMessage) => {
  switch (msg.type) {
    case "get-config": {
      const dataUrl = (await figma.clientStorage.getAsync(STORAGE_KEY)) ?? null;
      figma.ui.postMessage({ type: "config", dataUrl });
      break;
    }

    case "set-config": {
      await figma.clientStorage.setAsync(STORAGE_KEY, msg.dataUrl);
      break;
    }

    case "insert-svg": {
      try {
        const node = figma.createNodeFromSvg(msg.svg);
        node.name = msg.name;
        // Place near the viewport center, then select + reveal.
        node.x = Math.round(figma.viewport.center.x - node.width / 2);
        node.y = Math.round(figma.viewport.center.y - node.height / 2);
        figma.currentPage.selection = [node];
        figma.viewport.scrollAndZoomIntoView([node]);
        figma.notify(`Inserted “${msg.name}”`);
      } catch (e) {
        figma.notify(`Couldn't insert icon: ${(e as Error).message}`, { error: true });
      }
      break;
    }

    case "resize":
      figma.ui.resize(380, Math.max(320, Math.round(msg.height)));
      break;

    case "close":
      figma.closePlugin();
      break;
  }
};
