# Sausvge - WIP

> **Sausvge** (pronounced "sausage") - Because sometimes you just need to stuff your website into a single SVG file and make it work somehow.

A framework-agnostic compiler that bundles React, Svelte, Vue, or vanilla JavaScript applications into standalone, interactive SVG files. Everything (JavaScript, CSS, images, fonts) is inlined into a single SVG file that can be opened directly in any browser.

## Features

- 🎨 **Framework Agnostic**: Supports React, Svelte, Vue, and vanilla HTML/CSS/JS
- 📦 **Single File Output**: All assets (JS, CSS, images, fonts) are inlined as Base64
- ⚡ **Fast Bundling**: Uses Bun's native bundler + esbuild for robust compilation
- 🔒 **XML Safe**: Automatically handles XML compatibility (CDATA wrapping, script tag escaping)
- 🎯 **Zero Configuration**: Auto-detects framework from file extensions
- 🔥 **HMR Support**: Hot module reloading for development
- 🛠️ **Built-in Runtime**: Includes `SVGApp` global API for storage, routing, and DOM helpers

## Installation

```bash
bun install
```

## Quick Start

### Build a React App

```bash
bun bin/cli.ts build example/react/index.tsx dist/react-app.svg
```

Or use the npm script:
```bash
bun run build:react
```

### Build a Svelte App

```bash
bun bin/cli.ts build example/svelte/index.ts dist/svelte-app.svg
```

Or use the npm script:
```bash
bun run build:svelte
```

### Build a Vue App

```bash
bun bin/cli.ts build example/vue/index.ts dist/vue-app.svg
```

Or use the npm script:
```bash
bun run build:vue
```

### Build a Vanilla JS App

```bash
bun bin/cli.ts build example/vanilla/index.js dist/vanilla-app.svg
```

Or use the npm script:
```bash
bun run build:vanilla
```

## SVGApp Runtime API

Sausvge injects a global `SVGApp` object to replace browser primitives that might be restricted or awkward in an SVG context.

### Storage
Persistent storage that scopes data to the specific SVG file (to avoid collisions between multiple SVG apps on the same domain).

```typescript
// Save data
SVGApp.storage.setItem('my-key', { foo: 'bar' });

// Load data
const data = SVGApp.storage.getItem('my-key');

// Remove data
SVGApp.storage.removeItem('my-key');
```

### Routing
A simple hash-based router helper.

```typescript
// Navigate
SVGApp.router.navigate('#/settings');

// Listen for changes
SVGApp.router.subscribe((hash) => {
  console.log('Navigated to:', hash);
});
```

### DOM Helpers
Helper to create elements with the correct namespace (vital for mixing HTML and SVG within `foreignObject`).

```typescript
// Create an SVG element
const circle = SVGApp.createSVGElement('circle', 'my-class');

// Create an XHTML element (standard HTML div)
const div = SVGApp.createSVGElement('div', 'container');
// Note: standard document.createElement works for HTML inside foreignObject usually,
// but this helper ensures correct namespace handling if needed.
```

## Usage

### CLI Command

```bash
bun bin/cli.ts build <entry> [output] [options]
```

**Arguments:**
- `entry` - Path to the entry file (required)
- `output` - Path to output SVG file (optional, defaults to `dist/app.svg`)

**Options:**
- `--framework <name>` - Explicitly specify framework: `react`, `svelte`, `vue`, or `vanilla`
- `--help`, `-h` - Show help message

### Framework Auto-Detection

The compiler automatically detects the framework based on file extension and content:
- `.tsx`, `.jsx`, or imports `react` → React
- `.svelte` → Svelte
- `.vue` → Vue
- `.html` → Vanilla (HTML entry point)
- `.js`, `.ts` → Vanilla (JavaScript entry point, default)

You can override with the `--framework` flag.

## Technical Details

### Asset Inlining

All assets are automatically converted to Base64 data URLs:
- Images: `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.webp`
- Fonts: `.woff`, `.woff2`, `.ttf`, `.eot`

### XML Compatibility

The compiler handles XML compatibility automatically:
- Escapes `</script>` tags in JavaScript
- Wraps JavaScript in CDATA comments for XML parsers
- Ensures CSS doesn't contain XML-problematic characters

### Error Overlay

A runtime error overlay is automatically injected. If your app crashes (e.g., "React is not defined" or a syntax error), a visible error message will appear within the SVG rendering area, making debugging much easier than checking the browser console blindly.

## Limitations

- **File Size**: Since everything is inlined, SVG files can grow large with complex apps
- **Routing**: Use `HashRouter` or `MemoryRouter` instead of `BrowserRouter` (no URL bar in SVG)
- **External Resources**: All resources must be bundled (no external CDN links)
- **Browser Support**: Requires modern browsers that support SVG `foreignObject`

## License

MIT
