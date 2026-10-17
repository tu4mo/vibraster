import { Checkbox, NumberInput, Stack } from "@mantine/core";
import { useState } from "react";
import { MAX_SIZE } from "../../editor/canvas.ts";

type Props = {
  width: number;
  height: number;
  onChange: (width: number, height: number) => void;
  /** Aspect ratio (width / height) the lock keeps. Omit to hide the lock. */
  ratio?: number;
  defaultLocked?: boolean;
};

const toNumber = (value: number | string) => (typeof value === "number" ? value : 0);

/** Width/height inputs with an optional aspect-ratio lock. */
export function SizeFields({ width, height, onChange, ratio, defaultLocked = false }: Props) {
  const [locked, setLocked] = useState(defaultLocked);
  const lockedRatio = ratio && locked ? ratio : null;
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
      {ratio && (
        <Checkbox
          label="Keep aspect ratio"
          checked={locked}
          onChange={(e) => setLocked(e.currentTarget.checked)}
        />
      )}
    </Stack>
  );
}
