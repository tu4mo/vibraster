import type { CSSProperties } from "react";

declare module "react" {
  /** Allows CSS custom properties, such as `--cell`, in inline styles. */
  interface CSSProperties {
    [variable: `--${string}`]: string | number | undefined;
  }
}
