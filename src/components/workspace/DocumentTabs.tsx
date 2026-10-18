import { Scroller, Stack, Tabs } from "@mantine/core";
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

/** One tab per open image, in a strip that scrolls sideways (by arrows or wheel) when they don't fit. */
export function DocumentTabs({ docs, activeId, onSelect, onClose, listRef, children }: Props) {
  return (
    <Tabs
      h="100%"
      value={activeId}
      onChange={(value) => value && onSelect(value)}
      activateTabWithKeyboard
      variant="pills"
    >
      <Stack h="100%" gap={0}>
        <Scroller
          controlSize={32}
          draggable={false}
          style={{ borderBottom: "1px solid var(--mantine-color-default-border)" }}
          styles={{ content: { display: "flex", minWidth: "100%" } }}
        >
          <Tabs.List
            ref={listRef}
            aria-label="Open images"
            p={4}
            style={{ flex: 1, flexWrap: "nowrap", gap: 4 }}
          >
            {docs.map(({ id, editor }) => (
              <DocumentTab
                key={id}
                id={id}
                fileName={editor.fileName}
                active={id === activeId}
                onClose={onClose}
              />
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
