import { ActionIcon, Stack } from "@mantine/core";
import { IconArrowsMove, IconMarquee2, IconZoomIn } from "@tabler/icons-react";
import { Tip } from "../ui/Tip.tsx";
import type { Tool } from "./tool.ts";

const ICON = { size: 18, stroke: 1.75 };

const TOOLS: { value: Tool; label: string; shortcut: string; icon: typeof IconMarquee2 }[] = [
  { value: "select", label: "Rectangle select", shortcut: "M", icon: IconMarquee2 },
  { value: "move", label: "Move selection", shortcut: "V", icon: IconArrowsMove },
  { value: "zoom", label: "Zoom (⌥-click to zoom out)", shortcut: "Z", icon: IconZoomIn },
];

type Props = {
  tool: Tool;
  onToolChange: (tool: Tool) => void;
  /** The move tool is disabled without one. */
  hasSelection: boolean;
};

/** One button per tool, as a radio group. */
export function ToolButtons({ tool, onToolChange, hasSelection }: Props) {
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
            disabled={value === "move" && !hasSelection}
            onClick={() => onToolChange(value)}
          >
            <Icon {...ICON} />
          </ActionIcon>
        </Tip>
      ))}
    </Stack>
  );
}
