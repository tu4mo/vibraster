import { Suspense, lazy } from "react";

import type { Editor } from "../editor/Editor.ts";

// Dialogs load on first use, which keeps their inputs out of the startup bundle.
const NewImageDialog = lazy(() =>
  import("../components/dialogs/NewImageDialog.tsx").then((m) => ({ default: m.NewImageDialog })),
);
const ResizeCanvasDialog = lazy(() =>
  import("../components/dialogs/ResizeCanvasDialog.tsx").then((m) => ({
    default: m.ResizeCanvasDialog,
  })),
);
const ResizeImageDialog = lazy(() =>
  import("../components/dialogs/ResizeImageDialog.tsx").then((m) => ({
    default: m.ResizeImageDialog,
  })),
);

export type DialogName = "new" | "image" | "canvas";

type Props = {
  dialog: DialogName | null;
  /** The active image's editor, which the resize dialogs change. */
  editor: Editor;
  onCreate: (width: number, height: number, fill: string | null) => void;
  onClose: () => void;
};

/** The open dialog, if any. */
export function AppDialogs({ dialog, editor, onCreate, onClose }: Props) {
  return (
    <Suspense>
      {dialog === "image" && (
        <ResizeImageDialog
          width={editor.width}
          height={editor.height}
          onApply={(w, h) => editor.resizeImage(w, h)}
          onClose={onClose}
        />
      )}
      {dialog === "new" && <NewImageDialog onCreate={onCreate} onClose={onClose} />}
      {dialog === "canvas" && (
        <ResizeCanvasDialog
          width={editor.width}
          height={editor.height}
          onApply={(w, h, anchor, bg) => editor.resizeCanvas(w, h, anchor, bg)}
          onClose={onClose}
        />
      )}
    </Suspense>
  );
}
