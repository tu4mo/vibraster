import { Button, Group, Modal, Stack, Text } from "@mantine/core";
import { useState } from "react";
import { isValidSize } from "../editor/canvas.ts";
import { SizeFields } from "./SizeFields.tsx";

type Props = {
  width: number;
  height: number;
  onApply: (width: number, height: number) => void;
  onClose: () => void;
};

export function ResizeImageDialog({ width, height, onApply, onClose }: Props) {
  const [size, setSize] = useState({ w: width, h: height });
  const [locked, setLocked] = useState(true);
  const valid = isValidSize(size.w) && isValidSize(size.h);

  return (
    <Modal opened centered onClose={onClose} title="Image size" size="xs">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          onApply(size.w, size.h);
          onClose();
        }}
      >
        <Stack>
          <Text size="sm" c="dimmed">
            Scales the image. Currently {width} × {height} px.
          </Text>
          <SizeFields
            width={size.w}
            height={size.h}
            lockedRatio={locked ? width / height : null}
            onChange={(w, h) => setSize({ w, h })}
            onLockChange={setLocked}
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
