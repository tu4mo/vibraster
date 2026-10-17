import { useLayoutEffect, useRef } from "react";

type Anchor = { imageX: number; imageY: number; clientX: number; clientY: number };

/**
 * Keeps an image point under the cursor across a zoom change. Call the
 * returned function with the point before changing the zoom; once the stage
 * re-renders at the new zoom, the viewport scrolls to put it back.
 */
export function useZoomAnchor(
  zoom: number,
  stageRef: React.RefObject<HTMLElement | null>,
  viewportRef: React.RefObject<HTMLElement | null>,
) {
  const anchor = useRef<Anchor>(null);

  useLayoutEffect(() => {
    const a = anchor.current;
    const stage = stageRef.current;
    const viewport = viewportRef.current;
    anchor.current = null;
    if (!a || !stage || !viewport) return;
    const rect = stage.getBoundingClientRect();
    viewport.scrollLeft += rect.left + a.imageX * zoom - a.clientX;
    viewport.scrollTop += rect.top + a.imageY * zoom - a.clientY;
  }, [zoom, stageRef, viewportRef]);

  return (next: Anchor) => {
    anchor.current = next;
  };
}
