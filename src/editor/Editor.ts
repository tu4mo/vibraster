import {
  type Anchor,
  type Rect,
  clipRect,
  cloneCanvas,
  context2d,
  createCanvas,
  isValidSize,
  resizeCanvasArea,
  scaleCanvas,
} from "./canvas.ts";

type Floating = {
  /** What is drawn: `source` scaled to the selection size and possibly mirrored. */
  canvas: HTMLCanvasElement;
  /** The pixels as first lifted or pasted; scaling always starts from these. */
  source: HTMLCanvasElement;
  x: number;
  y: number;
  flipX: boolean;
  flipY: boolean;
};

type Snapshot = { image: HTMLCanvasElement; selection: Rect | null };

const HISTORY_LIMIT = 50;

/**
 * Holds the document and all editing operations. React subscribes through
 * `subscribe`/`getVersion` (see useEditor); every mutation bumps the version.
 */
export class Editor {
  image: HTMLCanvasElement | null = null;
  fileName = "image";
  selection: Rect | null = null;
  /** Pixels lifted off the image by the move tool, not yet merged back. */
  floating: Floating | null = null;

  private undoStack: Snapshot[] = [];
  private redoStack: Snapshot[] = [];
  private version = 0;
  private listeners = new Set<() => void>();

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getVersion = () => this.version;

  get width() {
    return this.image?.width ?? 0;
  }

  get height() {
    return this.image?.height ?? 0;
  }

  get canUndo() {
    return this.undoStack.length > 0;
  }

  get canRedo() {
    return this.redoStack.length > 0;
  }

  private emit() {
    this.version++;
    for (const listener of this.listeners) listener();
  }

  private pushHistory() {
    if (!this.image) return;
    this.undoStack.push({ image: cloneCanvas(this.image), selection: this.selection });
    if (this.undoStack.length > HISTORY_LIMIT) this.undoStack.shift();
    this.redoStack = [];
  }

  /** Draw the image plus any floating selection into a visible canvas. */
  render(target: HTMLCanvasElement) {
    if (!this.image) return;
    if (target.width !== this.width) target.width = this.width;
    if (target.height !== this.height) target.height = this.height;
    const ctx = context2d(target);
    ctx.clearRect(0, 0, target.width, target.height);
    ctx.drawImage(this.image, 0, 0);
    if (this.floating) ctx.drawImage(this.floating.canvas, this.floating.x, this.floating.y);
  }

  load(image: HTMLCanvasElement, fileName: string) {
    this.image = image;
    this.fileName = fileName.replace(/\.[^.]+$/, "") || "image";
    this.selection = null;
    this.floating = null;
    this.undoStack = [];
    this.redoStack = [];
    this.emit();
  }

  /** Merge floating pixels back into the image. */
  commitFloating() {
    if (!this.floating || !this.image) return;
    context2d(this.image).drawImage(this.floating.canvas, this.floating.x, this.floating.y);
    this.floating = null;
    this.selection = this.selection && clipRect(this.selection, this.width, this.height);
    this.emit();
  }

  setSelection(rect: Rect | null) {
    this.commitFloating();
    this.selection = rect && clipRect(rect, this.width, this.height);
    this.emit();
  }

  selectAll() {
    this.setSelection({ x: 0, y: 0, w: this.width, h: this.height });
  }

  /** The area operations apply to: the selection, or the whole image. */
  private targetRect(): Rect {
    return this.selection ?? { x: 0, y: 0, w: this.width, h: this.height };
  }

  fill(color: string) {
    if (!this.image) return;
    this.commitFloating();
    this.pushHistory();
    const { x, y, w, h } = this.targetRect();
    const ctx = context2d(this.image);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
    this.emit();
  }

  deleteSelection() {
    if (!this.image || !this.selection) return;
    this.commitFloating();
    if (!this.selection) return;
    this.pushHistory();
    const { x, y, w, h } = this.selection;
    context2d(this.image).clearRect(x, y, w, h);
    this.emit();
  }

