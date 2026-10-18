import { Button, Group } from "@mantine/core";
import { IconEraser } from "@tabler/icons-react";

import type { Editor } from "../../editor/Editor.ts";
import { ColorButton } from "../color/ColorButton.tsx";

type Props = {
  editor: Editor;
  /** The color Fill uses, picked next to the button. */
  fillColor: string;
  onFillColorChange: (color: string) => void;
};

/** Fill the selection with a picked color, or delete it. */
export function FillActions({ editor, fillColor, onFillColorChange }: Props) {
  return (
    <>
      <Group gap={6} wrap="nowrap">
        <ColorButton label="Fill color" color={fillColor} onChange={onFillColorChange} />
        <Button
          variant="subtle"
          color="gray"
          size="compact-sm"
          onClick={() => editor.fill(fillColor)}
        >
          Fill
        </Button>
      </Group>
      <Button
        variant="subtle"
        color="red"
        size="compact-sm"
        leftSection={<IconEraser size={16} />}
        onClick={() => editor.deleteSelection()}
      >
        Delete
      </Button>
    </>
  );
}
