import { Menubar } from "@mantine/core";
import type { Editor } from "../../editor/Editor.ts";
import { EditMenu } from "./EditMenu.tsx";
import { FileMenu } from "./FileMenu.tsx";
import { ImageMenu } from "./ImageMenu.tsx";

type Props = {
  /** The active image's editor. */
  editor: Editor;
  hasImage: boolean;
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onClose: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onImageSize: () => void;
  onCanvasSize: () => void;
};

/** The File, Edit and Image menus. */
export function MainMenu({
  editor,
  hasImage,
  onNew,
  onOpen,
  onSave,
  onClose,
  onCopy,
  onPaste,
  onImageSize,
  onCanvasSize,
}: Props) {
  return (
    <Menubar>
      <FileMenu
        hasImage={hasImage}
        onNew={onNew}
        onOpen={onOpen}
        onSave={onSave}
        onClose={onClose}
      />
      <EditMenu editor={editor} hasImage={hasImage} onCopy={onCopy} onPaste={onPaste} />
      <ImageMenu hasImage={hasImage} onImageSize={onImageSize} onCanvasSize={onCanvasSize} />
    </Menubar>
  );
}
