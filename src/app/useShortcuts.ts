import { type HotkeyItem, useHotkeys } from "@mantine/hooks";

import type { Tool } from "../components/toolbar/tool.ts";
import type { Editor } from "../editor/Editor.ts";

type Options = {
  /** The active image's editor. */
  editor: Editor;
  tool: Tool;
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
  tool,
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

  // Arrows nudge the selection a pixel, or ten with Shift: the move tool moves
  // its pixels, the select tool only the outline.
  const nudges = ARROWS.flatMap(([key, dx, dy]): HotkeyItem[] =>
    [1, 10].map((step) => [
      step === 1 ? key : `shift+${key}`,
      (e) => {
        if (!editing || !hasSelection || !arrowsFree()) return;
        e.preventDefault();
        if (tool === "move") editor.nudgePixels(dx * step, dy * step);
        else editor.nudgeOutline(dx * step, dy * step);
      },
      { preventDefault: false },
    ]),
  );

  useHotkeys([
    ...nudges,
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

const ARROWS = [
  ["ArrowLeft", -1, 0],
  ["ArrowRight", 1, 0],
  ["ArrowUp", 0, -1],
  ["ArrowDown", 0, 1],
] as const;

/**
 * Whether arrow keys are free for nudging: nothing has focus, or a plain
 * button does. Tabs, menus and other widgets with roles use arrows themselves.
 */
function arrowsFree() {
  const el = document.activeElement;
  return el === document.body || (el instanceof HTMLButtonElement && !el.hasAttribute("role"));
}
