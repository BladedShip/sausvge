#!/usr/bin/env bun

import { build } from '../src/builder.js';
import { detectFramework, type Framework } from '../src/frameworks.js';
import { resolve } from 'path';

const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.log(`
Usage: bun bin/cli.ts build <entry> [output] [options]

Commands:
  build <entry> [output]    Compile an app into a standalone SVG

Arguments:
  entry                     Path to the entry file (e.g., src/index.tsx)
  output                    Path to output SVG file (default: dist/app.svg)

Options:
  --framework <name>         Explicitly specify framework (react, svelte, vue, vanilla)
  --help, -h                 Show this help message

Examples:
  bun bin/cli.ts build example/react/index.tsx dist/react-app.svg
  bun bin/cli.ts build example/svelte/index.ts --framework svelte
  bun bin/cli.ts build example/vanilla/index.js dist/vanilla.svg

Or use npm scripts:
  bun run build:react
  bun run build:svelte
  bun run build:vue
  bun run build:vanilla
`);
  process.exit(0);
}

if (args[0] !== 'build') {
  console.error(`Unknown command: ${args[0]}`);
  console.error('Run "bun bin/cli.ts --help" for usage information.');
  process.exit(1);
}

const entryArg = args[1];
const outputArg = args[2];

if (!entryArg) {
  console.error('Error: Entry file is required');
  console.error('Run "bun bin/cli.ts --help" for usage information.');
  process.exit(1);
}

// Parse framework flag if present
let framework: Framework | undefined;
const frameworkIndex = args.indexOf('--framework');
if (frameworkIndex !== -1 && args[frameworkIndex + 1]) {
  const frameworkName = args[frameworkIndex + 1];
  if (['react', 'svelte', 'vue', 'vanilla'].includes(frameworkName)) {
    framework = frameworkName as Framework;
  } else {
    console.error(`Error: Invalid framework "${frameworkName}"`);
    console.error('Supported frameworks: react, svelte, vue, vanilla');
    process.exit(1);
  }
}

const entryPath = resolve(process.cwd(), entryArg);
const outputPath = outputArg
  ? resolve(process.cwd(), outputArg)
  : resolve(process.cwd(), 'dist/app.svg');

// Auto-detect framework if not specified
if (!framework) {
  framework = detectFramework(entryPath);
}

// Ensure output directory exists
const outputDir = resolve(outputPath, '..');
try {
  await Bun.$`mkdir -p ${outputDir}`.quiet();
} catch {
  // Directory might already exist, ignore
}

await build(entryPath, outputPath, framework);

