import { TextInput } from "@mantine/core";
import { useState } from "react";

type Props = {
  label: string;
  color: string;
  onChange: (color: string) => void;
};

/** A hex color field that reports only complete `#rrggbb` values. */
export function HexInput({ label, color, onChange }: Props) {
  // Text being typed; null shows the current color.
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <TextInput
      size="xs"
      flex={1}
      aria-label={label}
      value={draft ?? color}
      onChange={(e) => {
        const value = e.currentTarget.value;
        setDraft(value);
        if (/^#[0-9a-f]{6}$/i.test(value)) onChange(value.toLowerCase());
      }}
      onBlur={() => setDraft(null)}
    />
  );
}