  /**
   * Lift the selected pixels so they can be moved, filling the gap they leave
   * with `background`. No-op if already lifted.
   */
  beginMove(background: string) {
    if (!this.image || !this.selection || this.floating) return;
    this.pushHistory();
    const { x, y, w, h } = this.selection;
    const canvas = createCanvas(w, h);
    context2d(canvas).drawImage(this.image, x, y, w, h, 0, 0, w, h);
    const ctx = context2d(this.image);
    ctx.fillStyle = background;
    ctx.fillRect(x, y, w, h);
    this.floating = { canvas, source: canvas, x, y, flipX: false, flipY: false };
    this.emit();
  }

  moveFloatingTo(x: number, y: number) {
    if (!this.floating || !this.selection) return;
    this.floating.x = x;
    this.floating.y = y;
    this.selection = { ...this.selection, x, y };
    this.emit();
  }

  /**
   * Scale the floating pixels to fill `rect`, mirrored as given. Always drawn
   * from the original pixels, so repeated scaling doesn't degrade them.
   */
  transformFloating(rect: Rect, flipX: boolean, flipY: boolean) {
    const f = this.floating;
    if (!f || !isValidSize(rect.w) || !isValidSize(rect.h)) return;
    const canvas = createCanvas(rect.w, rect.h);
    const ctx = context2d(canvas);
    ctx.imageSmoothingQuality = "high";
    ctx.translate(flipX ? rect.w : 0, flipY ? rect.h : 0);
    ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
    ctx.drawImage(f.source, 0, 0, rect.w, rect.h);
    this.floating = { ...f, canvas, x: rect.x, y: rect.y, flipX, flipY };
    this.selection = rect;
    this.emit();
  }

  /**
   * The pixels under the selection (or the whole image), including any
   * floating pixels, as a new canvas. Null when there is nothing to copy.
   */
  copySelection(): HTMLCanvasElement | null {
    if (!this.image) return null;
    const area = clipRect(this.targetRect(), this.width, this.height);
    if (!area) return null;
    const out = createCanvas(area.w, area.h);
    const ctx = context2d(out);
    ctx.drawImage(this.image, -area.x, -area.y);
    if (this.floating) {
      ctx.drawImage(this.floating.canvas, this.floating.x - area.x, this.floating.y - area.y);
    }
    return out;
  }

  /**
   * Paste `pasted` as floating pixels, centered on the selection (or the
   * image), so it can be moved before it merges in. Selects the pasted area.
   */
  paste(pasted: HTMLCanvasElement) {
    if (!this.image) return;
    this.commitFloating();
    this.pushHistory();
    const { x, y, w, h } = this.targetRect();
    const px = Math.round(x + (w - pasted.width) / 2);
    const py = Math.round(y + (h - pasted.height) / 2);
    this.floating = { canvas: pasted, source: pasted, x: px, y: py, flipX: false, flipY: false };
    this.selection = { x: px, y: py, w: pasted.width, h: pasted.height };
    this.emit();
  }

  resizeImage(width: number, height: number) {
    if (!this.image) return;
    this.commitFloating();
    this.pushHistory();
    this.image = scaleCanvas(this.image, width, height);
    this.selection = null;
    this.emit();
  }

  resizeCanvas(width: number, height: number, anchor: Anchor, background: string | null) {
    if (!this.image) return;
    this.commitFloating();
    this.pushHistory();
    this.image = resizeCanvasArea(this.image, width, height, anchor, background);
    this.selection = null;
    this.emit();
  }

  undo() {
    // Merge first so redo can bring the move back; the snapshot predates the lift.
    this.commitFloating();
    const snapshot = this.undoStack.pop();
    if (!snapshot || !this.image) return;
    this.redoStack.push({ image: this.image, selection: this.selection });
    this.image = snapshot.image;
    this.selection = snapshot.selection;
    this.emit();
  }

  redo() {
    const snapshot = this.redoStack.pop();
    if (!snapshot || !this.image) return;
    this.undoStack.push({ image: this.image, selection: this.selection });
    this.image = snapshot.image;
    this.selection = snapshot.selection;
    this.emit();
  }

  exportPng(): Promise<Blob | null> {
    this.commitFloating();
    const image = this.image;
    if (!image) return Promise.resolve(null);
    return new Promise((resolve) => image.toBlob(resolve, "image/png"));
  }
}
