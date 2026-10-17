import { ActionIcon, Input, SimpleGrid, Text } from "@mantine/core";
import { IconPointFilled } from "@tabler/icons-react";
import { useState } from "react";
import type { Anchor } from "../editor/canvas.ts";
import { FillField } from "./FillField.tsx";
import { SizeDialog } from "./SizeDialog.tsx";
import { SizeFields } from "./SizeFields.tsx";

type Props = {
  width: number;
  height: number;
  onApply: (width: number, height: number, anchor: Anchor, background: string | null) => void;
  onClose: () => void;
};

const ANCHORS: Anchor[] = [0, 1, 2].flatMap((row) => [0, 1, 2].map((col) => [col, row] as Anchor));

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
      <Input.Wrapper label="Anchor">
        <SimpleGrid cols={3} spacing={4} verticalSpacing={4} w={96} mt={4}>
          {ANCHORS.map(([col, row]) => {
            const selected = anchor[0] === col && anchor[1] === row;
            return (
              <ActionIcon
                key={`${col}${row}`}
                variant={selected ? "filled" : "default"}
                aria-label={`Anchor column ${col + 1}, row ${row + 1}`}
                aria-pressed={selected}
                onClick={() => setAnchor([col, row])}
              >
                {selected && <IconPointFilled size={14} />}
              </ActionIcon>
            );
          })}
        </SimpleGrid>
      </Input.Wrapper>
      <FillField label="New area" value={fill} onChange={setFill} />
    </SizeDialog>
  );
}
