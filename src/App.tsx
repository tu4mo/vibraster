import {
  ActionBar,
  ActionIcon,
  AppShell,
  Button,
  Center,
  ColorSwatch,
  Divider,
  FloatingWindow,
  EmptyState,
  Group,
  Menu,
  Menubar,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { Dropzone, IMAGE_MIME_TYPE } from "@mantine/dropzone";
import {
  type SetFloatingWindowPosition,
  clamp,
  useFileDialog,
  useHotkeys,
  useWindowEvent,
} from "@mantine/hooks";
import {
  IconArrowBackUp,
  IconArrowForwardUp,
  IconArrowsMove,
  IconDeviceFloppy,
  IconEraser,
  IconClipboard,
  IconCopy,
  IconFilePlus,
  IconFolderOpen,
  IconFrame,
  IconGripHorizontal,
  IconMarquee2,
  IconMinus,
  IconPhoto,
  IconPlus,
  IconResize,
  IconSelectAll,
  IconZoomIn,
  IconZoomScan,
} from "@tabler/icons-react";
import { Suspense, lazy, useRef, useState } from "react";
import { CanvasView, type Tool } from "./components/CanvasView.tsx";
import { ColorControls } from "./components/ColorControls.tsx";
import { Tip } from "./components/Tip.tsx";
import { canvasToPngBlob, createBlankImage, loadImageFile } from "./editor/canvas.ts";
import { useEditor } from "./editor/useEditor.ts";

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
/** Gap kept between the tool palette and the window, header and status bar. */
const PALETTE_MARGIN = 8;
const ICON = { size: 18, stroke: 1.75 };
const MENU_ICON = { size: 16, stroke: 1.75 };

function Shortcut({ keys }: { keys: string }) {
  return (
    <Text size="xs" c="dimmed">
      {keys}
    </Text>
  );
}

const TOOLS: { value: Tool; label: string; shortcut: string; icon: typeof IconMarquee2 }[] = [
  { value: "select", label: "Rectangle select", shortcut: "M", icon: IconMarquee2 },
  { value: "move", label: "Move selection", shortcut: "V", icon: IconArrowsMove },
  { value: "zoom", label: "Zoom (⌥-click to zoom out)", shortcut: "Z", icon: IconZoomIn },
];

export default function App() {
  const [editor, version] = useEditor();
  const [tool, setTool] = useState<Tool>("select");
  const [zoom, setZoom] = useState(1);
  const [foreground, setForeground] = useState("#e5484d");
  const [background, setBackground] = useState("#ffffff");
  const [dialog, setDialog] = useState<"new" | "image" | "canvas" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const palette = useRef<HTMLDivElement>(null);
  const setPalettePosition = useRef<SetFloatingWindowPosition>(null);

  // FloatingWindow only keeps the palette inside the browser window; also keep
  // it off the header and status bar. This runs in the same drag step that
  // moved it, before paint, so the correction never shows. Setting the
  // position calls back here once more, with nothing left to correct.
  const keepPaletteBelowHeader = ({ y }: { y: number }) => {
    const el = palette.current;
    if (!el) return;
    const min = HEADER_HEIGHT + PALETTE_MARGIN;
    const max = window.innerHeight - FOOTER_HEIGHT - PALETTE_MARGIN - el.offsetHeight;
    const clamped = clamp(y, min, max);
    if (clamped !== y) setPalettePosition.current?.({ top: clamped });
  };

  const hasImage = editor.image !== null;
  const hasSelection = editor.selection !== null;

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
      editor.load(image, file.name);
      setZoom(fitZoom(image.width, image.height));
      setError(null);
    } catch {
      setError(`Could not read "${file.name}".`);
    }
  };

  const fileDialog = useFileDialog({
    accept: ACCEPT,
    multiple: false,
    resetOnOpen: true,
    onChange: (files) => files?.[0] && void openFile(files[0]),
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
    if (!editor.image) {
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
      <AppShell.Header>
        <Group h="100%" px="sm" gap="sm" wrap="nowrap">
          <Title order={1} className="brand">
            Vibraster
          </Title>

          <Menubar>
            <Menubar.Menu>
              <Menubar.Target>File</Menubar.Target>
              <Menubar.Dropdown>
                {/* No ⌘N: Chrome reserves it for a new window and pages can't override it. */}
                <Menu.Item
                  leftSection={<IconFilePlus {...MENU_ICON} />}
                  onClick={() => setDialog("new")}
                >
                  New…
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconFolderOpen {...MENU_ICON} />}
                  rightSection={<Shortcut keys="⌘O" />}
                  onClick={fileDialog.open}
                >
                  Open…
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconDeviceFloppy {...MENU_ICON} />}
                  rightSection={<Shortcut keys="⌘S" />}
                  onClick={save}
                  disabled={!hasImage}
                >
                  Save as PNG
                </Menu.Item>
              </Menubar.Dropdown>
            </Menubar.Menu>

            <Menubar.Menu>
              <Menubar.Target>Edit</Menubar.Target>
              <Menubar.Dropdown>
                <Menu.Item
                  leftSection={<IconArrowBackUp {...MENU_ICON} />}
                  rightSection={<Shortcut keys="⌘Z" />}
                  onClick={() => editor.undo()}
                  disabled={!editor.canUndo}
                >
                  Undo
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconArrowForwardUp {...MENU_ICON} />}
                  rightSection={<Shortcut keys="⇧⌘Z" />}
                  onClick={() => editor.redo()}
                  disabled={!editor.canRedo}
                >
                  Redo
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  leftSection={<IconCopy {...MENU_ICON} />}
                  rightSection={<Shortcut keys="⌘C" />}
                  onClick={copy}
                  disabled={!hasImage}
                >
                  {hasSelection ? "Copy" : "Copy image"}
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconClipboard {...MENU_ICON} />}
                  rightSection={<Shortcut keys="⌘V" />}
                  onClick={pasteFromClipboard}
                >
                  Paste
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  leftSection={<IconSelectAll {...MENU_ICON} />}
                  rightSection={<Shortcut keys="⌘A" />}
                  onClick={() => editor.selectAll()}
                  disabled={!hasImage}
                >
                  Select all
                </Menu.Item>
              </Menubar.Dropdown>
            </Menubar.Menu>

            <Menubar.Menu>
              <Menubar.Target>Image</Menubar.Target>
              <Menubar.Dropdown>
                <Menu.Item
                  leftSection={<IconResize {...MENU_ICON} />}
                  onClick={() => setDialog("image")}
                  disabled={!hasImage}
                >
                  Image size…
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconFrame {...MENU_ICON} />}
                  onClick={() => setDialog("canvas")}
                  disabled={!hasImage}
                >
                  Canvas size…
                </Menu.Item>
              </Menubar.Dropdown>
            </Menubar.Menu>
          </Menubar>

          <Group gap={2} wrap="nowrap" ml="auto">
            <Tip label="Zoom out" shortcut="⌘−">
              <ActionIcon
                variant="subtle"
                color="gray"
                aria-label="Zoom out"
                onClick={() => zoomBy(-1)}
                disabled={!hasImage}
              >
                <IconMinus size={16} />
              </ActionIcon>
            </Tip>
            <Tip label="Actual size">
              <Button
                variant="subtle"
                color="gray"
                size="compact-sm"
                w={72}
                onClick={() => setZoom(1)}
                disabled={!hasImage}
                className="tabular"
              >
                {Math.round(zoom * 100)}%
              </Button>
            </Tip>
            <Tip label="Zoom in" shortcut="⌘=">
              <ActionIcon
                variant="subtle"
                color="gray"
                aria-label="Zoom in"
                onClick={() => zoomBy(1)}
                disabled={!hasImage}
              >
                <IconPlus size={16} />
              </ActionIcon>
            </Tip>
            <Tip label="Fit to window" shortcut="⌘0">
              <ActionIcon
                variant="subtle"
                color="gray"
                aria-label="Fit to window"
                onClick={() => setZoom(fitZoom())}
                disabled={!hasImage}
              >
                <IconZoomScan size={16} />
              </ActionIcon>
            </Tip>
          </Group>
        </Group>
      </AppShell.Header>

      {/* Tool palette: drag it by the grip at the top. */}
      <FloatingWindow
        withBorder
        shadow="md"
        radius="md"
        p={8}
        ref={palette}
        initialPosition={{ top: HEADER_HEIGHT + PALETTE_MARGIN, left: 0 }}
        constrainToViewport
        constrainOffset={PALETTE_MARGIN}
        onPositionChange={keepPaletteBelowHeader}
        setPositionRef={setPalettePosition}
        dragHandleSelector=".palette-grip"
        // Above the app shell (100) but below modals (200) and popovers/tooltips (300).
        zIndex={150}
        aria-label="Tools"
      >
        <Stack gap={4} align="center">
          <Center className="palette-grip" w={34} h={12} aria-hidden>
            <IconGripHorizontal size={14} />
          </Center>
          <Stack gap={4} role="radiogroup" aria-label="Tools">
            {TOOLS.map(({ value, label, shortcut, icon: Icon }) => (
              <Tip key={value} label={label} shortcut={shortcut} position="right">
                <ActionIcon
                  size="lg"
                  variant={tool === value ? "filled" : "subtle"}
                  color={tool === value ? "blue" : "gray"}
                  role="radio"
                  aria-checked={tool === value}
                  aria-label={label}
                  onClick={() => setTool(value)}
                  disabled={!hasImage}
                >
                  <Icon {...ICON} />
                </ActionIcon>
              </Tip>
            ))}
          </Stack>
          {/* One 4px rhythm for everything in the column, divider included. */}
          <Divider w="100%" />
          <ColorControls
            foreground={foreground}
            background={background}
            onForegroundChange={setForeground}
            onBackgroundChange={setBackground}
            onSwap={swapColors}
          />
        </Stack>
      </FloatingWindow>

      <AppShell.Main>
        {hasImage ? (
          <CanvasView
            ref={viewport}
            editor={editor}
            version={version}
            tool={tool}
            zoom={zoom}
            background={background}
            onZoom={zoomBy}
          />
        ) : (
          <div ref={viewport} className="viewport">
            <Center flex={1}>
              <EmptyState
                icon={<IconPhoto size={32} stroke={1.5} />}
                withIndicatorBackground
                title="Open or create an image"
                description="PNG, JPEG, WebP or GIF. You can also drop a file anywhere or paste one."
              >
                <Group mt="md" gap="xs" justify="center">
                  <Button leftSection={<IconFolderOpen size={16} />} onClick={fileDialog.open}>
                    Choose file
                  </Button>
                  <Button
                    variant="default"
                    leftSection={<IconFilePlus size={16} />}
                    onClick={() => setDialog("new")}
                  >
                    New image
                  </Button>
                </Group>
              </EmptyState>
            </Center>
          </div>
        )}
        {/* Mantine positions this itself, fixed above the status bar. */}
        <ActionBar opened={hasSelection} onClose={() => editor.setSelection(null)} shadow="md">
          <Text size="sm" c="dimmed" className="tabular">
            {editor.selection?.w} × {editor.selection?.h}
          </Text>
          <ActionBar.Divider />
          <Button
            variant="subtle"
            color="gray"
            size="compact-sm"
            leftSection={<ColorSwatch color={foreground} size={14} />}
            onClick={() => editor.fill(foreground)}
          >
            Fill
          </Button>
          <Button
            variant="subtle"
            color="red"
            size="compact-sm"
            leftSection={<IconEraser size={16} />}
            onClick={() => editor.deleteSelection()}
          >
            Delete
          </Button>
          <ActionBar.Divider />
          <ActionBar.CloseButton aria-label="Deselect" />
        </ActionBar>
      </AppShell.Main>

      <AppShell.Footer>
        <Group h="100%" px="sm" gap="lg" wrap="nowrap" className="statusbar">
          {error ? (
            <Text size="xs" c="red">
              {error}
            </Text>
          ) : hasImage ? (
            <>
              <Text size="xs" c="dimmed">
                {editor.fileName}
              </Text>
              <Text size="xs" c="dimmed">
                {editor.width} × {editor.height} px
              </Text>
            </>
          ) : (
            <Text size="xs" c="dimmed">
              No image
            </Text>
          )}
        </Group>
      </AppShell.Footer>

      <Dropzone.FullScreen
        accept={IMAGE_MIME_TYPE}
        multiple={false}
        activateOnClick={false}
        onDrop={(files) => files[0] && void openFile(files[0])}
        onReject={(rejections) =>
          setError(`"${rejections[0]?.file.name ?? "File"}" is not a supported image.`)
        }
      >
        <Center h="100%">
          <Text size="xl">Drop image to open</Text>
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
              editor.load(createBlankImage(w, h, fill), "Untitled");
              setZoom(fitZoom(w, h));
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
