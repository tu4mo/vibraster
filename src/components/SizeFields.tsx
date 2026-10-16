import { Checkbox, NumberInput, Stack } from "@mantine/core";
import { MAX_SIZE } from "../editor/canvas.ts";

type Props = {
  width: number;
  height: number;
  /** Aspect ratio to keep (width / height), or null when unlocked. */
  lockedRatio: number | null;
  onChange: (width: number, height: number) => void;
  /** Omit to hide the aspect-ratio checkbox. */
  onLockChange?: (locked: boolean) => void;
};

const toNumber = (value: number | string) => (typeof value === "number" ? value : 0);

/** Width/height inputs with an optional aspect-ratio lock. */
export function SizeFields({ width, height, lockedRatio, onChange, onLockChange }: Props) {
  return (
    <Stack gap="xs">
      <NumberInput
        label="Width"
        suffix=" px"
        min={1}
        max={MAX_SIZE}
        allowDecimal={false}
        allowNegative={false}
        value={width || ""}
        onChange={(value) => {
          const w = toNumber(value);
          onChange(w, lockedRatio ? Math.max(1, Math.round(w / lockedRatio)) : height);
        }}
        data-autofocus
      />
      <NumberInput
        label="Height"
        suffix=" px"
        min={1}
        max={MAX_SIZE}
        allowDecimal={false}
        allowNegative={false}
        value={height || ""}
        onChange={(value) => {
          const h = toNumber(value);
          onChange(lockedRatio ? Math.max(1, Math.round(h * lockedRatio)) : width, h);
        }}
      />
      {onLockChange && (
        <Checkbox
          label="Keep aspect ratio"
          checked={lockedRatio !== null}
          onChange={(e) => onLockChange(e.currentTarget.checked)}
        />
      )}
    </Stack>
  );
}
