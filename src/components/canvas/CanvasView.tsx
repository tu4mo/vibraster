import { clamp, useMergedRef } from "@mantine/hooks";
import { memo, useEffect, useRef } from "react";

import type { Editor } from "../../editor/Editor.ts";
import { useEditorVersion } from "../../editor/useEditorVersion.ts";
import type { Tool } from "../tools/tool.ts";
import { SelectionOutline } from "./SelectionOutline.tsx";
import { useAltKey } from "./useAltKey.ts";
import { useCanvasDrag } from "./useCanvasDrag.ts";
import { useClientSize } from "./useClientSize.ts";
import { useZoomAnchor } from "./useZoomAnchor.ts";

/** Zoom at which the pixel grid appears (each image pixel is this many screen pixels). */
const PIXEL_GRID_MIN_ZOOM = 6;
/** Space kept around the image when it fits in the viewport. */
const PADDING = 32;
/** Extra room to scroll past the image edges once it overflows, as a share of the viewport. */
const OVERSCROLL = 0.25;

type Props = {
  editor: Editor;
  tool: Tool;
  zoom: number;
  /** Zoom tool click; the clicked point is kept under the cursor. */
  onZoom: (direction: 1 | -1) => void;
  /** The scrolling viewport, which the parent measures to fit the zoom. */
  ref?: React.Ref<HTMLDivElement>;
};

/**
 * The scrolling viewport with the image in it. The whole viewport is the
 * pointer surface, so a selection can start on the empty area around the image.
 * Memoized so hidden tabs' views skip the parent's re-renders.
 */
export const CanvasView = memo(function CanvasView({ editor, tool, zoom, onZoom, ref }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const mergedViewportRef = useMergedRef(viewportRef, ref);
  const altDown = useAltKey();
  const view = useClientSize(viewportRef);
  const zoomAnchor = useZoomAnchor(zoom, view, stageRef, viewportRef);
  // The editor is mutated in place; subscribing re-renders on its changes.
  useEditorVersion(editor);

  const pointer = useCanvasDrag({
    editor,
    tool,
    zoom,
    canvasRef,
    onZoomClick: (p, e) => {
      zoomAnchor.setAnchor({ imageX: p.x, imageY: p.y, clientX: e.clientX, clientY: e.clientY });
      onZoom(e.altKey ? -1 : 1);
    },
  });

  // Redraw on the editor's changes; selection-only ones don't touch pixels and skip it.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let drawn = -1;
    const draw = () => {
      if (editor.pixelVersion === drawn) return;
      drawn = editor.pixelVersion;
      editor.render(canvas);
    };
    draw();
    return editor.subscribe(draw);
  }, [editor]);

  const sel = editor.selection;
  const stageWidth = editor.width * zoom;
  const stageHeight = editor.height * zoom;

  return (
    <div
      ref={mergedViewportRef}
      className="viewport"
      data-tool={tool}
      data-zoom-out={tool === "zoom" && altDown ? "" : undefined}
      {...pointer}
      onScroll={zoomAnchor.onScroll}
      style={{
        paddingInline: padding(stageWidth, view.width),
        paddingBlock: padding(stageHeight, view.height),
      }}
    >
      <div ref={stageRef} className="stage" style={{ width: stageWidth, height: stageHeight }}>
        <canvas ref={canvasRef} className={zoom > 1 ? "pixelated" : undefined} />
        {zoom >= PIXEL_GRID_MIN_ZOOM && (
          <div className="pixel-grid" style={{ "--cell": `${zoom}px` }} />
        )}
        {sel && (
          <SelectionOutline
            selection={sel}
            zoom={zoom}
            withHandles={tool === "select" || tool === "move"}
          />
        )}
      </div>
    </div>
  );
});

/**
 * Padding on each side of an image `size` px long in a viewport `view` px
 * long. The extra overscroll grows with the overflow, so an image that just
 * fits gets no scrollbar and zooming past that never jumps.
 */
function padding(size: number, view: number) {
  return PADDING + clamp(size + 2 * PADDING - view, 0, view * OVERSCROLL);
}
