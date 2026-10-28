import { ActionBar, Text } from "@mantine/core";

import type { Editor } from "../../editor/Editor.ts";
import { useEditorVersion } from "../../editor/useEditorVersion.ts";
import type { Tool } from "../toolbar/tool.ts";
import { CropButton } from "./CropButton.tsx";
import { FillActions } from "./FillActions.tsx";
import { TransformActions } from "./TransformActions.tsx";

import classes from "./SelectionBar.module.css";

type Props = {
  /** The active image's editor. */
  editor: Editor;
  /** The move tool offers transforms; other tools offer fill, delete and crop. */
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
    <ActionBar
      opened={sel !== null}
      onClose={() => editor.setSelection(null)}
      shadow="md"
      className={classes.bar}
    >
      <Text size="sm" c="dimmed" style={{ fontVariantNumeric: "tabular-nums" }}>
        {sel?.w} × {sel?.h}
      </Text>
      <ActionBar.Divider />
      {tool === "move" ? (
        <TransformActions editor={editor} />
      ) : (
        <>
          <FillActions
            editor={editor}
            fillColor={fillColor}
            onFillColorChange={onFillColorChange}
          />
          <CropButton editor={editor} />
        </>
      )}
    </ActionBar>
  );
}
