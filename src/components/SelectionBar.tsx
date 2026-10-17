import { ActionBar, ActionIcon, Button, Group, Text } from "@mantine/core";
import {
  IconEraser,
  IconFlipHorizontal,
  IconFlipVertical,
  IconRotate2,
  IconRotateClockwise2,
} from "@tabler/icons-react";
import type { Editor } from "../editor/Editor.ts";
import { useEditorVersion } from "../editor/useEditorVersion.ts";
import type { Tool } from "./CanvasView.tsx";
import { ColorButton } from "./ColorButton.tsx";
import { Tip } from "./Tip.tsx";

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

type Props = {
  /** The active image's editor. */
  editor: Editor;
  /** The move tool offers transforms; other tools offer fill and delete. */
  tool: Tool;
  /** The color Fill uses, picked next to the button. */
  fillColor: string;
  onFillColorChange: (color: string) => void;
};

/** Size of and actions on the selection. Mantine positions it, fixed above the status bar. */
export function SelectionBar({ editor, tool, fillColor, onFillColorChange }: Props) {
  // The editor is mutated in place; subscribing re-renders on its changes.
  useEditorVersion(editor);
  const sel = editor.selection;
  return (
    <ActionBar opened={sel !== null} onClose={() => editor.setSelection(null)} shadow="md">
      <Text size="sm" c="dimmed" className="tabular">
        {sel?.w} × {sel?.h}
      </Text>
      <ActionBar.Divider />
      {tool === "move" ? (
        <Group gap={2} wrap="nowrap">
          {TRANSFORMS.map(({ label, icon: Icon, run }) => (
            <Tip key={label} label={label} position="top">
              <ActionIcon
                variant="subtle"
                color="gray"
                aria-label={label}
                onClick={() => run(editor)}
              >
                <Icon {...ICON} />
              </ActionIcon>
            </Tip>
          ))}
        </Group>
      ) : (
        <>
          <Group gap={6} wrap="nowrap">
            <ColorButton label="Fill color" color={fillColor} onChange={onFillColorChange} />
            <Button
              variant="subtle"
              color="gray"
              size="compact-sm"
              onClick={() => editor.fill(fillColor)}
            >
              Fill
            </Button>
          </Group>
          <Button
            variant="subtle"
            color="red"
            size="compact-sm"
            leftSection={<IconEraser size={16} />}
            onClick={() => editor.deleteSelection()}
          >
            Delete
          </Button>
        </>
      )}
    </ActionBar>
  );
}
