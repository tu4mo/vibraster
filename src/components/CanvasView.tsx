import { clamp, useMergedRef, useWindowEvent } from "@mantine/hooks";
import { memo, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Rect } from "../editor/canvas.ts";
import type { Editor } from "../editor/Editor.ts";
import { useEditorVersion } from "../editor/useEditorVersion.ts";

export type Tool = "select" | "move" | "zoom";

/** Selection resize handles: corners and sides, named by compass direction. */
const HANDLES = ["nw", "n", "ne", "e", "se", "s", "sw", "w"] as const;
type Handle = (typeof HANDLES)[number];

/** Zoom at which the pixel grid appears (each image pixel is this many screen pixels). */
const PIXEL_GRID_MIN_ZOOM = 6;
/** Space kept around the image when it fits in the viewport. */
const PADDING = 32;
/** Extra room to scroll past the image edges once it overflows, as a share of the viewport. */
const OVERSCROLL = 0.25;

type Drag =
  | { kind: "select"; startX: number; startY: number }
  /** Select tool: drag the dotted outline only. */
  | { kind: "outline"; offsetX: number; offsetY: number }
  /** Move tool: drag the selected pixels. */
  | { kind: "move"; offsetX: number; offsetY: number }
  /** Select tool: drag a side or corner handle to resize the outline. */
  | { kind: "resize"; handle: Handle; start: Rect }
  /**
   * Move tool: drag a handle to scale the pixels. Flips are as at drag start;
   * `ratio` is the original pixels' aspect ratio, which Shift restores.
   */
  | { kind: "scale"; handle: Handle; start: Rect; flipX: boolean; flipY: boolean; ratio: number };

type Props = {
  editor: Editor;
  tool: Tool;
  zoom: number;
  /** Zoom tool click; the clicked point is kept under the cursor. */
  onZoom: (direction: 1 | -1) => void;
  /** The scrolling viewport, which the parent measures to fit the zoom. */
  ref?: React.Ref<HTMLDivElement>;
};

/**
 * The scrolling viewport with the image in it. The whole viewport is the
 * pointer surface, so a selection can start on the empty area around the image.
 * Memoized so hidden tabs' views skip the parent's re-renders.
 */
