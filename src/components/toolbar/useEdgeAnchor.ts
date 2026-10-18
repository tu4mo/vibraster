import { type SetFloatingWindowPosition, useWindowEvent } from "@mantine/hooks";
import { useRef } from "react";

/** The window edges a floating element sticks to, and its distance from each. */
type Anchor = {
  x: { left: number } | { right: number };
  y: { top: number } | { bottom: number };
};

/**
 * Keep a floating window stuck to the window edges nearest where it was last
 * dropped, so it follows them when the window resizes. Until the first drag
 * it keeps its distance from the top left. Pass the returned `onDragEnd` to
 * the FloatingWindow.
 */
export function useEdgeAnchor(
  ref: React.RefObject<HTMLElement | null>,
  setPosition: React.RefObject<SetFloatingWindowPosition | null>,
) {
  const anchor = useRef<Anchor>(null);

  const onDragEnd = () => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const right = window.innerWidth - rect.right;
    const bottom = window.innerHeight - rect.bottom;
    anchor.current = {
      x: rect.left <= right ? { left: rect.left } : { right },
      y: rect.top <= bottom ? { top: rect.top } : { bottom },
    };
  };

  // setPosition clamps to the window, so a window too small for the distance
  // only pulls the element inside; the distance itself is kept for later.
  useWindowEvent("resize", () => {
    const el = ref.current;
    if (!el) return;
    const { left, top } = el.getBoundingClientRect();
    const { x, y } = anchor.current ?? { x: { left }, y: { top } };
    setPosition.current?.({ ...x, ...y });
  });

  return { onDragEnd };
}
