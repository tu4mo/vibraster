import { CloseButton, Scroller, Stack, Tabs, Text } from "@mantine/core";
import { useEffect, useRef } from "react";
import type { Doc } from "../editor/useDocuments.ts";

type Props = {
  docs: Doc[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  /** The tab strip, which the parent measures to keep the palette off it. */
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
              <Tabs.Tab
                key={id}
                value={id}
                title={editor.fileName}
                rightSection={
                  // A span: the tab is itself a button, which can't contain another.
                  // Keyboard users close tabs with File → Close.
                  <CloseButton
                    component="span"
                    size="xs"
                    aria-hidden
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      onClose(id);
                    }}
                  />
                }
              >
                <Text inherit truncate maw={180}>
                  {editor.fileName}
                </Text>
              </Tabs.Tab>
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
