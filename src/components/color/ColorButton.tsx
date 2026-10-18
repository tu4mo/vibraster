import {
  ColorPicker,
  ColorSwatch,
  Group,
  Popover,
  type PopoverProps,
  Stack,
  Text,
} from "@mantine/core";
import { useState } from "react";

import { Tip } from "../ui/Tip.tsx";
import { EyeDropperButton } from "./EyeDropperButton.tsx";
import { HexInput } from "./HexInput.tsx";
import { SWATCHES } from "./swatches.ts";

type Props = {
  label: string;
  color: string;
  onChange: (color: string) => void;
  /** Where the picker and tooltip open from the swatch. */
  position?: PopoverProps["position"];
};

/** A color swatch that opens a picker with presets, a hex field and an eyedropper. */
export function ColorButton({ label, color, onChange, position = "top" }: Props) {
  const [opened, setOpened] = useState(false);

  return (
    <Popover
      position={position}
      withArrow
      shadow="md"
      opened={opened}
      onChange={setOpened}
      onDismiss={() => setOpened(false)}
      trapFocus
      returnFocus
    >
      <Popover.Target>
        <Tip label={label} position={position} disabled={opened}>
          <ColorSwatch
            component="button"
            type="button"
            color={color}
            size={16}
            radius="sm"
            aria-label={label}
            onClick={() => setOpened((o) => !o)}
            withShadow={false}
            className="color-swatch"
          />
        </Tip>
      </Popover.Target>
      <Popover.Dropdown>
        <Stack gap="xs">
          <Text size="xs" fw={500}>
            {label}
          </Text>
          <ColorPicker
            format="hex"
            value={color}
            onChange={onChange}
            swatches={SWATCHES}
            swatchesPerRow={6}
          />
          {/* Unmounted while closed, so an unfinished hex value is dropped on close. */}
          <Group gap={4} wrap="nowrap">
            <HexInput label={`${label} hex value`} color={color} onChange={onChange} />
            <EyeDropperButton onPick={onChange} />
          </Group>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}
