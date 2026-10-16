import { useEffect, useRef, useState } from "react";
import type { Rect } from "../editor/canvas.ts";
import type { Editor } from "../editor/Editor.ts";

export type Tool = "select" | "move" | "zoom";

/** Selection resize handles: corners and sides, named by compass direction. */
const HANDLES = ["nw", "n", "ne", "e", "se", "s", "sw", "w"] as const;
type Handle = (typeof HANDLES)[number];

/** Zoom at which the pixel grid appears (each image pixel is this many screen pixels). */
const PIXEL_GRID_MIN_ZOOM = 6;

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
  version: number;
  tool: Tool;
  zoom: number;
  /** Fills the gap left behind when moving pixels. */
  background: string;
  onZoomAt: (
    direction: 1 | -1,
    imageX: number,
    imageY: number,
    clientX: number,
    clientY: number,
  ) => void;
};

export function CanvasView({ editor, version, tool, zoom, background, onZoomAt }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const altDown = useAltKey();

  useEffect(() => {
    if (canvasRef.current) editor.render(canvasRef.current);
  }, [editor, version]);

  /** Pointer position in image pixels (fractional, unclamped). */
  const toImage = (e: { clientX: number; clientY: number }) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: (e.clientX - rect.left) / zoom, y: (e.clientY - rect.top) / zoom };
  };

  const clampX = (x: number) => Math.min(editor.width, Math.max(0, Math.round(x)));
  const clampY = (y: number) => Math.min(editor.height, Math.max(0, Math.round(y)));

  const onDragMove = (e: PointerEvent) => {
    const d = drag.current;
    if (!d) return;
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
      const x = Math.min(editor.width - w, Math.max(0, Math.round(p.x - d.offsetX)));
      const y = Math.min(editor.height - h, Math.max(0, Math.round(p.y - d.offsetY)));
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

  const onPointerDown = (e: PointerEvent | React.PointerEvent) => {
    if (e.button !== 0) return;
    const p = toImage(e);
    if (tool === "zoom") {
      onZoomAt(e.altKey ? -1 : 1, p.x, p.y, e.clientX, e.clientY);
      return;
    }
    const sel = editor.selection;
    const insideSelection =
      sel && p.x >= sel.x && p.y >= sel.y && p.x <= sel.x + sel.w && p.y <= sel.y + sel.h;
    const handle = (e.target as HTMLElement).dataset.handle as Handle | undefined;
    if (tool === "select" && sel && handle) {
      drag.current = { kind: "resize", handle, start: sel };
    } else if (tool === "move" && sel && handle) {
      editor.beginMove(background);
      const f = editor.floating;
      if (!f) return;
      const ratio = f.source.width / f.source.height;
      drag.current = { kind: "scale", handle, start: sel, flipX: f.flipX, flipY: f.flipY, ratio };
    } else if (tool === "select" && sel && insideSelection) {
      drag.current = { kind: "outline", offsetX: p.x - sel.x, offsetY: p.y - sel.y };
    } else if (tool === "select") {
      drag.current = { kind: "select", startX: clampX(p.x), startY: clampY(p.y) };
      editor.setSelection(null);
    } else if (sel && insideSelection) {
      editor.beginMove(background);
      drag.current = { kind: "move", offsetX: p.x - sel.x, offsetY: p.y - sel.y };
    } else {
      return;
    }
    // Follow the drag on window so it keeps working (and always ends) when
    // the pointer leaves the canvas, or even the browser window.
    const pointerId = e.pointerId;
    const move = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      // The button was released somewhere we did not hear about.
      if ((ev.buttons & 1) === 0) end();
      else onDragMove(ev);
    };
    const end = () => {
      drag.current = null;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      window.removeEventListener("blur", end);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    window.addEventListener("blur", end);
    (e.currentTarget as Element).setPointerCapture(pointerId);
  };

  // The select tool can also start a selection on the empty area around the
  // image; the selection is clamped to the image as it is dragged.
  const latestPointerDown = useRef(onPointerDown);
  useEffect(() => {
    latestPointerDown.current = onPointerDown;
  });
  useEffect(() => {
    const area = stageRef.current?.parentElement;
    if (!area || tool !== "select") return;
    const down = (e: PointerEvent) => {
      if (e.target !== area) return;
      // Ignore presses on the area's own scrollbars.
      const rect = area.getBoundingClientRect();
      const x = e.clientX - rect.left - area.clientLeft;
      const y = e.clientY - rect.top - area.clientTop;
      if (x >= area.clientWidth || y >= area.clientHeight) return;
      latestPointerDown.current(e);
    };
    area.addEventListener("pointerdown", down);
    return () => area.removeEventListener("pointerdown", down);
  }, [tool]);

  const sel = editor.selection;

  return (
    <div
      ref={stageRef}
      className="stage"
      data-tool={tool}
      data-zoom-out={tool === "zoom" && altDown ? "" : undefined}
      style={{ width: editor.width * zoom, height: editor.height * zoom }}
      onPointerDown={onPointerDown}
    >
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
  );
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

  const clamp = (v: number, max: number) =>
    bounds ? Math.min(max, Math.max(0, Math.round(v))) : Math.round(v);
  // Move only the edges the handle controls.
  let x1 = start.x;
  let y1 = start.y;
  let x2 = start.x + start.w;
  let y2 = start.y + start.h;
  if (handle.includes("w")) x1 = clamp(p.x, bounds?.width ?? 0);
  if (handle.includes("e")) x2 = clamp(p.x, bounds?.width ?? 0);
  if (handle.includes("n")) y1 = clamp(p.y, bounds?.height ?? 0);
  if (handle.includes("s")) y2 = clamp(p.y, bounds?.height ?? 0);
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
function useAltKey() {
  const [down, setDown] = useState(false);
  useEffect(() => {
    const update = (e: KeyboardEvent) => setDown(e.altKey);
    const reset = () => setDown(false);
    window.addEventListener("keydown", update);
    window.addEventListener("keyup", update);
    window.addEventListener("blur", reset);
    return () => {
      window.removeEventListener("keydown", update);
      window.removeEventListener("keyup", update);
      window.removeEventListener("blur", reset);
    };
  }, []);
  return down;
}
