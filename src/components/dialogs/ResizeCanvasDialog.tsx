import { Text } from "@mantine/core";
import { useState } from "react";

import type { Anchor } from "../../editor/canvas.ts";
import { AnchorPicker } from "./AnchorPicker.tsx";
import { FillField } from "./FillField.tsx";
import { SizeDialog } from "./SizeDialog.tsx";
import { SizeFields } from "./SizeFields.tsx";

type Props = {
  width: number;
  height: number;
  onApply: (width: number, height: number, anchor: Anchor, background: string | null) => void;
  onClose: () => void;
};

export function ResizeCanvasDialog({ width, height, onApply, onClose }: Props) {
  const [size, setSize] = useState({ w: width, h: height });
  const [anchor, setAnchor] = useState<Anchor>([1, 1]);
  const [fill, setFill] = useState<string | null>("#ffffff");

  return (
    <SizeDialog
      title="Canvas size"
      submitLabel="Apply"
      size={size}
      onSubmit={() => onApply(size.w, size.h, anchor, fill)}
      onClose={onClose}
    >
      <Text size="sm" c="dimmed">
        Adds or crops space around the image. Currently {width} × {height} px.
      </Text>
      <SizeFields
        width={size.w}
        height={size.h}
        onChange={(w, h) => setSize({ w, h })}
        ratio={width / height}
      />
      <AnchorPicker value={anchor} onChange={setAnchor} />
      <FillField label="New area" value={fill} onChange={setFill} />
    </SizeDialog>
  );
}
