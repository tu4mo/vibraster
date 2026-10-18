import { IconClipboard, IconCopy } from "@tabler/icons-react";

import type { Editor } from "../../editor/Editor.ts";
import { useEditorVersion } from "../../editor/useEditorVersion.ts";
import { ToolbarButton } from "./ToolbarButton.tsx";
import { ToolbarGroup } from "./ToolbarGroup.tsx";

type Props = {
  /** The active image's editor. */
  editor: Editor;
  hasImage: boolean;
  onCopy: () => void;
  onPaste: () => void;
};

/** Copy and paste. */
export function ClipboardButtons({ editor, hasImage, onCopy, onPaste }: Props) {
  // The editor is mutated in place; subscribing re-renders on its changes.
  useEditorVersion(editor);
  return (
    <ToolbarGroup label="Clipboard">
      <ToolbarButton
        label={editor.selection ? "Copy" : "Copy image"}
        shortcut="⌘C"
        icon={IconCopy}
        onClick={onCopy}
        disabled={!hasImage}
      />
      {/* Enabled without an image: pasting one opens it. */}
      <ToolbarButton label="Paste" shortcut="⌘V" icon={IconClipboard} onClick={onPaste} />
    </ToolbarGroup>
  );
}
