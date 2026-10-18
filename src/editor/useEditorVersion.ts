import { useSyncExternalStore } from "react";

import type { Editor } from "./Editor.ts";

/** Re-renders on every change to `editor`; returns its change counter. */
export function useEditorVersion(editor: Editor): number {
  return useSyncExternalStore(editor.subscribe, editor.getVersion);
}
