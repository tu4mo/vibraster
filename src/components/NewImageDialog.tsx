import { Button, Group } from "@mantine/core";
import { useState } from "react";
import { FillField } from "./FillField.tsx";
import { SizeDialog } from "./SizeDialog.tsx";
import { SizeFields } from "./SizeFields.tsx";

const PRESETS = [
  { w: 800, h: 600 },
  { w: 1280, h: 720 },
  { w: 1920, h: 1080 },
  { w: 1080, h: 1080 },
];

type Props = {
  onCreate: (width: number, height: number, fill: string | null) => void;
  onClose: () => void;
};

export function NewImageDialog({ onCreate, onClose }: Props) {
  const [size, setSize] = useState(PRESETS[0]);
  const [fill, setFill] = useState<string | null>("#ffffff");

  return (
    <SizeDialog
      title="New image"
      submitLabel="Create"
      size={size}
      onSubmit={() => onCreate(size.w, size.h, fill)}
      onClose={onClose}
    >
      <SizeFields width={size.w} height={size.h} onChange={(w, h) => setSize({ w, h })} />
      <Group gap={4}>
        {PRESETS.map(({ w, h }) => (
          <Button
            key={`${w}x${h}`}
            variant={size.w === w && size.h === h ? "light" : "default"}
            size="compact-xs"
            onClick={() => setSize({ w, h })}
          >
            {w} × {h}
          </Button>
        ))}
      </Group>
      <FillField label="Background" value={fill} onChange={setFill} />
    </SizeDialog>
  );
}
