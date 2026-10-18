import { CloseButton, Tabs, Text } from "@mantine/core";

type Props = {
  id: string;
  fileName: string;
  active: boolean;
  onClose: (id: string) => void;
};

/** One image's tab: its file name and a close button. */
export function DocumentTab({ id, fileName, active, onClose }: Props) {
  return (
    <Tabs.Tab
      ref={active ? scrollIntoView : undefined}
      value={id}
      title={fileName}
      rightSection={
        // A span: the tab is itself a button, which can't contain another.
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
        {fileName}
      </Text>
    </Tabs.Tab>
  );
}

/** Brings the tab into view when it becomes active, such as a new one opened past the edge. */
function scrollIntoView(tab: HTMLElement | null) {
  tab?.scrollIntoView({ block: "nearest", inline: "nearest" });
}
