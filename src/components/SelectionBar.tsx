import { ActionBar, Button, ColorSwatch, Text } from "@mantine/core";
import { IconEraser } from "@tabler/icons-react";
import type { Editor } from "../editor/Editor.ts";
import { useEditorVersion } from "../editor/useEditorVersion.ts";

type Props = {
  /** The active image's editor. */
  editor: Editor;
  /** The fill color. */
  foreground: string;
};

/** Size of and actions on the selection. Mantine positions it, fixed above the status bar. */
export function SelectionBar({ editor, foreground }: Props) {
  // The editor is mutated in place; subscribing re-renders on its changes.
  useEditorVersion(editor);
  const sel = editor.selection;
  return (
    <ActionBar opened={sel !== null} onClose={() => editor.setSelection(null)} shadow="md">
      <Text size="sm" c="dimmed" className="tabular">
        {sel?.w} × {sel?.h}
      </Text>
      <ActionBar.Divider />
      <Button
        variant="subtle"
        color="gray"
        size="compact-sm"
        leftSection={<ColorSwatch color={foreground} size={14} />}
        onClick={() => editor.fill(foreground)}
      >
        Fill
      </Button>
      <Button
        variant="subtle"
        color="red"
        size="compact-sm"
        leftSection={<IconEraser size={16} />}
        onClick={() => editor.deleteSelection()}
      >
        Delete
      </Button>
      <ActionBar.Divider />
      <ActionBar.CloseButton aria-label="Deselect" />
    </ActionBar>
  );
}
