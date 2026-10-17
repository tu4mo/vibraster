import { Button, Center, EmptyState, Group } from "@mantine/core";
import { IconFilePlus, IconFolderOpen, IconPhoto } from "@tabler/icons-react";

type Props = {
  onOpen: () => void;
  onNew: () => void;
  /** The empty viewport, which the parent measures to fit the first image's zoom. */
  ref?: React.Ref<HTMLDivElement>;
};

/** Shown with no image open. */
export function StartScreen({ onOpen, onNew, ref }: Props) {
  return (
    <div ref={ref} className="viewport">
      <Center flex={1}>
        <EmptyState
          icon={<IconPhoto size={32} stroke={1.5} />}
          withIndicatorBackground
          title="Open or create an image"
          description="PNG, JPEG, WebP or GIF. You can also drop a file anywhere or paste one."
        >
          <Group mt="md" gap="xs" justify="center">
            <Button leftSection={<IconFolderOpen size={16} />} onClick={onOpen}>
              Choose file
            </Button>
            <Button variant="default" leftSection={<IconFilePlus size={16} />} onClick={onNew}>
              New image
            </Button>
          </Group>
        </EmptyState>
      </Center>
    </div>
  );
}
