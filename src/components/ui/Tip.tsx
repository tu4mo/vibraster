import { Group, Kbd, Tooltip, type TooltipProps } from "@mantine/core";

type Props = Omit<TooltipProps, "label"> & {
  label: string;
  shortcut?: string;
};

/**
 * Tooltip with an optional keyboard shortcut hint. Other props, including the
 * ref and handlers a Popover or Menu target injects, pass through to Tooltip.
 */
export function Tip({ label, shortcut, position = "bottom", ...rest }: Props) {
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
      {...rest}
    />
  );
}
