import { IconFrame, IconResize } from "@tabler/icons-react";

import { ToolbarButton } from "./ToolbarButton.tsx";
import { ToolbarGroup } from "./ToolbarGroup.tsx";

type Props = {
  hasImage: boolean;
  onImageSize: () => void;
  onCanvasSize: () => void;
};

/** Open the image and canvas size dialogs. */
export function ImageButtons({ hasImage, onImageSize, onCanvasSize }: Props) {
  return (
    <ToolbarGroup label="Image">
      <ToolbarButton
        label="Image size…"
        icon={IconResize}
        onClick={onImageSize}
        disabled={!hasImage}
      />
      <ToolbarButton
        label="Canvas size…"
        icon={IconFrame}
        onClick={onCanvasSize}
        disabled={!hasImage}
      />
    </ToolbarGroup>
  );
}
