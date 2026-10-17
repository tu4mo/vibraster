import { Menu, Menubar } from "@mantine/core";
import {
  IconArrowBackUp,
  IconArrowForwardUp,
  IconClipboard,
  IconCopy,
  IconSelectAll,
} from "@tabler/icons-react";
import type { Editor } from "../../editor/Editor.ts";
import { useEditorVersion } from "../../editor/useEditorVersion.ts";
import { MENU_ICON } from "./menuIcon.ts";
import { MenuShortcut } from "./MenuShortcut.tsx";

type Props = {
  /** The active image's editor. */
  editor: Editor;
  hasImage: boolean;
  onCopy: () => void;
  onPaste: () => void;
};

export function EditMenu({ editor, hasImage, onCopy, onPaste }: Props) {
  // The editor is mutated in place; subscribing re-renders on its changes.
  useEditorVersion(editor);
  return (
    <Menubar.Menu>
      <Menubar.Target>Edit</Menubar.Target>
      <Menubar.Dropdown>
        <Menu.Item
          leftSection={<IconArrowBackUp {...MENU_ICON} />}
          rightSection={<MenuShortcut keys="⌘Z" />}
          onClick={() => editor.undo()}
          disabled={!editor.canUndo}
        >
          Undo
        </Menu.Item>
        <Menu.Item
          leftSection={<IconArrowForwardUp {...MENU_ICON} />}
          rightSection={<MenuShortcut keys="⇧⌘Z" />}
          onClick={() => editor.redo()}
          disabled={!editor.canRedo}
        >
          Redo
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item
          leftSection={<IconCopy {...MENU_ICON} />}
          rightSection={<MenuShortcut keys="⌘C" />}
          onClick={onCopy}
          disabled={!hasImage}
        >
          {editor.selection ? "Copy" : "Copy image"}
        </Menu.Item>
        <Menu.Item
          leftSection={<IconClipboard {...MENU_ICON} />}
          rightSection={<MenuShortcut keys="⌘V" />}
          onClick={onPaste}
        >
          Paste
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item
          leftSection={<IconSelectAll {...MENU_ICON} />}
          rightSection={<MenuShortcut keys="⌘A" />}
          onClick={() => editor.selectAll()}
          disabled={!hasImage}
        >
          Select all
        </Menu.Item>
      </Menubar.Dropdown>
    </Menubar.Menu>
  );
}
