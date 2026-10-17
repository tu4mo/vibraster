import { Stack } from "@mantine/core";

/** A labelled column of toolbar buttons. */
export function ToolbarGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Stack gap={4} role="group" aria-label={label}>
      {children}
    </Stack>
  );
}
