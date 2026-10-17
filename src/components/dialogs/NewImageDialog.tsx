import { useState } from "react";
import { FillField } from "./FillField.tsx";
import { SizeDialog } from "./SizeDialog.tsx";
import { SizeFields } from "./SizeFields.tsx";
import { DEFAULT_SIZE, SizePresets } from "./SizePresets.tsx";

type Props = {
  onCreate: (width: number, height: number, fill: string | null) => void;
  onClose: () => void;
};

export function NewImageDialog({ onCreate, onClose }: Props) {
  const [size, setSize] = useState(DEFAULT_SIZE);
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
      <SizePresets value={size} onChange={setSize} />
      <FillField label="Background" value={fill} onChange={setFill} />
    </SizeDialog>
  );
}