export const CanvasView = memo(function CanvasView({ editor, tool, zoom, onZoom, ref }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const mergedViewportRef = useMergedRef(viewportRef, ref);
  const drag = useRef<Drag | null>(null);
  /** Image point to keep under the cursor after a zoom tool click. */
  const zoomAnchor = useRef<{ imageX: number; imageY: number; clientX: number; clientY: number }>(
    null,
  );
  const altDown = useAltKey();
  const view = useClientSize(viewportRef);
  // The editor is mutated in place; subscribing re-renders on its changes.
  useEditorVersion(editor);

  // Selection-only changes don't touch pixels and skip the redraw.
  const pixelVersion = editor.pixelVersion;
  useEffect(() => {
    if (canvasRef.current) editor.render(canvasRef.current);
  }, [editor, pixelVersion]);

  // After a zoom tool click, scroll so the clicked point stays under the cursor.
  useLayoutEffect(() => {
    const anchor = zoomAnchor.current;
    const stage = stageRef.current;
    const viewport = viewportRef.current;
    zoomAnchor.current = null;
    if (!anchor || !stage || !viewport) return;
    const rect = stage.getBoundingClientRect();
    viewport.scrollLeft += rect.left + anchor.imageX * zoom - anchor.clientX;
    viewport.scrollTop += rect.top + anchor.imageY * zoom - anchor.clientY;
  }, [zoom]);

  /** Pointer position in image pixels (fractional, unclamped). */
  const toImage = (e: { clientX: number; clientY: number }) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: (e.clientX - rect.left) / zoom, y: (e.clientY - rect.top) / zoom };
  };

  const clampX = (x: number) => clamp(Math.round(x), 0, editor.width);
  const clampY = (y: number) => clamp(Math.round(y), 0, editor.height);

  /** The drag a press starts, or null when it starts none. */
  const startDrag = (e: React.PointerEvent, onEmptyArea: boolean): Drag | null => {
    const p = toImage(e);
    const sel = editor.selection;
    const handle = (e.target as HTMLElement).dataset.handle as Handle | undefined;
    const inside =
      sel && p.x >= sel.x && p.y >= sel.y && p.x <= sel.x + sel.w && p.y <= sel.y + sel.h;

    if (tool === "zoom") {
      if (onEmptyArea) {
        editor.setSelection(null);
      } else {
        zoomAnchor.current = { imageX: p.x, imageY: p.y, clientX: e.clientX, clientY: e.clientY };
        onZoom(e.altKey ? -1 : 1);
      }
      return null;
    }

    if (tool === "select") {
      if (sel && handle) return { kind: "resize", handle, start: sel };
      if (sel && inside) return { kind: "outline", offsetX: p.x - sel.x, offsetY: p.y - sel.y };
      editor.setSelection(null);
      return { kind: "select", startX: clampX(p.x), startY: clampY(p.y) };
    }

    // Move tool.
    if (sel && handle) {
      editor.beginMove();
      const f = editor.floating;
      if (!f) return null;
      const ratio = f.source.width / f.source.height;
      return { kind: "scale", handle, start: sel, flipX: f.flipX, flipY: f.flipY, ratio };
    }
    if (sel && inside) {
      editor.beginMove();
      return { kind: "move", offsetX: p.x - sel.x, offsetY: p.y - sel.y };
    }
    if (onEmptyArea) editor.setSelection(null);
    return null;
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const onEmptyArea = e.target === e.currentTarget;
    if (onEmptyArea && isOnScrollbar(e.currentTarget, e)) return;
    drag.current = startDrag(e, onEmptyArea);
    // Capture keeps the moves coming, and ends the drag, wherever the pointer
    // goes, even outside the browser window.
    if (drag.current) e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    // The button was released somewhere we did not hear about.
    if ((e.buttons & 1) === 0) {
      drag.current = null;
      return;
    }
    const p = toImage(e);
    if (d.kind === "select") {
      const x = clampX(p.x);
      const y = clampY(p.y);
      editor.setSelection({
        x: Math.min(x, d.startX),
        y: Math.min(y, d.startY),
        w: Math.abs(x - d.startX),
        h: Math.abs(y - d.startY),
      });
    } else if (d.kind === "outline" && editor.selection) {
      // Keep the whole outline inside the image so it never shrinks.
      const { w, h } = editor.selection;
      const x = clamp(Math.round(p.x - d.offsetX), 0, editor.width - w);
      const y = clamp(Math.round(p.y - d.offsetY), 0, editor.height - h);
      editor.setSelection({ x, y, w, h });
    } else if (d.kind === "resize") {
      // The outline stays inside the image.
      const bounds = { width: editor.width, height: editor.height };
      const ratio = e.shiftKey ? d.start.w / d.start.h : null;
      const result = resizeRect(d.handle, d.start, p, ratio, bounds);
      if (result) editor.setSelection(result.rect);
    } else if (d.kind === "scale") {
      // Pixels may extend past the image; crossing the opposite edge mirrors them.
      const result = resizeRect(d.handle, d.start, p, e.shiftKey ? d.ratio : null, null);
      if (result) {
        editor.transformFloating(result.rect, d.flipX !== result.flipX, d.flipY !== result.flipY);
      }
    } else if (d.kind === "move") {
      editor.moveFloatingTo(Math.round(p.x - d.offsetX), Math.round(p.y - d.offsetY));
    }
  };

  const sel = editor.selection;
  const stageWidth = editor.width * zoom;
  const stageHeight = editor.height * zoom;

  return (
    <div
      ref={mergedViewportRef}
      className="viewport"
      data-tool={tool}
      data-zoom-out={tool === "zoom" && altDown ? "" : undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onLostPointerCapture={() => (drag.current = null)}
      style={{
        paddingInline: padding(stageWidth, view.width),
        paddingBlock: padding(stageHeight, view.height),
      }}
    >
      <div ref={stageRef} className="stage" style={{ width: stageWidth, height: stageHeight }}>
        <canvas ref={canvasRef} className={zoom > 1 ? "pixelated" : undefined} />
        {zoom >= PIXEL_GRID_MIN_ZOOM && (
          <div className="pixel-grid" style={{ "--cell": `${zoom}px` } as React.CSSProperties} />
        )}
        {sel && (
          <div
            className="selection"
            style={{
              left: sel.x * zoom,
              top: sel.y * zoom,
              width: sel.w * zoom,
              height: sel.h * zoom,
            }}
          >
            {(tool === "select" || tool === "move") &&
              HANDLES.map((h) => <div key={h} className="handle" data-handle={h} />)}
          </div>
        )}
      </div>
    </div>
  );
});

/** Whether a press on `el` landed on its own scrollbar rather than its content. */
function isOnScrollbar(el: HTMLElement, e: { clientX: number; clientY: number }) {
  const rect = el.getBoundingClientRect();
  const x = e.clientX - rect.left - el.clientLeft;
  const y = e.clientY - rect.top - el.clientTop;
  return x >= el.clientWidth || y >= el.clientHeight;
}

type Bounds = { width: number; height: number };

/**
 * Resize `start` by dragging `handle` to `p`, keeping aspect `ratio` (width /
 * height) when given. Returns the new rect and whether it was dragged past its
 * opposite edge on each axis (flipped). With `bounds` the result stays inside
 * them; null when the result would be empty.
 */
