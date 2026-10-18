import { Center, FloatingWindow, Stack } from "@mantine/core";
import { type SetFloatingWindowPosition, clamp } from "@mantine/hooks";
import { IconGripHorizontal } from "@tabler/icons-react";
import { useLayoutEffect, useRef } from "react";

import { useEdgeAnchor } from "./useEdgeAnchor.ts";

/** Gap kept between the toolbar and the window, tabs and status bar. */
const MARGIN = 8;

type Props = {
  /** The tools and actions, stacked top to bottom. */
  children: React.ReactNode;
  /** Height covered at the top of the window (the tabs), which the toolbar stays below. */
  top: number;
  /** Height covered at the bottom (status bar), which the toolbar stays above. */
  bottom: number;
};

/**
 * Move the toolbar `el`, whose top is at `y`, back below `minTop` and above
 * the `bottom` covered height if it is outside.
 */
function keepInBounds(
  el: HTMLElement,
  y: number,
  minTop: number,
  bottom: number,
  setPosition: SetFloatingWindowPosition | null,
) {
  const max = window.innerHeight - bottom - MARGIN - el.offsetHeight;
  const clamped = clamp(y, minTop, max);
  if (clamped !== y) setPosition?.({ top: clamped });
}

/** The floating tools and actions; drag it by the grip at the top. */
export function Toolbar({ children, top, bottom }: Props) {
  const toolbar = useRef<HTMLDivElement>(null);
  const setPosition = useRef<SetFloatingWindowPosition>(null);
  const minTop = top + MARGIN;

  // FloatingWindow only keeps the toolbar inside the browser window; also keep
  // it off the tabs and status bar. This runs in the same drag step
  // that moved it, before paint, so the correction never shows. Setting the
  // position calls back here once more, with nothing left to correct.
  const onPositionChange = ({ y }: { y: number }) => {
    if (toolbar.current) {
      keepInBounds(toolbar.current, y, minTop, bottom, setPosition.current);
    }
  };

  // `top` can grow after the toolbar opens (the tab strip is measured later);
  // push the toolbar down off it.
  useLayoutEffect(() => {
    const el = toolbar.current;
    if (el) {
      keepInBounds(el, el.getBoundingClientRect().top, minTop, bottom, setPosition.current);
    }
  }, [minTop, bottom]);

  // FloatingWindow only clamps while dragging, so a resizing window could leave
  // the toolbar off-screen; keep it on the edges it was dropped nearest.
  const { onDragEnd } = useEdgeAnchor(toolbar, setPosition);

  return (
    <FloatingWindow
      withBorder
      shadow="md"
      radius="md"
      p={8}
      ref={toolbar}
      initialPosition={{ top: minTop, left: 0 }}
      constrainToViewport
      constrainOffset={MARGIN}
      onPositionChange={onPositionChange}
      onDragEnd={onDragEnd}
      setPositionRef={setPosition}
      dragHandleSelector=".toolbar-grip"
      // Above the app shell (100) but below modals (200) and popovers/tooltips (300).
      zIndex={150}
      aria-label="Toolbar"
    >
      <Stack gap={4} align="center">
        <Center className="toolbar-grip" w={34} h={12} aria-hidden>
          <IconGripHorizontal size={14} />
        </Center>
        {children}
      </Stack>
    </FloatingWindow>
  );
}
