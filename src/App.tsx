import {
  ActionBar,
  ActionIcon,
  AppShell,
  Button,
  Center,
  ColorSwatch,
  Divider,
  EmptyState,
  Group,
  Menu,
  Menubar,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { Dropzone, IMAGE_MIME_TYPE } from "@mantine/dropzone";
import { useFileDialog, useHotkeys } from "@mantine/hooks";
import {
  IconArrowBackUp,
  IconArrowForwardUp,
  IconArrowsMove,
  IconDeviceFloppy,
  IconEraser,
  IconFolderOpen,
  IconFrame,
  IconMarquee2,
  IconMinus,
  IconPhoto,
  IconPlus,
  IconResize,
  IconSelectAll,
  IconZoomIn,
  IconZoomScan,
} from "@tabler/icons-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { CanvasView, type Tool } from "./components/CanvasView.tsx";
import { ColorControls } from "./components/ColorControls.tsx";
import { ResizeCanvasDialog } from "./components/ResizeCanvasDialog.tsx";
import { ResizeImageDialog } from "./components/ResizeImageDialog.tsx";
import { Tip } from "./components/Tip.tsx";
import { loadImageFile } from "./editor/canvas.ts";
import { useEditor } from "./editor/useEditor.ts";

const ZOOM_STEPS = [0.05, 0.1, 0.25, 1 / 3, 0.5, 2 / 3, 1, 1.5, 2, 3, 4, 6, 8, 12, 16, 24, 32];
const ACCEPT = "image/png,image/jpeg,image/webp,image/gif,image/bmp";
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
  const [dialog, setDialog] = useState<"image" | "canvas" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const viewport = useRef<HTMLDivElement>(null);

  const hasImage = editor.image !== null;
  const hasSelection = editor.selection !== null;

  const fitZoom = useCallback(
    (width = editor.width, height = editor.height) => {
      const el = viewport.current;
      if (!el || !width || !height) return 1;
      const pad = 64;
      return Math.min(1, (el.clientWidth - pad) / width, (el.clientHeight - pad) / height);
    },
    [editor],
  );

  const openFile = useCallback(
    async (file: File) => {
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
    },
    [editor, fitZoom],
  );

  const fileDialog = useFileDialog({
    accept: ACCEPT,
    multiple: false,
    resetOnOpen: true,
    onChange: (files) => files?.[0] && void openFile(files[0]),
  });

  const save = useCallback(async () => {
    const blob = await editor.exportPng();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${editor.fileName}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }, [editor]);

  const zoomBy = useCallback((direction: 1 | -1) => {
    setZoom((z) =>
      direction > 0
        ? (ZOOM_STEPS.find((s) => s > z + 1e-6) ?? z)
        : (ZOOM_STEPS.findLast((s) => s < z - 1e-6) ?? z),
    );
  }, []);

  /** Image point to keep under the cursor after a zoom tool click. */
  const zoomAnchor = useRef<{ imageX: number; imageY: number; clientX: number; clientY: number }>(
    null,
  );

  const zoomAt = useCallback(
    (direction: 1 | -1, imageX: number, imageY: number, clientX: number, clientY: number) => {
      zoomAnchor.current = { imageX, imageY, clientX, clientY };
      zoomBy(direction);
    },
    [zoomBy],
  );

  // After a zoom tool click, scroll so the clicked point stays under the cursor.
  useLayoutEffect(() => {
    const anchor = zoomAnchor.current;
    const stage = viewport.current?.querySelector(".stage");
    zoomAnchor.current = null;
    if (!anchor || !stage || !viewport.current) return;
    const rect = stage.getBoundingClientRect();
    viewport.current.scrollLeft += rect.left + anchor.imageX * zoom - anchor.clientX;
    viewport.current.scrollTop += rect.top + anchor.imageY * zoom - anchor.clientY;
  }, [zoom]);

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
    ["mod+A", () => editing && editor.selectAll()],
    ["mod+D", () => editing && editor.setSelection(null)],
    ["mod+S", () => editing && void save()],
    ["mod+=", () => editing && zoomBy(1)],
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

  // Paste an image from the clipboard.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const file = [...(e.clipboardData?.files ?? [])].find((f) => f.type.startsWith("image/"));
      if (file) void openFile(file);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [openFile]);

  return (
    <AppShell
      header={{ height: 52 }}
      // 34px buttons + 8px padding each side + 1px border.
      navbar={{ width: 51, breakpoint: 0 }}
      footer={{ height: 28 }}
      padding={0}
    >
      <AppShell.Header>
        <Group h="100%" px="sm" gap="sm" wrap="nowrap">
          <Title order={1} className="brand">
            Vibraster
          </Title>

          <Menubar>
            <Menubar.Menu>
              <Menubar.Target>File</Menubar.Target>
              <Menubar.Dropdown>
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
                w={60}
                onClick={() => setZoom(1)}
                disabled={!hasImage}
                className="zoom-level"
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

      <AppShell.Navbar p={8}>
        <Stack gap={4} align="center">
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
      </AppShell.Navbar>

      <AppShell.Main className="main">
        <div
          ref={viewport}
          className="viewport"
          onPointerDown={(e) => {
            // A click on the empty area around the image (not on the image) deselects.
            if (e.target === e.currentTarget && e.button === 0) editor.setSelection(null);
          }}
        >
          {hasImage ? (
            <CanvasView
              editor={editor}
              version={version}
              tool={tool}
              zoom={zoom}
              background={background}
              onZoomAt={zoomAt}
            />
          ) : (
            <Center flex={1}>
              <EmptyState
                icon={<IconPhoto size={32} stroke={1.5} />}
                withIndicatorBackground
                title="Open an image"
                description="PNG, JPEG, WebP or GIF. You can also drop a file anywhere or paste one."
              >
                <Button
                  mt="md"
                  leftSection={<IconFolderOpen size={16} />}
                  onClick={fileDialog.open}
                >
                  Choose file
                </Button>
              </EmptyState>
            </Center>
          )}
        </div>
        <div className="action-bar-dock">
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
        </div>
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
              {editor.selection && (
                <Text size="xs" c="dimmed">
                  Selection {editor.selection.w} × {editor.selection.h} at {editor.selection.x},{" "}
                  {editor.selection.y}
                </Text>
              )}
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

      {dialog === "image" && (
        <ResizeImageDialog
          width={editor.width}
          height={editor.height}
          onApply={(w, h) => editor.resizeImage(w, h)}
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
    </AppShell>
  );
}
