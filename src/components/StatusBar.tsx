import { Group, Text } from "@mantine/core";
import type { Editor } from "../editor/Editor.ts";
import { useEditorVersion } from "../editor/useEditorVersion.ts";

type Props = {
  /** The active image's editor; one without an image when none is open. */
  editor: Editor;
  /** Shown instead of the image details while set. */
  error: string | null;
};

/** The active image's size, or the latest error. */
export function StatusBar({ editor, error }: Props) {
  // The editor is mutated in place; subscribing re-renders on its changes.
  useEditorVersion(editor);
  return (
    <Group h="100%" px="sm" gap="lg" wrap="nowrap" className="statusbar">
      {error ? (
        <Text size="xs" c="red">
          {error}
        </Text>
      ) : editor.image ? (
        <Text size="xs" c="dimmed">
          {editor.width} × {editor.height} px
        </Text>
      ) : (
        <Text size="xs" c="dimmed">
          No image
        </Text>
      )}
    </Group>
  );
}
