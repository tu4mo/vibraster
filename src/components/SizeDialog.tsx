import { Button, Group, Modal, Stack } from "@mantine/core";
import type { ReactNode } from "react";
import { isValidSize } from "../editor/canvas.ts";

type Size = { w: number; h: number };

type Props = {
  title: string;
  submitLabel: string;
  /** Edited size; submitting is disabled while it is out of range. */
  size: Size;
  onSubmit: () => void;
  onClose: () => void;
  children: ReactNode;
};

/** Modal form shared by the size dialogs: fields, then Cancel and submit. */
export function SizeDialog({ title, submitLabel, size, onSubmit, onClose, children }: Props) {
  const valid = isValidSize(size.w) && isValidSize(size.h);
  return (
    <Modal opened centered onClose={onClose} title={title} size="xs">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          onSubmit();
          onClose();
        }}
      >
        <Stack>
          {children}
          <Group justify="flex-end">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!valid}>
              {submitLabel}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
