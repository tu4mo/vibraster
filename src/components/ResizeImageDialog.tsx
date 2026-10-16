import { Button, Text } from "@mantine/core";
import { useState } from "react";
import { SizeDialog } from "./SizeDialog.tsx";
import { SizeFields } from "./SizeFields.tsx";

type Props = {
  width: number;
  height: number;
  onApply: (width: number, height: number) => void;
  onClose: () => void;
};

export function ResizeImageDialog({ width, height, onApply, onClose }: Props) {
  const [size, setSize] = useState({ w: width, h: height });

  return (
    <SizeDialog
      title="Image size"
      submitLabel="Apply"
      size={size}
      onSubmit={() => onApply(size.w, size.h)}
      onClose={onClose}
    >
      <Text size="sm" c="dimmed">
        Scales the image. Currently {width} × {height} px.
      </Text>
      <SizeFields
        width={size.w}
        height={size.h}
        onChange={(w, h) => setSize({ w, h })}
        ratio={width / height}
        defaultLocked
      />
      <Button.Group>
        {[25, 50, 200].map((pct) => (
          <Button
            key={pct}
            variant="default"
            size="xs"
            onClick={() =>
              setSize({
                w: Math.max(1, Math.round((width * pct) / 100)),
                h: Math.max(1, Math.round((height * pct) / 100)),
              })
            }
          >
            {pct}%
          </Button>
        ))}
      </Button.Group>
    </SizeDialog>
  );
}
