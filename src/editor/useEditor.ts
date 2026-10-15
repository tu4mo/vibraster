import { useState, useSyncExternalStore } from "react";
import { Editor } from "./Editor.ts";

/** Creates one Editor for the component's lifetime and re-renders on every change. */
export function useEditor(): [editor: Editor, version: number] {
  const [editor] = useState(() => new Editor());
  const version = useSyncExternalStore(editor.subscribe, editor.getVersion);
  return [editor, version];
}
