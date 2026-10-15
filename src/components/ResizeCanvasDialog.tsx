import {
  ActionIcon,
  Button,
  Checkbox,
  ColorSwatch,
  Group,
  Input,
  Modal,
  SimpleGrid,
  Stack,
  Text,
} from "@mantine/core";
import { IconPointFilled } from "@tabler/icons-react";
import { useState } from "react";
import { type Anchor, isValidSize } from "../editor/canvas.ts";
import { SizeFields } from "./SizeFields.tsx";

type Props = {
  width: number;
  height: number;
  background: string;
  onApply: (width: number, height: number, anchor: Anchor, background: string | null) => void;
  onClose: () => void;
};

const ANCHORS: Anchor[] = [0, 1, 2].flatMap((row) => [0, 1, 2].map((col) => [col, row] as Anchor));

export function ResizeCanvasDialog({ width, height, background, onApply, onClose }: Props) {
  const [size, setSize] = useState({ w: width, h: height });
  const [locked, setLocked] = useState(false);
  const [anchor, setAnchor] = useState<Anchor>([1, 1]);
  const [fill, setFill] = useState(true);
  const valid = isValidSize(size.w) && isValidSize(size.h);

  return (
    <Modal opened centered onClose={onClose} title="Canvas size" size="xs">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          onApply(size.w, size.h, anchor, fill ? background : null);
          onClose();
        }}
      >
        <Stack>
          <Text size="sm" c="dimmed">
            Adds or crops space around the image. Currently {width} × {height} px.
          </Text>
          <SizeFields
            width={size.w}
            height={size.h}
            lockedRatio={locked ? width / height : null}
            onChange={(w, h) => setSize({ w, h })}
            onLockChange={setLocked}
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
          <Checkbox
            checked={fill}
            onChange={(e) => setFill(e.currentTarget.checked)}
            label={
              <Group gap={6} wrap="nowrap">
                Fill new area with background color
                <ColorSwatch color={background} size={14} />
              </Group>
            }
            description={fill ? undefined : "New area will be transparent."}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!valid}>
              Apply
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
