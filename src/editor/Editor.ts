import {
  type Anchor,
  type Rect,
  clipRect,
  cloneCanvas,
  context2d,
  createCanvas,
  resizeCanvasArea,
  scaleCanvas,
} from "./canvas.ts";

type Floating = { canvas: HTMLCanvasElement; x: number; y: number };

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
    this.floating = { canvas, x, y };
    this.emit();
  }

  moveFloatingTo(x: number, y: number) {
    if (!this.floating || !this.selection) return;
    this.floating.x = x;
    this.floating.y = y;
    this.selection = { ...this.selection, x, y };
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
