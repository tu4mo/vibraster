import {
  ActionIcon,
  ColorPicker,
  ColorSwatch,
  Group,
  Popover,
  type PopoverProps,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { useEyeDropper } from "@mantine/hooks";
import { IconColorPicker } from "@tabler/icons-react";
import { useState } from "react";
import { SWATCHES } from "./swatches.ts";
import { Tip } from "./Tip.tsx";

type Props = {
  label: string;
  color: string;
  onChange: (color: string) => void;
  /** Where the picker and tooltip open from the swatch. */
  position?: PopoverProps["position"];
};

/** A color swatch that opens a picker with presets, a hex field and an eyedropper. */
export function ColorButton({ label, color, onChange, position = "top" }: Props) {
  const eyeDropper = useEyeDropper();
  // Text being typed into the hex field; null shows the current color.
  const [draft, setDraft] = useState<string | null>(null);
  const [opened, setOpened] = useState(false);

  const pickFromScreen = async () => {
    const result = await eyeDropper.open().catch(() => undefined);
    if (result) onChange(result.sRGBHex);
  };

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
      onClose={() => setDraft(null)}
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
          <Group gap={4} wrap="nowrap">
            <TextInput
              size="xs"
              flex={1}
              aria-label={`${label} hex value`}
              value={draft ?? color}
              onChange={(e) => {
                const value = e.currentTarget.value;
                setDraft(value);
                if (/^#[0-9a-f]{6}$/i.test(value)) onChange(value.toLowerCase());
              }}
              onBlur={() => setDraft(null)}
            />
            {eyeDropper.supported && (
              <Tip label="Pick color from screen">
                <ActionIcon
                  variant="default"
                  aria-label="Pick color from screen"
                  onClick={pickFromScreen}
                >
                  <IconColorPicker size={16} />
                </ActionIcon>
              </Tip>
            )}
          </Group>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}
