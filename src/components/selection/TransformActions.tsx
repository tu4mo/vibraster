import { ActionIcon, Group } from "@mantine/core";
import {
  IconFlipHorizontal,
  IconFlipVertical,
  IconRotate2,
  IconRotateClockwise2,
} from "@tabler/icons-react";
import type { Editor } from "../../editor/Editor.ts";
import { Tip } from "../ui/Tip.tsx";

const ICON = { size: 16, stroke: 1.75 };

/** Move tool actions, each turning the selected pixels in place. */
const TRANSFORMS = [
  {
    label: "Flip horizontally",
    icon: IconFlipHorizontal,
    run: (e: Editor) => e.flipSelection("horizontal"),
  },
  {
    label: "Flip vertically",
    icon: IconFlipVertical,
    run: (e: Editor) => e.flipSelection("vertical"),
  },
  {
    label: "Rotate left",
    icon: IconRotate2,
    run: (e: Editor) => e.rotateSelection("counterclockwise"),
  },
  {
    label: "Rotate right",
    icon: IconRotateClockwise2,
    run: (e: Editor) => e.rotateSelection("clockwise"),
  },
];

/** Flip and rotate buttons for the selected pixels. */
export function TransformActions({ editor }: { editor: Editor }) {
  return (
    <Group gap={2} wrap="nowrap">
      {TRANSFORMS.map(({ label, icon: Icon, run }) => (
        <Tip key={label} label={label} position="top">
          <ActionIcon variant="subtle" color="gray" aria-label={label} onClick={() => run(editor)}>
            <Icon {...ICON} />
          </ActionIcon>
        </Tip>
      ))}
    </Group>
  );
}
