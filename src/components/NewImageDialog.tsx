import { Button, ColorSwatch, Group, Input, Modal, SegmentedControl, Stack } from "@mantine/core";
import { useState } from "react";
import { isValidSize } from "../editor/canvas.ts";
import { SizeFields } from "./SizeFields.tsx";

const PRESETS = [
  { w: 800, h: 600 },
  { w: 1280, h: 720 },
  { w: 1920, h: 1080 },
  { w: 1080, h: 1080 },
];

type Fill = "white" | "background" | "transparent";

type Props = {
  /** The current background color, offered as a fill option. */
  background: string;
  onCreate: (width: number, height: number, fill: string | null) => void;
  onClose: () => void;
};

export function NewImageDialog({ background, onCreate, onClose }: Props) {
  const [size, setSize] = useState(PRESETS[0]);
  const [fill, setFill] = useState<Fill>("white");
  const valid = isValidSize(size.w) && isValidSize(size.h);

  return (
    <Modal opened centered onClose={onClose} title="New image" size="xs">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          const color = fill === "white" ? "#ffffff" : fill === "background" ? background : null;
          onCreate(size.w, size.h, color);
          onClose();
        }}
      >
        <Stack>
          <SizeFields
            width={size.w}
            height={size.h}
            lockedRatio={null}
            onChange={(w, h) => setSize({ w, h })}
          />
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
          <Input.Wrapper label="Background">
            <SegmentedControl
              fullWidth
              mt={4}
              value={fill}
              onChange={(value) => setFill(value as Fill)}
              data={[
                { value: "white", label: "White" },
                {
                  value: "background",
                  label: (
                    <Group gap={6} justify="center" wrap="nowrap">
                      <ColorSwatch color={background} size={12} />
                      Color
                    </Group>
                  ),
                },
                { value: "transparent", label: "Transparent" },
              ]}
            />
          </Input.Wrapper>
          <Group justify="flex-end">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!valid}>
              Create
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
