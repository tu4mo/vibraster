import { ActionIcon, Button, Group } from "@mantine/core";
import { IconMinus, IconPlus, IconZoomScan } from "@tabler/icons-react";

import { Tip } from "../ui/Tip.tsx";

type Props = {
  zoom: number;
  disabled: boolean;
  onZoomBy: (direction: 1 | -1) => void;
  onActualSize: () => void;
  onFit: () => void;
};

/** Zoom out, the zoom level (click for actual size), zoom in, and fit to window. */
export function ZoomControls({ zoom, disabled, onZoomBy, onActualSize, onFit }: Props) {
  return (
    <Group gap={2} wrap="nowrap" ml="auto">
      <Tip label="Zoom out" shortcut="⌘−" position="top">
        <ActionIcon
          size="sm"
          variant="subtle"
          color="gray"
          aria-label="Zoom out"
          onClick={() => onZoomBy(-1)}
          disabled={disabled}
        >
          <IconMinus size={14} />
        </ActionIcon>
      </Tip>
      <Tip label="Actual size" position="top">
        <Button
          variant="subtle"
          color="gray"
          size="compact-xs"
          w={56}
          onClick={onActualSize}
          disabled={disabled}
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {Math.round(zoom * 100)}%
        </Button>
      </Tip>
      <Tip label="Zoom in" shortcut="⌘=" position="top">
        <ActionIcon
          size="sm"
          variant="subtle"
          color="gray"
          aria-label="Zoom in"
          onClick={() => onZoomBy(1)}
          disabled={disabled}
        >
          <IconPlus size={14} />
        </ActionIcon>
      </Tip>
      <Tip label="Fit to window" shortcut="⌘0" position="top">
        <ActionIcon
          size="sm"
          variant="subtle"
          color="gray"
          aria-label="Fit to window"
          onClick={onFit}
          disabled={disabled}
        >
          <IconZoomScan size={14} />
        </ActionIcon>
      </Tip>
    </Group>
  );
}
