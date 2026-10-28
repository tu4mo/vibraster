import { Button } from "@mantine/core";
import { IconCrop } from "@tabler/icons-react";

import type { Editor } from "../../editor/Editor.ts";

/** Trim the image to the selection. */
export function CropButton({ editor }: { editor: Editor }) {
  return (
    <Button
      variant="subtle"
      color="gray"
      size="compact-sm"
      leftSection={<IconCrop size={16} />}
      onClick={() => editor.cropToSelection()}
    >
      Crop
    </Button>
  );
}
