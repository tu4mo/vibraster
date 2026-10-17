import { AppShell, Center, Group, Text, Title } from "@mantine/core";
import { Dropzone, IMAGE_MIME_TYPE } from "@mantine/dropzone";
import { useElementSize, useFileDialog, useHotkeys, useWindowEvent } from "@mantine/hooks";
import { Suspense, lazy, useRef, useState } from "react";
import { CanvasView, type Tool } from "./components/CanvasView.tsx";
import { DocumentTabs } from "./components/DocumentTabs.tsx";
import { MainMenu } from "./components/MainMenu.tsx";
import { SelectionBar } from "./components/SelectionBar.tsx";
import { StartScreen } from "./components/StartScreen.tsx";
import { StatusBar } from "./components/StatusBar.tsx";
import { ToolPalette } from "./components/ToolPalette.tsx";
import { ZoomControls } from "./components/ZoomControls.tsx";
import { canvasToPngBlob, createBlankImage, loadImageFile } from "./editor/canvas.ts";
import { Editor } from "./editor/Editor.ts";
import { useDocuments } from "./editor/useDocuments.ts";

// Dialogs load on first use, which keeps their inputs out of the startup bundle.
const NewImageDialog = lazy(() =>
  import("./components/NewImageDialog.tsx").then((m) => ({ default: m.NewImageDialog })),
);
const ResizeCanvasDialog = lazy(() =>
  import("./components/ResizeCanvasDialog.tsx").then((m) => ({ default: m.ResizeCanvasDialog })),
);
const ResizeImageDialog = lazy(() =>
  import("./components/ResizeImageDialog.tsx").then((m) => ({ default: m.ResizeImageDialog })),
);

const ZOOM_STEPS = [0.05, 0.1, 0.25, 1 / 3, 0.5, 2 / 3, 1, 1.5, 2, 3, 4, 6, 8, 12, 16, 24, 32];
const ACCEPT = "image/png,image/jpeg,image/webp,image/gif,image/bmp";
const HEADER_HEIGHT = 52;
const FOOTER_HEIGHT = 28;
/** Stands in for the active editor while no image is open; never loaded. */
const NO_IMAGE = new Editor();

