import { type SetStateAction, useRef } from "react";

import type { Editor } from "../editor/Editor.ts";

const ZOOM_STEPS = [0.05, 0.1, 0.25, 1 / 3, 0.5, 2 / 3, 1, 1.5, 2, 3, 4, 6, 8, 12, 16, 24, 32];
/** Space kept around an image fitted to the viewport. */
const FIT_PADDING = 64;

/**
 * Zoom stepping and fitting for the active image. Attach `viewport` to the
 * element the image is shown in; fitting measures it.
 */
export function useZoom(editor: Editor, setZoom: (zoom: SetStateAction<number>) => void) {
  const viewport = useRef<HTMLDivElement>(null);

  /** Zoom that fits an image of this size (default: the open one) in the viewport. */
  const fitZoom = (width?: number, height?: number) => {
    const w = width ?? editor.width;
    const h = height ?? editor.height;
    const el = viewport.current;
    if (!el || !w || !h) return 1;
    return Math.min(1, (el.clientWidth - FIT_PADDING) / w, (el.clientHeight - FIT_PADDING) / h);
  };

  /** Step to the next zoom level in or out. */
  const zoomBy = (direction: 1 | -1) => {
    setZoom((z) =>
      direction > 0
        ? (ZOOM_STEPS.find((s) => s > z + 1e-6) ?? z)
        : (ZOOM_STEPS.findLast((s) => s < z - 1e-6) ?? z),
    );
  };

  const zoomToFit = () => setZoom(fitZoom());

  return { viewport, fitZoom, zoomBy, zoomToFit };
}
