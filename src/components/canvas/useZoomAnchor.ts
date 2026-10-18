import { useLayoutEffect, useRef } from "react";

type Point = { x: number; y: number };
type Anchor = { imageX: number; imageY: number; clientX: number; clientY: number };
type Size = { width: number; height: number };

/**
 * Keeps an image point in place across a zoom change. Call the returned
 * `setAnchor` with the point under the cursor before changing the zoom; once
 * the stage re-renders at the new zoom, the viewport scrolls to put it back.
 * Zoom changes without an anchor (zoom buttons, shortcuts) keep the point at
 * the center of the viewport instead. Attach `onScroll` to the viewport.
 */
export function useZoomAnchor(
  zoom: number,
  view: Size,
  stageRef: React.RefObject<HTMLElement | null>,
  viewportRef: React.RefObject<HTMLElement | null>,
) {
  const anchor = useRef<Anchor>(null);
  /** The image point at the viewport center, kept up to date for the next zoom. */
  const center = useRef<Point>(null);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    const viewport = viewportRef.current;
    if (!stage || !viewport) return;
    const a = anchor.current ?? centerAnchor(center.current, viewport);
    anchor.current = null;
    if (a) {
      const rect = stage.getBoundingClientRect();
      viewport.scrollLeft += rect.left + a.imageX * zoom - a.clientX;
      viewport.scrollTop += rect.top + a.imageY * zoom - a.clientY;
    }
    center.current = imageCenter(stage, viewport, zoom);
  }, [zoom, stageRef, viewportRef]);

  // A resize (or a hidden tab being shown) moves the center.
  useLayoutEffect(() => {
    if (stageRef.current && viewportRef.current) {
      center.current = imageCenter(stageRef.current, viewportRef.current, zoom);
    }
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- remeasure when the viewport resizes
  }, [view.width, view.height, zoom, stageRef, viewportRef]);

  const setAnchor = (next: Anchor) => {
    anchor.current = next;
  };

  const onScroll = () => {
    if (stageRef.current && viewportRef.current) {
      center.current = imageCenter(stageRef.current, viewportRef.current, zoom);
    }
  };

  return { setAnchor, onScroll };
}

/** The center of the viewport's visible content area, in client coordinates. */
function viewportCenter(viewport: HTMLElement): Point {
  const rect = viewport.getBoundingClientRect();
  return {
    x: rect.left + viewport.clientLeft + viewport.clientWidth / 2,
    y: rect.top + viewport.clientTop + viewport.clientHeight / 2,
  };
}

/** The image point shown at the viewport center. */
function imageCenter(stage: HTMLElement, viewport: HTMLElement, zoom: number): Point {
  const rect = stage.getBoundingClientRect();
  const c = viewportCenter(viewport);
  return { x: (c.x - rect.left) / zoom, y: (c.y - rect.top) / zoom };
}

/** An anchor that puts the image `point` back at the viewport center. */
function centerAnchor(point: Point | null, viewport: HTMLElement): Anchor | null {
  if (!point) return null;
  const c = viewportCenter(viewport);
  return { imageX: point.x, imageY: point.y, clientX: c.x, clientY: c.y };
}
