import { Group, Title } from "@mantine/core";

/** The header bar: the app name, then `children` (menus and controls). */
export function AppHeader({ children }: { children: React.ReactNode }) {
  return (
    <Group h="100%" px="sm" gap="sm" wrap="nowrap">
      <Title order={1} className="brand">
        Vibraster
      </Title>
      {children}
    </Group>
  );
}
