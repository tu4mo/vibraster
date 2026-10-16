import { Menu, Menubar, Text } from "@mantine/core";
import {
  IconArrowBackUp,
  IconArrowForwardUp,
  IconClipboard,
  IconCopy,
  IconDeviceFloppy,
  IconFilePlus,
  IconFolderOpen,
  IconFrame,
  IconResize,
  IconSelectAll,
  IconX,
} from "@tabler/icons-react";
import type { Editor } from "../editor/Editor.ts";
import { useEditorVersion } from "../editor/useEditorVersion.ts";

const MENU_ICON = { size: 16, stroke: 1.75 };

function Shortcut({ keys }: { keys: string }) {
  return (
    <Text size="xs" c="dimmed">
      {keys}
    </Text>
  );
}

type Props = {
  /** The active image's editor. */
  editor: Editor;
  hasImage: boolean;
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onClose: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onImageSize: () => void;
  onCanvasSize: () => void;
};

/** The File, Edit and Image menus. */
export function MainMenu({
  editor,
  hasImage,
  onNew,
  onOpen,
  onSave,
  onClose,
  onCopy,
  onPaste,
  onImageSize,
  onCanvasSize,
}: Props) {
  // The editor is mutated in place; subscribing re-renders on its changes.
  useEditorVersion(editor);
  return (
    <Menubar>
      <Menubar.Menu>
        <Menubar.Target>File</Menubar.Target>
        <Menubar.Dropdown>
          {/* No ⌘N: Chrome reserves it for a new window and pages can't override it. */}
          <Menu.Item leftSection={<IconFilePlus {...MENU_ICON} />} onClick={onNew}>
            New…
          </Menu.Item>
          <Menu.Item
            leftSection={<IconFolderOpen {...MENU_ICON} />}
            rightSection={<Shortcut keys="⌘O" />}
            onClick={onOpen}
          >
            Open…
          </Menu.Item>
          <Menu.Item
            leftSection={<IconDeviceFloppy {...MENU_ICON} />}
            rightSection={<Shortcut keys="⌘S" />}
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

      <Menubar.Menu>
        <Menubar.Target>Edit</Menubar.Target>
        <Menubar.Dropdown>
          <Menu.Item
            leftSection={<IconArrowBackUp {...MENU_ICON} />}
            rightSection={<Shortcut keys="⌘Z" />}
            onClick={() => editor.undo()}
            disabled={!editor.canUndo}
          >
            Undo
          </Menu.Item>
          <Menu.Item
            leftSection={<IconArrowForwardUp {...MENU_ICON} />}
            rightSection={<Shortcut keys="⇧⌘Z" />}
            onClick={() => editor.redo()}
            disabled={!editor.canRedo}
          >
            Redo
          </Menu.Item>
          <Menu.Divider />
          <Menu.Item
            leftSection={<IconCopy {...MENU_ICON} />}
            rightSection={<Shortcut keys="⌘C" />}
            onClick={onCopy}
            disabled={!hasImage}
          >
            {editor.selection ? "Copy" : "Copy image"}
          </Menu.Item>
          <Menu.Item
            leftSection={<IconClipboard {...MENU_ICON} />}
            rightSection={<Shortcut keys="⌘V" />}
            onClick={onPaste}
          >
            Paste
          </Menu.Item>
          <Menu.Divider />
          <Menu.Item
            leftSection={<IconSelectAll {...MENU_ICON} />}
            rightSection={<Shortcut keys="⌘A" />}
            onClick={() => editor.selectAll()}
            disabled={!hasImage}
          >
            Select all
          </Menu.Item>
        </Menubar.Dropdown>
      </Menubar.Menu>

      <Menubar.Menu>
        <Menubar.Target>Image</Menubar.Target>
        <Menubar.Dropdown>
          <Menu.Item
            leftSection={<IconResize {...MENU_ICON} />}
            onClick={onImageSize}
            disabled={!hasImage}
          >
            Image size…
          </Menu.Item>
          <Menu.Item
            leftSection={<IconFrame {...MENU_ICON} />}
            onClick={onCanvasSize}
            disabled={!hasImage}
          >
            Canvas size…
          </Menu.Item>
        </Menubar.Dropdown>
      </Menubar.Menu>
    </Menubar>
  );
}
