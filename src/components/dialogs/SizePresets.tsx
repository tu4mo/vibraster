import { Button, Group } from "@mantine/core";

type Size = { w: number; h: number };

const PRESETS: Size[] = [
  { w: 800, h: 600 },
  { w: 1280, h: 720 },
  { w: 1920, h: 1080 },
  { w: 1080, h: 1080 },
];

/** The size a new image starts at. */
export const DEFAULT_SIZE = PRESETS[0];

type Props = {
  value: Size;
  onChange: (size: Size) => void;
};

/** Common image sizes, the current one highlighted. */
export function SizePresets({ value, onChange }: Props) {
  return (
    <Group gap={4}>
      {PRESETS.map(({ w, h }) => (
        <Button
          key={`${w}x${h}`}
          variant={value.w === w && value.h === h ? "light" : "default"}
          size="compact-xs"
          onClick={() => onChange({ w, h })}
        >
          {w} × {h}
        </Button>
      ))}
    </Group>
  );
}
