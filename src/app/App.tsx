import { AppShell, Divider } from "@mantine/core";
import { useElementSize } from "@mantine/hooks";
import { useState, useSyncExternalStore } from "react";
import { CanvasView } from "../components/canvas/CanvasView.tsx";
import { ClipboardButtons } from "../components/toolbar/ClipboardButtons.tsx";
import { FileButtons } from "../components/toolbar/FileButtons.tsx";
import { HistoryButtons } from "../components/toolbar/HistoryButtons.tsx";
import { ImageButtons } from "../components/toolbar/ImageButtons.tsx";
import { Toolbar } from "../components/toolbar/Toolbar.tsx";
import { SelectionBar } from "../components/selection/SelectionBar.tsx";
import { StatusBar } from "../components/statusbar/StatusBar.tsx";
import { ZoomControls } from "../components/statusbar/ZoomControls.tsx";
import { ToolButtons } from "../components/tools/ToolButtons.tsx";
import type { Tool } from "../components/tools/tool.ts";
import { DocumentTabs } from "../components/workspace/DocumentTabs.tsx";
import { StartScreen } from "../components/workspace/StartScreen.tsx";
import { createBlankImage } from "../editor/canvas.ts";
import { Editor } from "../editor/Editor.ts";
import { useDocuments } from "../editor/useDocuments.ts";
import { AppDialogs, type DialogName } from "./AppDialogs.tsx";
import { ImageDropzone } from "./ImageDropzone.tsx";
import { useClipboard } from "./useClipboard.ts";
import { useImageFiles } from "./useImageFiles.ts";
import { useShortcuts } from "./useShortcuts.ts";
import { useZoom } from "./useZoom.ts";

const FOOTER_HEIGHT = 28;
/** Stands in for the active editor while no image is open; never loaded. */
const NO_IMAGE = new Editor();

export default function App() {
  const documents = useDocuments();
  const editor = documents.active?.editor ?? NO_IMAGE;
  const zoom = documents.active?.zoom ?? 1;
  const [tool, setTool] = useState<Tool>("select");
  const [fillColor, setFillColor] = useState("#e5484d");
  const [dialog, setDialog] = useState<DialogName | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { ref: tabListRef, height: tabListHeight } = useElementSize();

  const hasImage = documents.active !== null;
  const hasSelection = useSyncExternalStore(editor.subscribe, editor.hasSelection);
  // The move tool needs a selection; fall back to selecting once it's gone.
  if (tool === "move" && !hasSelection) setTool("select");

  const { viewport, fitZoom, zoomBy, zoomToFit } = useZoom(editor, documents.setZoom);

  /** Open `image` in a new tab, zoomed to fit. */
  const openImage = (image: HTMLCanvasElement, fileName: string) =>
    documents.open(image, fileName, fitZoom(image.width, image.height));

  const files = useImageFiles({ editor, open: openImage, setError });
  const clipboard = useClipboard({
    editor,
    hasImage,
    openFile: files.openFile,
    onPasted: () => setTool("move"),
    setError,
  });

  useShortcuts({
    editor,
    hasImage,
    hasSelection,
    dialogOpen: dialog !== null,
    fillColor,
    setTool,
    chooseFiles: files.chooseFiles,
    copy: clipboard.copy,
    save: files.save,
    zoomBy,
    zoomToFit,
  });

  return (
    <AppShell footer={{ height: FOOTER_HEIGHT }} padding={0}>
      {/* The tab strip only shows with an image open. */}
      <Toolbar top={hasImage ? tabListHeight : 0} bottom={FOOTER_HEIGHT}>
        <FileButtons
          hasImage={hasImage}
          onNew={() => setDialog("new")}
          onOpen={files.chooseFiles}
          onSave={files.save}
        />
        <Divider w="100%" />
        <ToolButtons
          tool={tool}
          onToolChange={setTool}
          hasImage={hasImage}
          hasSelection={hasSelection}
        />
        <Divider w="100%" />
        <HistoryButtons editor={editor} />
        <Divider w="100%" />
        <ClipboardButtons
          editor={editor}
          hasImage={hasImage}
          onCopy={clipboard.copy}
          onPaste={clipboard.paste}
        />
        <Divider w="100%" />
        <ImageButtons
          hasImage={hasImage}
          onImageSize={() => setDialog("image")}
          onCanvasSize={() => setDialog("canvas")}
        />
      </Toolbar>

      {/* Border-box: the full height less the footer padding. */}
      <AppShell.Main h="100dvh">
        {hasImage ? (
          <DocumentTabs
            listRef={tabListRef}
            docs={documents.docs}
            activeId={documents.activeId}
            onSelect={documents.select}
            onClose={documents.close}
          >
            {(doc) => (
              <CanvasView
                // Only the active tab's view is measured to fit the zoom.
                ref={doc === documents.active ? viewport : undefined}
                editor={doc.editor}
                tool={tool}
                zoom={doc.zoom}
                onZoom={zoomBy}
              />
            )}
          </DocumentTabs>
        ) : (
          <StartScreen ref={viewport} onOpen={files.chooseFiles} onNew={() => setDialog("new")} />
        )}
        <SelectionBar
          editor={editor}
          tool={tool}
          fillColor={fillColor}
          onFillColorChange={setFillColor}
        />
      </AppShell.Main>

      <AppShell.Footer>
        <StatusBar editor={editor} error={error}>
          <ZoomControls
            zoom={zoom}
            disabled={!hasImage}
            onZoomBy={zoomBy}
            onActualSize={() => documents.setZoom(1)}
            onFit={zoomToFit}
          />
        </StatusBar>
      </AppShell.Footer>

      <ImageDropzone
        onDrop={(dropped) => {
          for (const file of dropped) void files.openFile(file);
        }}
        onError={setError}
      />

      <AppDialogs
        dialog={dialog}
        editor={editor}
        onCreate={(w, h, fill) => {
          openImage(createBlankImage(w, h, fill), "Untitled");
          setError(null);
        }}
        onClose={() => setDialog(null)}
      />
    </AppShell>
  );
}