export default function App() {
  const documents = useDocuments();
  const editor = documents.active?.editor ?? NO_IMAGE;
  const zoom = documents.active?.zoom ?? 1;
  const setZoom = documents.setZoom;
  const [tool, setTool] = useState<Tool>("select");
  const [foreground, setForeground] = useState("#e5484d");
  const [background, setBackground] = useState("#ffffff");
  const [dialog, setDialog] = useState<"new" | "image" | "canvas" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const { ref: tabListRef, height: tabListHeight } = useElementSize();

  const hasImage = documents.active !== null;

  /** Zoom that fits an image of this size (default: the open one) in the viewport. */
  const fitZoom = (width?: number, height?: number) => {
    const w = width ?? editor.width;
    const h = height ?? editor.height;
    const el = viewport.current;
    if (!el || !w || !h) return 1;
    const pad = 64;
    return Math.min(1, (el.clientWidth - pad) / w, (el.clientHeight - pad) / h);
  };

  const openFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError(`"${file.name}" is not an image.`);
      return;
    }
    try {
      const image = await loadImageFile(file);
      documents.open(image, file.name, fitZoom(image.width, image.height));
      setError(null);
    } catch {
      setError(`Could not read "${file.name}".`);
    }
  };

  const fileDialog = useFileDialog({
    accept: ACCEPT,
    multiple: true,
    resetOnOpen: true,
    onChange: (files) => {
      for (const file of files ?? []) void openFile(file);
    },
  });

  const save = async () => {
    let blob;
    try {
      blob = await editor.exportPng();
    } catch {
      setError("Could not save the image.");
      return;
    }
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${editor.fileName}.png`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const zoomBy = (direction: 1 | -1) => {
    setZoom((z) =>
      direction > 0
        ? (ZOOM_STEPS.find((s) => s > z + 1e-6) ?? z)
        : (ZOOM_STEPS.findLast((s) => s < z - 1e-6) ?? z),
    );
  };

  const swapColors = () => {
    setForeground(background);
    setBackground(foreground);
  };

  // Shortcuts only act with an image open and no dialog showing.
  const editing = hasImage && !dialog;
  useHotkeys([
    ["mod+O", () => !dialog && fileDialog.open()],
    ["mod+shift+Z", () => editing && editor.redo()],
    ["mod+Z", () => editing && editor.undo()],
    ["mod+Y", () => editing && editor.redo()],
    [
      "mod+C",
      // Only take over ⌘C with an image open; otherwise let the browser copy text.
      (e) => {
        if (!editing) return;
        e.preventDefault();
        void copy();
      },
      { preventDefault: false },
    ],
    ["mod+A", () => editing && editor.selectAll()],
    ["mod+D", () => editing && editor.setSelection(null)],
    ["mod+S", () => editing && void save()],
    // Zoom in is ⌘= on US keyboards, ⌘+ (Shift+=) there too, and ⌘+ without
    // Shift on layouts with a dedicated + key. Handle them all so the browser
    // never zooms the page instead.
    ["mod+=", () => editing && zoomBy(1)],
    ["mod+[plus]", () => editing && zoomBy(1)],
    ["mod+shift+[plus]", () => editing && zoomBy(1)],
    ["mod+-", () => editing && zoomBy(-1)],
    ["mod+0", () => editing && setZoom(fitZoom())],
    ["Delete", () => editing && editor.deleteSelection()],
    ["Backspace", () => editing && editor.deleteSelection()],
    [
      "Escape",
      // Escape on a focused control (menu, color picker) only closes that control.
      () => editing && document.activeElement === document.body && editor.setSelection(null),
    ],
    ["M", () => editing && setTool("select")],
    ["V", () => editing && setTool("move")],
    ["Z", () => editing && setTool("zoom")],
    ["F", () => editing && editor.fill(foreground)],
    ["X", () => editing && swapColors()],
  ]);

  /** Paste onto the open image as movable pixels, or open it if there is none. */
  const pasteImage = async (blob: Blob) => {
    if (!hasImage) {
      await openFile(new File([blob], "Pasted image.png", { type: blob.type }));
      return;
    }
    try {
      editor.paste(await loadImageFile(blob));
      setTool("move");
      setError(null);
    } catch {
      setError("Could not read the pasted image.");
    }
  };

  /** Copy the selection (or whole image) to the system clipboard as PNG. */
  const copy = async () => {
    const canvas = editor.copySelection();
    if (!canvas) return;
    try {
      // Hand ClipboardItem a promise so the write starts within the user gesture.
      const png = canvasToPngBlob(canvas);
      await navigator.clipboard.write([new ClipboardItem({ "image/png": png })]);
    } catch {
      setError("Could not copy to the clipboard.");
    }
  };

  /** Edit → Paste: read the clipboard directly (the browser may ask for permission). */
  const pasteFromClipboard = async () => {
    try {
      for (const item of await navigator.clipboard.read()) {
        const type = item.types.find((t) => t.startsWith("image/"));
        if (type) return await pasteImage(await item.getType(type));
      }
      setError("The clipboard has no image.");
    } catch {
      setError("Could not read the clipboard. Try ⌘V instead.");
    }
  };

  // ⌘V arrives as a paste event, which needs no clipboard permission.
  useWindowEvent("paste", (e) => {
    const file = [...(e.clipboardData?.files ?? [])].find((f) => f.type.startsWith("image/"));
    if (!file) return;
    e.preventDefault();
    void pasteImage(file);
  });

  return (
    <AppShell header={{ height: HEADER_HEIGHT }} footer={{ height: FOOTER_HEIGHT }} padding={0}>
      <AppShell.Header withBorder={false}>
        <Group h="100%" px="sm" gap="sm" wrap="nowrap">
          <Title order={1} className="brand">
            Vibraster
          </Title>

          <MainMenu
            editor={editor}
            hasImage={hasImage}
            onNew={() => setDialog("new")}
            onOpen={fileDialog.open}
            onSave={save}
            onClose={() => documents.activeId && documents.close(documents.activeId)}
            onCopy={copy}
            onPaste={pasteFromClipboard}
            onImageSize={() => setDialog("image")}
            onCanvasSize={() => setDialog("canvas")}
          />
          <ZoomControls
            zoom={zoom}
            disabled={!hasImage}
            onZoomBy={zoomBy}
            onActualSize={() => setZoom(1)}
            onFit={() => setZoom(fitZoom())}
          />
        </Group>
      </AppShell.Header>

      {hasImage && (
        <ToolPalette
          tool={tool}
          onToolChange={setTool}
          foreground={foreground}
          background={background}
          onForegroundChange={setForeground}
          onBackgroundChange={setBackground}
          onSwapColors={swapColors}
          top={HEADER_HEIGHT + tabListHeight}
          bottom={FOOTER_HEIGHT}
        />
      )}

      {/* Border-box: the full height less the header and footer padding. */}
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
                background={background}
                onZoom={zoomBy}
              />
            )}
          </DocumentTabs>
        ) : (
          <StartScreen ref={viewport} onOpen={fileDialog.open} onNew={() => setDialog("new")} />
        )}
        <SelectionBar editor={editor} foreground={foreground} />
      </AppShell.Main>

      <AppShell.Footer>
        <StatusBar editor={editor} error={error} />
      </AppShell.Footer>

      <Dropzone.FullScreen
        accept={IMAGE_MIME_TYPE}
        activateOnClick={false}
        onDrop={(files) => {
          for (const file of files) void openFile(file);
        }}
        onReject={(rejections) =>
          setError(`"${rejections[0]?.file.name ?? "File"}" is not a supported image.`)
        }
      >
        <Center h="100%">
          <Text size="xl">Drop images to open</Text>
        </Center>
      </Dropzone.FullScreen>

      <Suspense>
        {dialog === "image" && (
          <ResizeImageDialog
            width={editor.width}
            height={editor.height}
            onApply={(w, h) => editor.resizeImage(w, h)}
            onClose={() => setDialog(null)}
          />
        )}
        {dialog === "new" && (
          <NewImageDialog
            background={background}
            onCreate={(w, h, fill) => {
              documents.open(createBlankImage(w, h, fill), "Untitled", fitZoom(w, h));
              setError(null);
            }}
            onClose={() => setDialog(null)}
          />
        )}
        {dialog === "canvas" && (
          <ResizeCanvasDialog
            width={editor.width}
            height={editor.height}
            background={background}
            onApply={(w, h, anchor, bg) => editor.resizeCanvas(w, h, anchor, bg)}
            onClose={() => setDialog(null)}
          />
        )}
      </Suspense>
    </AppShell>
  );
}
