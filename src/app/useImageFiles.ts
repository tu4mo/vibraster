import { useFileDialog } from "@mantine/hooks";

import { loadImageFile } from "../editor/canvas.ts";
import type { Editor } from "../editor/Editor.ts";

const ACCEPT = "image/png,image/jpeg,image/webp,image/gif,image/bmp";

type Options = {
  /** The active image's editor, which Save exports. */
  editor: Editor;
  /** Open a loaded image in a new tab. */
  open: (image: HTMLCanvasElement, fileName: string) => void;
  setError: (error: string | null) => void;
};

/** Opening image files (picked or given) and saving the active image as PNG. */
export function useImageFiles({ editor, open, setError }: Options) {
  const openFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError(`"${file.name}" is not an image.`);
      return;
    }
    try {
      open(await loadImageFile(file), file.name);
      setError(null);
    } catch {
      setError(`Could not read "${file.name}".`);
    }
  };

  const fileDialog = useFileDialog({
    accept: ACCEPT,
    multiple: true,
    resetOnOpen: true,
    onChange: (files) => {
      for (const file of files ?? []) void openFile(file);
    },
  });

  const save = async () => {
    let blob;
    try {
      blob = await editor.exportPng();
    } catch {
      setError("Could not save the image.");
      return;
    }
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${editor.fileName}.png`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return { openFile, chooseFiles: fileDialog.open, save };
}
