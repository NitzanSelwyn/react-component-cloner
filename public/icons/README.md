# Extension Icons

This directory should contain the following icon files:

- `icon16.png` - 16x16 pixels (toolbar icon)
- `icon48.png` - 48x48 pixels (extension management page)
- `icon128.png` - 128x128 pixels (Chrome Web Store)

## Temporary Placeholders

For development, you can use the provided icon.svg as a base and convert it to PNG files at the required sizes.

## Icon Design Suggestions

The icon should represent:
- React (component/atom symbol)
- Cloning/copying (duplicate or copy symbol)
- Development tools aesthetic

Recommended colors:
- React blue (#61DAFB)
- Accent colors that work well with both light and dark themes

## Converting SVG to PNG

You can use online tools or command line:

```bash
# Using ImageMagick (if installed)
convert icon.svg -resize 16x16 icon16.png
convert icon.svg -resize 48x48 icon48.png
convert icon.svg -resize 128x128 icon128.png
```

Or use online converters like:
- https://cloudconvert.com/svg-to-png
- https://convertio.co/svg-png/
