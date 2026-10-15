import {
  ActionIcon,
  Center,
  ColorPicker,
  ColorSwatch,
  Group,
  Popover,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { useEyeDropper } from "@mantine/hooks";
import { IconArrowsExchange, IconColorPicker } from "@tabler/icons-react";
import { useState } from "react";
import { Tip } from "./Tip.tsx";

const SWATCHES = [
  "#000000",
  "#ffffff",
  "#868e96",
  "#e5484d",
  "#f76707",
  "#f5c518",
  "#40c057",
  "#22b8cf",
  "#228be6",
  "#7950f2",
  "#be4bdb",
  "#e64980",
];

type Props = {
  foreground: string;
  background: string;
  onForegroundChange: (color: string) => void;
  onBackgroundChange: (color: string) => void;
  onSwap: () => void;
};

/**
 * Fill swatch, swap button and background swatch, stacked. Each is a 34px slot
 * so the column lines up with the tool buttons above it.
 */
export function ColorControls({
  foreground,
  background,
  onForegroundChange,
  onBackgroundChange,
  onSwap,
}: Props) {
  return (
    <>
      <Center w={34} h={34}>
        <ColorButton label="Fill color" color={foreground} onChange={onForegroundChange} />
      </Center>
      <Tip label="Swap colors" shortcut="X" position="right">
        <ActionIcon
          variant="subtle"
          color="gray"
          size="lg"
          aria-label="Swap colors"
          onClick={onSwap}
        >
          <IconArrowsExchange size={16} stroke={1.75} style={{ rotate: "90deg" }} />
        </ActionIcon>
      </Tip>
      <Center w={34} h={34}>
        <ColorButton label="Background color" color={background} onChange={onBackgroundChange} />
      </Center>
    </>
  );
}

type ColorButtonProps = {
  label: string;
  color: string;
  onChange: (color: string) => void;
};

function ColorButton({ label, color, onChange }: ColorButtonProps) {
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
      position="right-start"
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
        {/* Mantine's Tooltip (unlike Tip) forwards the target's ref and click handler. */}
        <Tooltip label={label} position="right" openDelay={300} disabled={opened}>
          <ColorSwatch
            component="button"
            type="button"
            color={color}
            size={18}
            radius="sm"
            aria-label={label}
            onClick={() => setOpened((o) => !o)}
            withShadow={false}
            className="color-swatch"
          />
        </Tooltip>
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
