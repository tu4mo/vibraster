import { type SetStateAction, useRef, useState } from "react";

import { Editor } from "./Editor.ts";

/** One open image (a tab): its editor plus view state kept while switching tabs. */
export type Doc = { id: string; editor: Editor; zoom: number };

/** The open images and which one is active. */
export function useDocuments() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const nextId = useRef(1);
  const active = docs.find((d) => d.id === activeId) ?? null;

  /** Open `image` in a new tab after the others and switch to it. */
  const open = (image: HTMLCanvasElement, fileName: string, zoom: number) => {
    const editor = new Editor();
    editor.load(image, fileName);
    const id = String(nextId.current++);
    setDocs((ds) => [...ds, { id, editor, zoom }]);
    setActiveId(id);
  };

  /** Close a tab; closing the active one activates its right neighbor, else its left. */
  const close = (id: string) => {
    const index = docs.findIndex((d) => d.id === id);
    if (index < 0) return;
    const rest = docs.filter((d) => d.id !== id);
    setDocs(rest);
    if (id === activeId) setActiveId(rest[Math.min(index, rest.length - 1)]?.id ?? null);
  };

  /** Set the active tab's zoom. */
  const setZoom = (zoom: SetStateAction<number>) =>
    setDocs((ds) =>
      ds.map((d) =>
        d.id === activeId ? { ...d, zoom: typeof zoom === "function" ? zoom(d.zoom) : zoom } : d,
      ),
    );

  return { docs, active, activeId, select: setActiveId, open, close, setZoom };
}
