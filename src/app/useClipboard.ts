import { useWindowEvent } from "@mantine/hooks";
import { canvasToPngBlob, loadImageFile } from "../editor/canvas.ts";
import type { Editor } from "../editor/Editor.ts";

type Options = {
  /** The active image's editor. */
  editor: Editor;
  hasImage: boolean;
  /** Open a pasted image when none is open. */
  openFile: (file: File) => Promise<void>;
  /** Called once pasted pixels float on the open image. */
  onPasted: () => void;
  setError: (error: string | null) => void;
};

/** Copying to and pasting from the system clipboard, including ⌘V. */
export function useClipboard({ editor, hasImage, openFile, onPasted, setError }: Options) {
  /** Paste onto the open image as movable pixels, or open it if there is none. */
  const pasteImage = async (blob: Blob) => {
    if (!hasImage) {
      await openFile(new File([blob], "Pasted image.png", { type: blob.type }));
      return;
    }
    try {
      editor.paste(await loadImageFile(blob));
      onPasted();
      setError(null);
    } catch {
      setError("Could not read the pasted image.");
    }
  };

  /** Copy the selection (or whole image) to the system clipboard as PNG. */
  const copy = async () => {
    const canvas = editor.copySelection();
    if (!canvas) return;
    try {
      // Hand ClipboardItem a promise so the write starts within the user gesture.
      const png = canvasToPngBlob(canvas);
      await navigator.clipboard.write([new ClipboardItem({ "image/png": png })]);
    } catch {
      setError("Could not copy to the clipboard.");
    }
  };

  /** Edit → Paste: read the clipboard directly (the browser may ask for permission). */
  const paste = async () => {
    try {
      for (const item of await navigator.clipboard.read()) {
        const type = item.types.find((t) => t.startsWith("image/"));
        if (type) return await pasteImage(await item.getType(type));
      }
      setError("The clipboard has no image.");
    } catch {
      setError("Could not read the clipboard. Try ⌘V instead.");
    }
  };

  // ⌘V arrives as a paste event, which needs no clipboard permission.
  useWindowEvent("paste", (e) => {
    const file = [...(e.clipboardData?.files ?? [])].find((f) => f.type.startsWith("image/"));
    if (!file) return;
    e.preventDefault();
    void pasteImage(file);
  });

  return { copy, paste };
}
