---
name: readme-screenshot
description: Retake docs/screenshot.jpg, the README screenshot, from the running app.
disable-model-invocation: true
---

The screenshot shows the app in dark mode at 1470×802 (1x) with the skill's 1200×800 `sunset.png` open, a selection around the sun and the action bar showing. `shot.mjs` drives the user's installed Chrome headlessly through Playwright; the Chrome extension can't save screenshots to files.

1. Find the dev server: `lsof -iTCP -sTCP:LISTEN -n -P | grep node`, then match a port whose process cwd (`lsof -p <pid> | grep cwd`) is this repo. If none, start `pnpm dev` in the background and take the URL it prints.
2. In a new scratchpad directory, install the driver: `npm init -y && npm i playwright-core@1.48.2`.
3. Copy `shot.mjs` into that directory (Node resolves `playwright-core` from the script's folder) and run it:
   ```sh
   node shot.mjs <app url> <skill dir>/sunset.png <repo>/docs/screenshot.jpg
   ```
4. Read `docs/screenshot.jpg` and check it. Done when the toolbar, the "sunset" tab, the dashed selection with handles around the sun, the action bar and the status bar all show, with no tooltip or dialog over them. If the UI changed in a way the script no longer fits (a renamed Open button, a moved selection), fix `shot.mjs` and retake.
5. If the README's alt text for the screenshot no longer describes it, update it.
