import { IconArrowBackUp, IconArrowForwardUp } from "@tabler/icons-react";
import type { Editor } from "../../editor/Editor.ts";
import { useEditorVersion } from "../../editor/useEditorVersion.ts";
import { ToolbarButton } from "./ToolbarButton.tsx";
import { ToolbarGroup } from "./ToolbarGroup.tsx";

/** Undo and redo on the active image. */
export function HistoryButtons({ editor }: { editor: Editor }) {
  // The editor is mutated in place; subscribing re-renders on its changes.
  useEditorVersion(editor);
  return (
    <ToolbarGroup label="History">
      <ToolbarButton
        label="Undo"
        shortcut="⌘Z"
        icon={IconArrowBackUp}
        onClick={() => editor.undo()}
        disabled={!editor.canUndo}
      />
      <ToolbarButton
        label="Redo"
        shortcut="⇧⌘Z"
        icon={IconArrowForwardUp}
        onClick={() => editor.redo()}
        disabled={!editor.canRedo}
      />
    </ToolbarGroup>
  );
}
