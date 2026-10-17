import { ColorInput, Input, SegmentedControl, Stack } from "@mantine/core";
import { useState } from "react";
import { SWATCHES } from "./swatches.ts";

type Props = {
  label: string;
  /** The fill color, or null for transparent. */
  value: string | null;
  onChange: (value: string | null) => void;
};

/** Choose between a solid color (picked here) and transparency. */
export function FillField({ label, value, onChange }: Props) {
  // Kept while transparent is chosen, so switching back restores it.
  const [color, setColor] = useState(value ?? "#ffffff");

  return (
    <Input.Wrapper label={label}>
      <Stack gap={6} mt={4}>
        <SegmentedControl
          fullWidth
          value={value === null ? "transparent" : "color"}
          onChange={(mode) => onChange(mode === "color" ? color : null)}
          data={[
            { value: "color", label: "Color" },
            { value: "transparent", label: "Transparent" },
          ]}
        />
        {value !== null && (
          <ColorInput
            aria-label={`${label} color`}
            format="hex"
            value={value}
            onChange={(c) => {
              setColor(c);
              onChange(c);
            }}
            swatches={SWATCHES}
            swatchesPerRow={6}
          />
        )}
      </Stack>
    </Input.Wrapper>
  );
}
