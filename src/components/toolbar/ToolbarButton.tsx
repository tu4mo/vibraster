import { ActionIcon } from "@mantine/core";
import type { Icon } from "@tabler/icons-react";

import { Tip } from "../ui/Tip.tsx";

type Props = {
  label: string;
  shortcut?: string;
  icon: Icon;
  onClick: () => void;
  disabled?: boolean;
  /** Makes the button a radio in a radio group, filled while checked. */
  checked?: boolean;
};

/** A toolbar button: an icon button with its label and shortcut in a tooltip. */
export function ToolbarButton({ label, shortcut, icon: Icon, onClick, disabled, checked }: Props) {
  return (
    <Tip label={label} shortcut={shortcut} position="right">
      <ActionIcon
        size="lg"
        // Transparent while disabled, so it shows no grey background (see the theme).
        variant={checked ? "filled" : "subtle"}
        color={checked ? "blue" : "gray"}
        role={checked === undefined ? undefined : "radio"}
        aria-checked={checked}
        aria-label={label}
        onClick={onClick}
        disabled={disabled}
      >
        <Icon size={18} stroke={1.75} />
      </ActionIcon>
    </Tip>
  );
}
