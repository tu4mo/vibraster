import {
  type Anchor,
  type Rect,
  canvasToPngBlob,
  clipRect,
  cloneCanvas,
  context2d,
  createCanvas,
  isValidSize,
  resizeCanvasArea,
  sameRect,
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
  /** Bumped only when the rendered pixels change, not for selection-only changes. */
  pixelVersion = 0;

  private undoStack: Snapshot[] = [];
  private redoStack: Snapshot[] = [];
  private version = 0;
  private listeners = new Set<() => void>();

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getVersion = () => this.version;

  /** Bound like `getVersion`, for `useSyncExternalStore` snapshots. */
  hasSelection = () => this.selection !== null;

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

  private emit(pixelsChanged = true) {
    this.version++;
    if (pixelsChanged) this.pixelVersion++;
    for (const listener of this.listeners) listener();
  }

  /**
   * Record the current state for undo. Pass `copy: false` when the operation
   * replaces the image rather than drawing into it, so no copy is needed.
   */
  private pushHistory(copy = true) {
    if (!this.image) return;
    const image = copy ? cloneCanvas(this.image) : this.image;
    this.undoStack.push({ image, selection: this.selection });
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

  /**
   * Merge floating pixels back into the image, without notifying; callers
   * emit once for the whole operation. Returns whether anything was merged.
   */
  private mergeFloating() {
    if (!this.floating || !this.image) return false;
    context2d(this.image).drawImage(this.floating.canvas, this.floating.x, this.floating.y);
    this.floating = null;
    this.selection = this.selection && clipRect(this.selection, this.width, this.height);
    return true;
  }

  setSelection(rect: Rect | null) {
    const next = rect && clipRect(rect, this.width, this.height);
    if (!this.floating && sameRect(next, this.selection)) return;
    // Merging draws the same picture, so the pixels on screen don't change.
    this.mergeFloating();
    this.selection = next;
    this.emit(false);
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
    this.mergeFloating();
    this.pushHistory();
    const { x, y, w, h } = this.targetRect();
    const ctx = context2d(this.image);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
    this.emit();
  }

  deleteSelection() {
    if (!this.image) return;
    this.mergeFloating();
    // Checked after merging, which can clip the selection away.
    if (!this.selection) return;
    this.pushHistory();
    const { x, y, w, h } = this.selection;
    context2d(this.image).clearRect(x, y, w, h);
    this.emit();
  }

  /**
   * Lift the selected pixels so they can be moved, leaving a transparent gap.
   * No-op if already lifted.
   */
  beginMove() {
    if (!this.image || !this.selection || this.floating) return;
    this.pushHistory();
    const { x, y, w, h } = this.selection;
    const canvas = createCanvas(w, h);
    context2d(canvas).drawImage(this.image, x, y, w, h, 0, 0, w, h);
    context2d(this.image).clearRect(x, y, w, h);
    this.floating = { canvas, source: canvas, x, y, flipX: false, flipY: false };
    this.emit();
  }

  moveFloatingTo(x: number, y: number) {
    if (!this.floating || !this.selection) return;
    if (this.floating.x === x && this.floating.y === y) return;
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
    if (sameRect(rect, this.selection) && flipX === f.flipX && flipY === f.flipY) return;
    this.drawFloating(rect, flipX, flipY);
  }

  /** Redraw the floating pixels from their source into `rect`, mirrored as given. */
  private drawFloating(rect: Rect, flipX: boolean, flipY: boolean) {
    const f = this.floating;
    if (!f) return;
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

  /** Mirror the selected pixels in place, lifting them first if needed. */
  flipSelection(axis: "horizontal" | "vertical") {
    this.beginMove();
    const f = this.floating;
    if (!f || !this.selection) return;
    const horizontal = axis === "horizontal";
    this.transformFloating(
      this.selection,
      horizontal ? !f.flipX : f.flipX,
      horizontal ? f.flipY : !f.flipY,
    );
  }

  /**
   * Turn the selected pixels a quarter turn about their center, lifting them
   * first if needed. Rotates the original pixels, so it stays lossless.
   */
  rotateSelection(direction: "clockwise" | "counterclockwise") {
    this.beginMove();
    const f = this.floating;
    const sel = this.selection;
    if (!f || !sel) return;
    const { width: w, height: h } = f.source;
    const source = createCanvas(h, w);
    const ctx = context2d(source);
    if (direction === "clockwise") {
      ctx.translate(h, 0);
      ctx.rotate(Math.PI / 2);
    } else {
      ctx.translate(0, w);
      ctx.rotate(-Math.PI / 2);
    }
    ctx.drawImage(f.source, 0, 0);
    // A quarter turn swaps the axes, so a mirror on one becomes one on the other.
    // Drawn even when the rect and flips come out the same, as a square's would.
    this.floating = { ...f, source };
    this.drawFloating(
      {
        x: Math.round(sel.x + (sel.w - sel.h) / 2),
        y: Math.round(sel.y + (sel.h - sel.w) / 2),
        w: sel.h,
        h: sel.w,
      },
      f.flipY,
      f.flipX,
    );
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
    this.mergeFloating();
    this.pushHistory();
    const { x, y, w, h } = this.targetRect();
    const px = Math.round(x + (w - pasted.width) / 2);
    const py = Math.round(y + (h - pasted.height) / 2);
    this.floating = { canvas: pasted, source: pasted, x: px, y: py, flipX: false, flipY: false };
    this.selection = { x: px, y: py, w: pasted.width, h: pasted.height };
    this.emit();
  }

  resizeImage(width: number, height: number) {
    this.replaceImage((image) => scaleCanvas(image, width, height));
  }

  resizeCanvas(width: number, height: number, anchor: Anchor, background: string | null) {
    this.replaceImage((image) => resizeCanvasArea(image, width, height, anchor, background));
  }

  /** Swap in a new image made from the current one, and drop the selection. */
  private replaceImage(make: (image: HTMLCanvasElement) => HTMLCanvasElement) {
    if (!this.image) return;
    this.mergeFloating();
    // `make` leaves the current image untouched, so history can keep it as is.
    this.pushHistory(false);
    this.image = make(this.image);
    this.selection = null;
    this.emit();
  }

  undo() {
    // Merge first so redo can bring the move back; the snapshot predates the lift.
    this.mergeFloating();
    this.restore(this.undoStack, this.redoStack);
  }

  redo() {
    this.restore(this.redoStack, this.undoStack);
  }

  /** Restore the latest snapshot in `from`, saving the current state to `to`. */
  private restore(from: Snapshot[], to: Snapshot[]) {
    const snapshot = from.pop();
    if (!snapshot || !this.image) return;
    to.push({ image: this.image, selection: this.selection });
    this.image = snapshot.image;
    this.selection = snapshot.selection;
    this.emit();
  }

  /** The image as PNG, with any floating pixels merged in. */
  async exportPng(): Promise<Blob | null> {
    if (this.mergeFloating()) this.emit();
    return this.image && canvasToPngBlob(this.image);
  }
}
