// Opens the sunset in the running app, selects the sun and saves the README screenshot.
// Usage: node shot.mjs <app url> <sunset.png> <out.jpg>
import { chromium } from "playwright-core";

const [url, sunset, out] = process.argv.slice(2);
const browser = await chromium.launch({ channel: "chrome" });
const page = await browser.newPage({
  viewport: { width: 1470, height: 802 },
  colorScheme: "dark",
  deviceScaleFactor: 1,
});
await page.goto(url);

const chooser = page.waitForEvent("filechooser");
await page.getByRole("button", { name: "Open" }).click();
await (await chooser).setFiles(sunset);
const canvas = page.locator("canvas").first();
await canvas.waitFor();
await page.waitForTimeout(500);

// Drag a selection around the sun (center 780,430, radius 86, in image pixels).
const box = await canvas.boundingBox();
const s = box.width / 1200;
await page.mouse.move(box.x + 680 * s, box.y + 330 * s);
await page.mouse.down();
await page.mouse.move(box.x + 876 * s, box.y + 522 * s, { steps: 10 });
await page.mouse.up();
// Park the pointer on the image so no tooltip shows.
await page.mouse.move(box.x + 100, box.y + 100);
await page.waitForTimeout(500);

await page.screenshot({ path: out, type: "jpeg", quality: 85 });
await browser.close();
