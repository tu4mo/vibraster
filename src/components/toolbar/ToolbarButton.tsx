import { ActionIcon } from "@mantine/core";
import type { Icon } from "@tabler/icons-react";

import { Tip } from "../ui/Tip.tsx";
import { TOOLBAR_ICON } from "./toolbarIcon.ts";

type Props = {
  label: string;
  shortcut?: string;
  icon: Icon;
  onClick: () => void;
  disabled?: boolean;
};

/** A toolbar action: an icon button with its label and shortcut in a tooltip. */
export function ToolbarButton({ label, shortcut, icon: Icon, onClick, disabled }: Props) {
  return (
    <Tip label={label} shortcut={shortcut} position="right">
      <ActionIcon
        size="lg"
        variant="subtle"
        color="gray"
        aria-label={label}
        onClick={onClick}
        disabled={disabled}
      >
        <Icon {...TOOLBAR_ICON} />
      </ActionIcon>
    </Tip>
  );
}
