import { IconDeviceFloppy, IconFilePlus, IconFolderOpen } from "@tabler/icons-react";
import { ToolbarButton } from "./ToolbarButton.tsx";
import { ToolbarGroup } from "./ToolbarGroup.tsx";

type Props = {
  hasImage: boolean;
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
};

/** New, open and save. */
export function FileButtons({ hasImage, onNew, onOpen, onSave }: Props) {
  return (
    <ToolbarGroup label="File">
      {/* No ⌘N: Chrome reserves it for a new window and pages can't override it. */}
      <ToolbarButton label="New image" icon={IconFilePlus} onClick={onNew} />
      <ToolbarButton label="Open" shortcut="⌘O" icon={IconFolderOpen} onClick={onOpen} />
      <ToolbarButton
        label="Save as PNG"
        shortcut="⌘S"
        icon={IconDeviceFloppy}
        onClick={onSave}
        disabled={!hasImage}
      />
    </ToolbarGroup>
  );
}
