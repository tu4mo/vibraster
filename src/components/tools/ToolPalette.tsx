import { Center, FloatingWindow, Stack } from "@mantine/core";
import { type SetFloatingWindowPosition, clamp } from "@mantine/hooks";
import { IconGripHorizontal } from "@tabler/icons-react";
import { useLayoutEffect, useRef } from "react";
import { ToolButtons } from "./ToolButtons.tsx";
import type { Tool } from "./tool.ts";

/** Gap kept between the palette and the window, header and status bar. */
const MARGIN = 8;

type Props = {
  tool: Tool;
  onToolChange: (tool: Tool) => void;
  /** The move tool is disabled without one. */
  hasSelection: boolean;
  /** Height covered at the top of the window (header and tabs), which the palette stays below. */
  top: number;
  /** Height covered at the bottom (status bar), which the palette stays above. */
  bottom: number;
};

/**
 * Move the palette `el`, whose top is at `y`, back below `minTop` and above
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

/** The floating tools; drag it by the grip at the top. */
export function ToolPalette({ tool, onToolChange, hasSelection, top, bottom }: Props) {
  const palette = useRef<HTMLDivElement>(null);
  const setPosition = useRef<SetFloatingWindowPosition>(null);
  const minTop = top + MARGIN;

  // FloatingWindow only keeps the palette inside the browser window; also keep
  // it off the header, tabs and status bar. This runs in the same drag step
  // that moved it, before paint, so the correction never shows. Setting the
  // position calls back here once more, with nothing left to correct.
  const onPositionChange = ({ y }: { y: number }) => {
    if (palette.current) {
      keepInBounds(palette.current, y, minTop, bottom, setPosition.current);
    }
  };

  // `top` can grow after the palette opens (the tab strip is measured later);
  // push the palette down off it.
  useLayoutEffect(() => {
    const el = palette.current;
    if (el) {
      keepInBounds(el, el.getBoundingClientRect().top, minTop, bottom, setPosition.current);
    }
  }, [minTop, bottom]);

  return (
    <FloatingWindow
      withBorder
      shadow="md"
      radius="md"
      p={8}
      ref={palette}
      initialPosition={{ top: minTop, left: 0 }}
      constrainToViewport
      constrainOffset={MARGIN}
      onPositionChange={onPositionChange}
      setPositionRef={setPosition}
      dragHandleSelector=".palette-grip"
      // Above the app shell (100) but below modals (200) and popovers/tooltips (300).
      zIndex={150}
      aria-label="Tools"
    >
      <Stack gap={4} align="center">
        <Center className="palette-grip" w={34} h={12} aria-hidden>
          <IconGripHorizontal size={14} />
        </Center>
        <ToolButtons tool={tool} onToolChange={onToolChange} hasSelection={hasSelection} />
      </Stack>
    </FloatingWindow>
  );
}
