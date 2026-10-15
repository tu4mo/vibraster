# Vibraster

A small in-browser raster image editor built with React and [Mantine](https://mantine.dev).

- Open PNG, JPEG, WebP or GIF files (button, drag and drop, or paste)
- Rectangle selection with resize handles (Shift keeps the aspect ratio): fill with color, delete to transparency, move
- Resize the image (scale) or the canvas (crop / extend, new area filled with the background color)
- Undo / redo, zoom, save as PNG

## Shortcuts

| Key                        | Action                      |
| -------------------------- | --------------------------- |
| M / V / Z                  | Select / Move / Zoom tool   |
| Click, ⌥-click (Zoom tool) | Zoom in / out at that point |
| F                          | Fill selection              |
| Delete                     | Delete selection            |
| Esc, ⌘D                    | Deselect                    |
| ⌘A                         | Select all                  |
| X                          | Swap fill / background      |
| ⌘Z / ⇧⌘Z                   | Undo / redo                 |
| ⌘+ / ⌘− / ⌘0               | Zoom in / out / fit         |
| ⌘O / ⌘S                    | Open / save PNG             |

## Development

```sh
vp install
vp dev
vp check
```
