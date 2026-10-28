export type Rect = { x: number; y: number; w: number; h: number };

export const MAX_SIZE = 16384;

export function isValidSize(n: number) {
  return Number.isInteger(n) && n >= 1 && n <= MAX_SIZE;
}

export type Anchor = [col: 0 | 1 | 2, row: 0 | 1 | 2];

export function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

export function context2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas context unavailable");
  return ctx;
}

export function cloneCanvas(source: HTMLCanvasElement): HTMLCanvasElement {
  const copy = createCanvas(source.width, source.height);
  context2d(copy).drawImage(source, 0, 0);
  return copy;
}

/** A new image of the given size, filled with `color`, or transparent when null. */
export function createBlankImage(
  width: number,
  height: number,
  color: string | null,
): HTMLCanvasElement {
  const canvas = createCanvas(width, height);
  if (color) {
    const ctx = context2d(canvas);
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);
  }
  return canvas;
}

export async function loadImageFile(file: Blob): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(file);
  const canvas = createCanvas(bitmap.width, bitmap.height);
  context2d(canvas).drawImage(bitmap, 0, 0);
  bitmap.close();
  return canvas;
}

export function sameRect(a: Rect | null, b: Rect | null): boolean {
  if (!a || !b) return a === b;
  return a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h;
}

/** Encode a canvas as PNG. */
export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("PNG encoding failed"))), "image/png"),
  );
}

/** Intersect a rect with the image bounds. Returns null when nothing remains. */
export function clipRect(rect: Rect, width: number, height: number): Rect | null {
  const x1 = Math.max(0, rect.x);
  const y1 = Math.max(0, rect.y);
  const x2 = Math.min(width, rect.x + rect.w);
  const y2 = Math.min(height, rect.y + rect.h);
  if (x2 <= x1 || y2 <= y1) return null;
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
}

/** Copy the pixels under `rect` into a new canvas of its size. */
export function cropCanvas(source: HTMLCanvasElement, rect: Rect): HTMLCanvasElement {
  const out = createCanvas(rect.w, rect.h);
  context2d(out).drawImage(source, -rect.x, -rect.y);
  return out;
}

/**
 * Scale an image to a new size. Large downscales are done in halving steps,
 * which avoids the aliasing a single drawImage call produces.
 */
export function scaleCanvas(
  source: HTMLCanvasElement,
  width: number,
  height: number,
): HTMLCanvasElement {
  let current = source;
  while (current.width / 2 >= width && current.height / 2 >= height) {
    const half = createCanvas(Math.floor(current.width / 2), Math.floor(current.height / 2));
    const ctx = context2d(half);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(current, 0, 0, half.width, half.height);
    current = half;
  }
  const out = createCanvas(width, height);
  const ctx = context2d(out);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(current, 0, 0, width, height);
  return out;
}

/**
 * Change the canvas size without scaling the image. The image is placed
 * according to the anchor; new area is filled with `background` (or left
 * transparent when it is null).
 */
export function resizeCanvasArea(
  source: HTMLCanvasElement,
  width: number,
  height: number,
  anchor: Anchor,
  background: string | null,
): HTMLCanvasElement {
  const out = createCanvas(width, height);
  const ctx = context2d(out);
  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);
  }
  const dx = Math.round(((width - source.width) * anchor[0]) / 2);
  const dy = Math.round(((height - source.height) * anchor[1]) / 2);
  // Clear where the image goes so its transparent pixels stay transparent.
  ctx.clearRect(dx, dy, source.width, source.height);
  ctx.drawImage(source, dx, dy);
  return out;
}
