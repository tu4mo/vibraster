import type { Rect } from "../../editor/canvas.ts";
import { HANDLES } from "./resizeRect.ts";

import classes from "./SelectionOutline.module.css";

type Props = {
  selection: Rect;
  zoom: number;
  /** Show the side and corner handles for resizing. */
  withHandles: boolean;
};

/** The dotted selection outline, positioned on the stage at the current zoom. */
export function SelectionOutline({ selection, zoom, withHandles }: Props) {
  return (
    <div
      className={classes.selection}
      style={{
        left: selection.x * zoom,
        top: selection.y * zoom,
        width: selection.w * zoom,
        height: selection.h * zoom,
      }}
    >
      {withHandles &&
        HANDLES.map((h) => <div key={h} className={classes.handle} data-handle={h} />)}
    </div>
  );
}
