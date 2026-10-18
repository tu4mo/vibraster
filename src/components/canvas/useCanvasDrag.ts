import { clamp } from "@mantine/hooks";
import { useRef } from "react";
import type { Rect } from "../../editor/canvas.ts";
import type { Editor } from "../../editor/Editor.ts";
import type { Tool } from "../tools/tool.ts";
import { type Handle, isHandle, resizeRect } from "./resizeRect.ts";

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

type Point = { x: number; y: number };

type Options = {
  editor: Editor;
  tool: Tool;
  zoom: number;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  /** Zoom tool click at image point `p`. */
  onZoomClick: (p: Point, e: React.PointerEvent) => void;
};

/**
 * Pointer handlers for the viewport: selecting, moving and resizing the
 * selection, moving and scaling its pixels, and zoom tool clicks.
 * Double-clicking the image where nothing is selected selects all.
 */
export function useCanvasDrag({ editor, tool, zoom, canvasRef, onZoomClick }: Options) {
  const drag = useRef<Drag | null>(null);

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
    const handleName = e.target instanceof HTMLElement ? e.target.dataset.handle : undefined;
    const handle = isHandle(handleName) ? handleName : undefined;
    const inside =
      sel && p.x >= sel.x && p.y >= sel.y && p.x <= sel.x + sel.w && p.y <= sel.y + sel.h;

    if (tool === "zoom") {
      if (onEmptyArea) editor.setSelection(null);
      else onZoomClick(p, e);
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

  const onLostPointerCapture = () => {
    drag.current = null;
  };

  const onDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // The zoom tool zooms on each click instead.
    if (tool === "zoom" || editor.selection) return;
    const p = toImage(e);
    if (p.x >= 0 && p.y >= 0 && p.x <= editor.width && p.y <= editor.height) editor.selectAll();
  };

  return { onPointerDown, onPointerMove, onLostPointerCapture, onDoubleClick };
}

/** Whether a press on `el` landed on its own scrollbar rather than its content. */
function isOnScrollbar(el: HTMLElement, e: { clientX: number; clientY: number }) {
  const rect = el.getBoundingClientRect();
  const x = e.clientX - rect.left - el.clientLeft;
  const y = e.clientY - rect.top - el.clientTop;
  return x >= el.clientWidth || y >= el.clientHeight;
}
