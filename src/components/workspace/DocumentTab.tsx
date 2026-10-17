import { CloseButton, Tabs, Text } from "@mantine/core";

type Props = {
  id: string;
  fileName: string;
  onClose: (id: string) => void;
};

/** One image's tab: its file name and a close button. */
export function DocumentTab({ id, fileName, onClose }: Props) {
  return (
    <Tabs.Tab
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