function resizeRect(
  handle: Handle,
  start: Rect,
  p: { x: number; y: number },
  ratio: number | null,
  bounds: Bounds | null,
): { rect: Rect; flipX: boolean; flipY: boolean } | null {
  if (ratio) return resizeKeepingRatio(handle, start, p, ratio, bounds);

  const fit = (v: number, max: number) => (bounds ? clamp(Math.round(v), 0, max) : Math.round(v));
  // Move only the edges the handle controls.
  let x1 = start.x;
  let y1 = start.y;
  let x2 = start.x + start.w;
  let y2 = start.y + start.h;
  if (handle.includes("w")) x1 = fit(p.x, bounds?.width ?? 0);
  if (handle.includes("e")) x2 = fit(p.x, bounds?.width ?? 0);
  if (handle.includes("n")) y1 = fit(p.y, bounds?.height ?? 0);
  if (handle.includes("s")) y2 = fit(p.y, bounds?.height ?? 0);
  if (x1 === x2 || y1 === y2) return null;
  return {
    rect: { x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1) },
    flipX: x2 < x1,
    flipY: y2 < y1,
  };
}

/**
 * `resizeRect` at a fixed aspect `ratio`, which may differ from `start`'s.
 * Corners pivot on the opposite corner; sides scale the other axis around its
 * center. With `bounds` the result is shrunk to fit inside them.
 */
function resizeKeepingRatio(
  handle: Handle,
  start: Rect,
  p: { x: number; y: number },
  ratio: number,
  bounds: Bounds | null,
): { rect: Rect; flipX: boolean; flipY: boolean } | null {
  const dirX = handle.includes("e") ? 1 : handle.includes("w") ? -1 : 0;
  const dirY = handle.includes("s") ? 1 : handle.includes("n") ? -1 : 0;
  // Fixed point: the opposite edge on dragged axes, the center on the other.
  const ax = dirX === 1 ? start.x : dirX === -1 ? start.x + start.w : start.x + start.w / 2;
  const ay = dirY === 1 ? start.y : dirY === -1 ? start.y + start.h : start.y + start.h / 2;
  // Which side of the fixed point the result lies on (dragging past it flips).
  const sideX = dirX && (Math.sign(p.x - ax) || dirX);
  const sideY = dirY && (Math.sign(p.y - ay) || dirY);

  let w = Math.abs(p.x - ax);
  let h = Math.abs(p.y - ay);
  if (dirX && dirY) {
    if (w / ratio >= h) h = w / ratio;
    else w = h * ratio;
  } else if (dirX) {
    h = w / ratio;
  } else {
    w = h * ratio;
  }

  if (bounds) {
    const { width, height } = bounds;
    const maxW = sideX > 0 ? width - ax : sideX < 0 ? ax : 2 * Math.min(ax, width - ax);
    const maxH = sideY > 0 ? height - ay : sideY < 0 ? ay : 2 * Math.min(ay, height - ay);
    const scale = Math.min(1, maxW / w, maxH / h);
    w *= scale;
    h *= scale;
  }
  w = Math.round(w);
  h = Math.round(h);
  if (w < 1 || h < 1) return null;

  const x = sideX > 0 ? ax : sideX < 0 ? ax - w : ax - w / 2;
  const y = sideY > 0 ? ay : sideY < 0 ? ay - h : ay - h / 2;
  return {
    rect: { x: Math.round(x), y: Math.round(y), w, h },
    flipX: dirX !== 0 && sideX !== dirX,
    flipY: dirY !== 0 && sideY !== dirY,
  };
}

/** Tracks whether Option/Alt is held, for the zoom-out cursor. */
/**
 * Padding on each side of an image `size` px long in a viewport `view` px
 * long. The extra overscroll grows with the overflow, so an image that just
 * fits gets no scrollbar and zooming past that never jumps.
 */
function padding(size: number, view: number) {
  return PADDING + clamp(size + 2 * PADDING - view, 0, view * OVERSCROLL);
}

/** The element's size inside its borders, padding included, scrollbars not. */
function useClientSize(ref: React.RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Padding changes also resize the observed box; keep the same size then.
    const measure = () =>
      setSize((s) =>
        s.width === el.clientWidth && s.height === el.clientHeight
          ? s
          : { width: el.clientWidth, height: el.clientHeight },
      );
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return size;
}

function useAltKey() {
  const [down, setDown] = useState(false);
  useWindowEvent("keydown", (e) => setDown(e.altKey));
  useWindowEvent("keyup", (e) => setDown(e.altKey));
  useWindowEvent("blur", () => setDown(false));
  return down;
}
