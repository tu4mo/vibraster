import { Menu, Menubar } from "@mantine/core";
import { IconDeviceFloppy, IconFilePlus, IconFolderOpen, IconX } from "@tabler/icons-react";
import { MENU_ICON } from "./menuIcon.ts";
import { MenuShortcut } from "./MenuShortcut.tsx";

type Props = {
  hasImage: boolean;
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onClose: () => void;
};

export function FileMenu({ hasImage, onNew, onOpen, onSave, onClose }: Props) {
  return (
    <Menubar.Menu>
      <Menubar.Target>File</Menubar.Target>
      <Menubar.Dropdown>
        {/* No ⌘N: Chrome reserves it for a new window and pages can't override it. */}
        <Menu.Item leftSection={<IconFilePlus {...MENU_ICON} />} onClick={onNew}>
          New…
        </Menu.Item>
        <Menu.Item
          leftSection={<IconFolderOpen {...MENU_ICON} />}
          rightSection={<MenuShortcut keys="⌘O" />}
          onClick={onOpen}
        >
          Open…
        </Menu.Item>
        <Menu.Item
          leftSection={<IconDeviceFloppy {...MENU_ICON} />}
          rightSection={<MenuShortcut keys="⌘S" />}
          onClick={onSave}
          disabled={!hasImage}
        >
          Save as PNG
        </Menu.Item>
        {/* No ⌘W either: browsers close the tab before the page sees it. */}
        <Menu.Item leftSection={<IconX {...MENU_ICON} />} onClick={onClose} disabled={!hasImage}>
          Close
        </Menu.Item>
      </Menubar.Dropdown>
    </Menubar.Menu>
  );
}
