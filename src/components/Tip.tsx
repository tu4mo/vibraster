import { type FloatingPosition, Group, Kbd, Tooltip } from "@mantine/core";
import type { ReactElement } from "react";

type Props = {
  label: string;
  shortcut?: string;
  position?: FloatingPosition;
  children: ReactElement;
};

/** Tooltip with an optional keyboard shortcut hint. */
export function Tip({ label, shortcut, position = "bottom", children }: Props) {
  return (
    <Tooltip
      position={position}
      openDelay={300}
      label={
        <Group gap={6} wrap="nowrap">
          {label}
          {shortcut && <Kbd size="xs">{shortcut}</Kbd>}
        </Group>
      }
    >
      {children}
    </Tooltip>
  );
}
