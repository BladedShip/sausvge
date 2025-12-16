# Sausvge - WIP

> **Sausvge** (pronounced "sausage") - Because sometimes you just need to stuff your website into a single SVG file and make it work somehow.

A framework-agnostic compiler that bundles React, Svelte, Vue, or vanilla JavaScript applications into standalone, interactive SVG files. Everything (JavaScript, CSS, images, fonts) is inlined into a single SVG file that can be opened directly in any browser.

## Features

- 🎨 **Framework Agnostic**: Supports React, Svelte, Vue, and vanilla HTML/CSS/JS
- 📦 **Single File Output**: All assets (JS, CSS, images, fonts) are inlined as Base64
- ⚡ **Fast Bundling**: Uses Bun's native bundler for lightning-fast compilation
- 🔒 **XML Safe**: Automatically handles XML compatibility (CDATA wrapping, script tag escaping)
- 🎯 **Zero Configuration**: Auto-detects framework from file extensions
- 🔥 **HMR Support**: Hot module reloading for development

## Installation

```bash
bun install
```

For framework-specific plugins (optional, for Svelte/Vue support):
```bash
bun add -d esbuild-svelte esbuild-vue
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

**Examples:**
```bash
# Auto-detect framework from file extension
bun bin/cli.ts build example/react/index.tsx dist/react-app.svg

# Explicitly specify framework
bun bin/cli.ts build example/svelte/index.ts --framework svelte

# Use default output path
bun bin/cli.ts build example/vanilla/index.js
```

### Framework Auto-Detection

The compiler automatically detects the framework based on file extension:
- `.tsx`, `.jsx` → React
- `.svelte` → Svelte
- `.vue` → Vue
- `.html` → Vanilla (HTML entry point)
- `.js`, `.ts` → Vanilla (JavaScript entry point, default)

You can override with the `--framework` flag.

## NPM Scripts

### Build Commands

```bash
# Build individual examples
bun run build:react      # Build React example
bun run build:svelte      # Build Svelte example
bun run build:vue         # Build Vue example
bun run build:vanilla     # Build Vanilla example

# Build all examples
bun run build:all
```

### View Commands (with HMR)

```bash
# View individual examples with hot reload
bun run view:react        # View React app at http://localhost:3000
bun run view:svelte       # View Svelte app
bun run view:vue          # View Vue app
bun run view:vanilla      # View Vanilla app
```

### Development Commands

```bash
# Build and view in one command (with HMR)
bun run dev:react         # Build React app and start HMR server
bun run dev:svelte        # Build Svelte app and start HMR server
bun run dev:vue           # Build Vue app and start HMR server
bun run dev:vanilla       # Build Vanilla app and start HMR server
```

## Framework-Specific Setup

### React

Your entry point should use React 18's `createRoot` API:

```tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
```

### Svelte

Your entry point should instantiate the Svelte component:

```ts
import App from './App.svelte';

const container = document.getElementById('root');
if (container) {
  new App({
    target: container,
  });
}
```

**Note:** Install `esbuild-svelte` for Svelte support:
```bash
bun add -d esbuild-svelte
```

### Vue

Your entry point should use Vue's `createApp` API:

```ts
import { createApp } from 'vue';
import App from './App.vue';
import './styles.css';

const container = document.getElementById('root');
if (container) {
  const app = createApp(App);
  app.mount(container);
}
```

**Note:** Install `esbuild-vue` for Vue support:
```bash
bun add -d esbuild-vue
```

### Vanilla JavaScript

You can use either a JavaScript file or an HTML file as the entry point.

**JavaScript Entry Point:**

Your entry point should target the `#root` element:

```js
import './styles.css';

const container = document.getElementById('root');
if (container) {
  // Your app code here
  container.innerHTML = '<h1>Hello World</h1>';
}
```

**HTML Entry Point:**

You can also use an HTML file directly. The compiler will extract scripts, styles, and body content:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>My App</title>
  <link rel="stylesheet" href="./styles.css">
</head>
<body>
  <div class="app-container">
    <h1>Hello World</h1>
    <button id="my-button">Click me</button>
  </div>
  <script src="./app.js"></script>
</body>
</html>
```

The HTML body content will be automatically injected into the `#root` element in the SVG. External scripts and stylesheets will be bundled automatically.

## How It Works

1. **Bundling**: Uses Bun's native bundler to bundle your app and all dependencies
2. **Asset Inlining**: Converts images, fonts, and other assets to Base64 data URLs
3. **XML Safety**: Escapes problematic characters and wraps JavaScript in CDATA sections
4. **SVG Wrapping**: Wraps everything in an SVG `foreignObject` element with HTML structure
5. **Output**: Generates a single, standalone SVG file

## Technical Details

### Asset Inlining

All assets are automatically converted to Base64 data URLs:
- Images: `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.webp`
- Fonts: `.woff`, `.woff2`, `.ttf`, `.eot`

### XML Compatibility

The compiler handles XML compatibility automatically:
- Escapes `</script>` tags in JavaScript: `</script>` → `<\\/script>`
- Wraps JavaScript in CDATA comments for XML parsers
- Ensures CSS doesn't contain XML-problematic characters

### SVG Structure

The output SVG uses this structure:
```xml
<svg xmlns="http://www.w3.org/2000/svg">
  <foreignObject>
    <html>
      <head>
        <style>/* Your CSS */</style>
      </head>
      <body>
        <div id="root"></div>
        <script>
          /* <![CDATA[ */
          /* Your JavaScript */
          /* ]]> */
        </script>
      </body>
    </html>
  </foreignObject>
</svg>
```

## Examples

See the `example/` directory for complete examples:
- `example/react/` - React app with TypeScript and CSS
- `example/svelte/` - Svelte component with scoped styles
- `example/vue/` - Vue Single File Component
- `example/vanilla/` - Vanilla JavaScript with CSS

## Limitations

- **File Size**: Since everything is inlined, SVG files can grow large with complex apps
- **Routing**: Use `HashRouter` or `MemoryRouter` instead of `BrowserRouter` (no URL bar in SVG)
- **External Resources**: All resources must be bundled (no external CDN links)
- **Browser Support**: Requires modern browsers that support SVG `foreignObject`

## License

MIT
