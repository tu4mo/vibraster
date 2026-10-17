import { Menu, Menubar } from "@mantine/core";
import { IconFrame, IconResize } from "@tabler/icons-react";
import { MENU_ICON } from "./menuIcon.ts";

type Props = {
  hasImage: boolean;
  onImageSize: () => void;
  onCanvasSize: () => void;
};

export function ImageMenu({ hasImage, onImageSize, onCanvasSize }: Props) {
  return (
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
  );
}
