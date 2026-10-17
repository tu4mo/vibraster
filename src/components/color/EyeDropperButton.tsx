import { ActionIcon } from "@mantine/core";
import { useEyeDropper } from "@mantine/hooks";
import { IconColorPicker } from "@tabler/icons-react";
import { Tip } from "../ui/Tip.tsx";

/** Picks a color from anywhere on screen; renders nothing where unsupported. */
export function EyeDropperButton({ onPick }: { onPick: (color: string) => void }) {
  const eyeDropper = useEyeDropper();
  if (!eyeDropper.supported) return null;

  const pickFromScreen = async () => {
    const result = await eyeDropper.open().catch(() => undefined);
    if (result) onPick(result.sRGBHex);
  };

  return (
    <Tip label="Pick color from screen">
      <ActionIcon variant="default" aria-label="Pick color from screen" onClick={pickFromScreen}>
        <IconColorPicker size={16} />
      </ActionIcon>
    </Tip>
  );
}
