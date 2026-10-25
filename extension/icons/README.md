# Extension Icons

This directory should contain the following icon files:

- `icon16.png` — 16x16 toolbar icon
- `icon48.png` — 48x48 extension management icon
- `icon128.png` — 128x128 Chrome Web Store icon

## Generating Icons

You can create these from any square image using:

```bash
# Using ImageMagick
convert source.png -resize 16x16 icon16.png
convert source.png -resize 48x48 icon48.png
convert source.png -resize 128x128 icon128.png
```

Or use an online tool like https://favicon.io/extension-icon-generator/

## Design Suggestion

A chess knight or pawn silhouette in emerald green (#4ade80) on a dark background (#1a1a2e) works well for the chess theme.
