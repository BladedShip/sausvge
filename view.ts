#!/usr/bin/env bun

import { readFileSync } from 'fs';
import { resolve } from 'path';

const svgPath = process.argv[2] || 'dist/app.svg';
const fullPath = resolve(process.cwd(), svgPath);

try {
  const svgContent = readFileSync(fullPath, 'utf-8');
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sausvge Viewer</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
    }
    svg {
      width: 100%;
      height: 100%;
    }
  </style>
</head>
<body>
  ${svgContent}
</body>
</html>`;

  // Try to find an available port starting from 3000
  let port = 3000;
  let server: ReturnType<typeof Bun.serve> | null = null;
  const maxPort = 3100; // Safety limit
  const startPort = port;

  while (port <= maxPort) {
    try {
      server = Bun.serve({
        port: port,
        fetch(req) {
          if (req.url.endsWith('/')) {
            return new Response(html, {
              headers: { 'Content-Type': 'text/html' },
            });
          }
          return new Response('Not Found', { status: 404 });
        },
        development: {
          hmr: true,
        },
      });
      break; // Successfully started server
    } catch (error) {
      // Port is likely in use, try next port
      const currentPort = port;
      port++;
      if (port > maxPort) {
        console.error(`❌ Error: Could not find an available port (tried ${startPort}-${maxPort})`);
        if (error instanceof Error) {
          console.error(`   Last error: ${error.message}`);
        }
        process.exit(1);
      }
      // Only log if we're not on the first attempt
      if (currentPort > startPort) {
        console.log(`   Port ${currentPort} in use, trying ${port}...`);
      }
    }
  }

  if (!server) {
    console.error(`❌ Error: Failed to start server`);
    process.exit(1);
  }

  // Show message if we used a different port than 3000
  if (port !== startPort) {
    console.log(`   (Port ${startPort} was in use, using port ${port} instead)`);
  }

  console.log(`🌐 Server running at http://localhost:${port}`);
  console.log(`📄 Viewing: ${fullPath}`);
  console.log(`🔄 HMR enabled - file will reload on changes`);
} catch (error) {
  console.error(`❌ Error: Could not read file ${fullPath}`);
  if (error instanceof Error) {
    console.error(error.message);
  }
  process.exit(1);
}

