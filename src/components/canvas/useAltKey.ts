import { useWindowEvent } from "@mantine/hooks";
import { useState } from "react";

/** Tracks whether Option/Alt is held, for the zoom-out cursor. */
export function useAltKey() {
  const [down, setDown] = useState(false);
  useWindowEvent("keydown", (e) => setDown(e.altKey));
  useWindowEvent("keyup", (e) => setDown(e.altKey));
  useWindowEvent("blur", () => setDown(false));
  return down;
}
