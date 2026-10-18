import { Stack } from "@mantine/core";
import { type Icon, IconArrowsMove, IconMarquee2, IconZoomIn } from "@tabler/icons-react";

import type { Tool } from "./tool.ts";
import { ToolbarButton } from "./ToolbarButton.tsx";

const TOOLS: { value: Tool; label: string; shortcut: string; icon: Icon }[] = [
  { value: "select", label: "Rectangle select", shortcut: "M", icon: IconMarquee2 },
  { value: "move", label: "Move selection", shortcut: "V", icon: IconArrowsMove },
  { value: "zoom", label: "Zoom (⌥-click to zoom out)", shortcut: "Z", icon: IconZoomIn },
];

type Props = {
  tool: Tool;
  onToolChange: (tool: Tool) => void;
  /** All tools are disabled without one. */
  hasImage: boolean;
  /** The move tool is disabled without one. */
  hasSelection: boolean;
};

/** One button per tool, as a radio group. */
export function ToolButtons({ tool, onToolChange, hasImage, hasSelection }: Props) {
  return (
    <Stack gap={4} role="radiogroup" aria-label="Tools">
      {TOOLS.map(({ value, label, shortcut, icon }) => (
        <ToolbarButton
          key={value}
          label={label}
          shortcut={shortcut}
          icon={icon}
          checked={tool === value}
          disabled={!hasImage || (value === "move" && !hasSelection)}
          onClick={() => onToolChange(value)}
        />
      ))}
    </Stack>
  );
}
