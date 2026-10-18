import { clamp } from "@mantine/hooks";
import type { Rect } from "../../editor/canvas.ts";

/** Selection resize handles: corners and sides, named by compass direction. */
export const HANDLES = ["nw", "n", "ne", "e", "se", "s", "sw", "w"] as const;
export type Handle = (typeof HANDLES)[number];

export const isHandle = (value: unknown): value is Handle =>
  (HANDLES as readonly unknown[]).includes(value);

type Bounds = { width: number; height: number };

/**
 * Resize `start` by dragging `handle` to `p`, keeping aspect `ratio` (width /
 * height) when given. Returns the new rect and whether it was dragged past its
 * opposite edge on each axis (flipped). With `bounds` the result stays inside
 * them; null when the result would be empty.
 */
export function resizeRect(
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
