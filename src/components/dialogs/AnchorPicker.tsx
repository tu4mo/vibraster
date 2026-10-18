import { ActionIcon, Input, SimpleGrid } from "@mantine/core";
import { IconPointFilled } from "@tabler/icons-react";

import type { Anchor } from "../../editor/canvas.ts";

const ANCHORS = ([0, 1, 2] as const).flatMap((row) =>
  ([0, 1, 2] as const).map((col): Anchor => [col, row]),
);

type Props = {
  value: Anchor;
  onChange: (anchor: Anchor) => void;
};

/** A 3 × 3 grid choosing where the image sits in a resized canvas. */
export function AnchorPicker({ value, onChange }: Props) {
  return (
    <Input.Wrapper label="Anchor">
      <SimpleGrid cols={3} spacing={4} verticalSpacing={4} w={96} mt={4}>
        {ANCHORS.map(([col, row]) => {
          const selected = value[0] === col && value[1] === row;
          return (
            <ActionIcon
              key={`${col}${row}`}
              variant={selected ? "filled" : "default"}
              aria-label={`Anchor column ${col + 1}, row ${row + 1}`}
              aria-pressed={selected}
              onClick={() => onChange([col, row])}
            >
              {selected && <IconPointFilled size={14} />}
            </ActionIcon>
          );
        })}
      </SimpleGrid>
    </Input.Wrapper>
  );
}
