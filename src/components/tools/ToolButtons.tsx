import { ActionIcon, Stack } from "@mantine/core";
import { IconArrowsMove, IconMarquee2, IconZoomIn } from "@tabler/icons-react";

import { TOOLBAR_ICON } from "../toolbar/toolbarIcon.ts";
import { Tip } from "../ui/Tip.tsx";
import type { Tool } from "./tool.ts";

const TOOLS: { value: Tool; label: string; shortcut: string; icon: typeof IconMarquee2 }[] = [
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
      {TOOLS.map(({ value, label, shortcut, icon: Icon }) => (
        <Tip key={value} label={label} shortcut={shortcut} position="right">
          <ActionIcon
            size="lg"
            variant={tool === value ? "filled" : "subtle"}
            color={tool === value ? "blue" : "gray"}
            role="radio"
            aria-checked={tool === value}
            aria-label={label}
            disabled={!hasImage || (value === "move" && !hasSelection)}
            onClick={() => onToolChange(value)}
          >
            <Icon {...TOOLBAR_ICON} />
          </ActionIcon>
        </Tip>
      ))}
    </Stack>
  );
}
