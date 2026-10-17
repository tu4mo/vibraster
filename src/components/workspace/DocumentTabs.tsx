import { Scroller, Stack, Tabs } from "@mantine/core";
import { useEffect, useRef } from "react";
import type { Doc } from "../../editor/useDocuments.ts";
import { DocumentTab } from "./DocumentTab.tsx";

type Props = {
  docs: Doc[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  /** The tab strip, which the parent measures to keep the toolbar off it. */
  listRef?: React.Ref<HTMLDivElement>;
  /** A tab's content. Inactive tabs stay mounted, so each keeps its scroll position. */
  children: (doc: Doc) => React.ReactNode;
};

/** One tab per open image, in a strip that scrolls sideways (by arrows or dragging) when they don't fit. */
export function DocumentTabs({ docs, activeId, onSelect, onClose, listRef, children }: Props) {
  const strip = useRef<HTMLDivElement>(null);

  // Bring the active tab into view, such as a new one opened past the edge.
  useEffect(() => {
    strip.current
      ?.querySelector('[aria-selected="true"]')
      ?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [activeId]);

  return (
    <Tabs
      h="100%"
      value={activeId}
      onChange={(value) => value && onSelect(value)}
      activateTabWithKeyboard
      variant="outline"
    >
      <Stack h="100%" gap={0}>
        {/* Stretched so the list's bottom border spans the strip. */}
        <Scroller
          ref={strip}
          controlSize={32}
          styles={{ content: { display: "flex", minWidth: "100%" } }}
        >
          <Tabs.List ref={listRef} aria-label="Open images" style={{ flex: 1, flexWrap: "nowrap" }}>
            {docs.map(({ id, editor }) => (
              <DocumentTab key={id} id={id} fileName={editor.fileName} onClose={onClose} />
            ))}
          </Tabs.List>
        </Scroller>
        {docs.map((doc) => (
          <Tabs.Panel key={doc.id} value={doc.id} flex={1} mih={0}>
            {children(doc)}
          </Tabs.Panel>
        ))}
      </Stack>
    </Tabs>
  );
}
