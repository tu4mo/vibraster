import { useHotkeys } from "@mantine/hooks";

import type { Tool } from "../components/tools/tool.ts";
import type { Editor } from "../editor/Editor.ts";

type Options = {
  /** The active image's editor. */
  editor: Editor;
  hasImage: boolean;
  hasSelection: boolean;
  dialogOpen: boolean;
  fillColor: string;
  setTool: (tool: Tool) => void;
  chooseFiles: () => void;
  copy: () => Promise<void>;
  save: () => Promise<void>;
  zoomBy: (direction: 1 | -1) => void;
  zoomToFit: () => void;
};

/** The app's keyboard shortcuts. */
export function useShortcuts({
  editor,
  hasImage,
  hasSelection,
  dialogOpen,
  fillColor,
  setTool,
  chooseFiles,
  copy,
  save,
  zoomBy,
  zoomToFit,
}: Options) {
  // Shortcuts only act with an image open and no dialog showing.
  const editing = hasImage && !dialogOpen;
  useHotkeys([
    ["mod+O", () => !dialogOpen && chooseFiles()],
    ["mod+shift+Z", () => editing && editor.redo()],
    ["mod+Z", () => editing && editor.undo()],
    ["mod+Y", () => editing && editor.redo()],
    [
      "mod+C",
      // Only take over ⌘C with an image open; otherwise let the browser copy text.
      (e) => {
        if (!editing) return;
        e.preventDefault();
        void copy();
      },
      { preventDefault: false },
    ],
    ["mod+A", () => editing && editor.selectAll()],
    ["mod+D", () => editing && editor.setSelection(null)],
    ["mod+S", () => editing && void save()],
    // Zoom in is ⌘= on US keyboards, ⌘+ (Shift+=) there too, and ⌘+ without
    // Shift on layouts with a dedicated + key. Handle them all so the browser
    // never zooms the page instead.
    ["mod+=", () => editing && zoomBy(1)],
    ["mod+[plus]", () => editing && zoomBy(1)],
    ["mod+shift+[plus]", () => editing && zoomBy(1)],
    ["mod+-", () => editing && zoomBy(-1)],
    ["mod+0", () => editing && zoomToFit()],
    ["Delete", () => editing && editor.deleteSelection()],
    ["Backspace", () => editing && editor.deleteSelection()],
    [
      "Escape",
      // Escape on a focused control (menu, color picker) only closes that control.
      () => editing && document.activeElement === document.body && editor.setSelection(null),
    ],
    ["M", () => editing && setTool("select")],
    ["V", () => editing && hasSelection && setTool("move")],
    ["Z", () => editing && setTool("zoom")],
    ["F", () => editing && editor.fill(fillColor)],
  ]);
}
