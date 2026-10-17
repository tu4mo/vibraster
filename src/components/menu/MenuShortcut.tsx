import { Text } from "@mantine/core";

/** A menu item's keyboard shortcut hint. */
export function MenuShortcut({ keys }: { keys: string }) {
  return (
    <Text size="xs" c="dimmed">
      {keys}
    </Text>
  );
}
