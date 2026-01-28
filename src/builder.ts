import * as esbuild from 'esbuild';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { wrapInSVG } from './template.js';
import { FRAMEWORKS, type Framework } from './frameworks.js';
import { processHTMLFile, makeXMLCompliant } from './html-processor.js';

// Build the runtime once
async function buildRuntime(): Promise<string> {
  try {
    const runtimePath = resolve(process.cwd(), 'src/runtime/index.ts');
    const result = await esbuild.build({
      entryPoints: [runtimePath],
      bundle: true,
      write: false,
      format: 'iife',
      platform: 'browser',
      target: 'es2020',
      minify: true,
      keepNames: false,
    });

    if (result.outputFiles && result.outputFiles[0]) {
      return result.outputFiles[0].text;
    }
    return '';
  } catch (e) {
    console.warn('Failed to build runtime:', e);
    return '';
  }
}

export async function build(
  entryFile: string,
  outFile: string,
  framework: Framework = 'react'
): Promise<void> {
  console.log(`🚀 Starting build for (${framework}): ${entryFile}`);

  const config = FRAMEWORKS[framework];
  if (!config) {
    throw new Error(`Unsupported framework: ${framework}`);
  }

  // Load plugins if needed (Svelte/Vue)
  const plugins = config.plugins ? await config.plugins() : [];

  // Handle HTML files specially
  const isHTML = entryFile.toLowerCase().endsWith('.html');
  let htmlBodyContent: string | undefined;
  let inlineScripts: string[] = [];
  let inlineStyles: string[] = [];
  let entryPoints: string[] = [entryFile];

  if (isHTML && framework === 'vanilla') {
    const htmlData = processHTMLFile(entryFile);
    htmlBodyContent = htmlData.bodyContent;
    inlineScripts = htmlData.inlineScripts;
    inlineStyles = htmlData.inlineStyles;
    
    // Use scripts and styles as entry points instead of HTML
    entryPoints = [...htmlData.scripts, ...htmlData.styles];
    
    // If no external scripts/styles but we have body content or inline scripts,
    // we need to create a minimal entry point
    if (entryPoints.length === 0) {
      // Create a temporary JS file that will inject the HTML content
      const tempScript = `
        (function() {
          const root = document.getElementById('root');
          if (root) {
            root.innerHTML = ${JSON.stringify(htmlBodyContent || '')};
          }
        })();
      `;
      inlineScripts.push(tempScript);
      // Use a dummy entry point - we'll handle it in the output processing
      entryPoints = [];
    }
  }

  try {
    // Build the app
    const buildEntryPoints = entryPoints.length > 0 ? entryPoints : [entryFile];
    const hasMultipleEntries = buildEntryPoints.length > 1;
    
    const buildConfig: esbuild.BuildOptions = {
      entryPoints: buildEntryPoints,
      bundle: true,
      write: false, // Keep output in memory
      format: 'iife', // Immediately Invoked Function Expression
      platform: 'browser',
      target: 'es2020',
      minify: true,
      treeShaking: true,
      sourcemap: false,
      keepNames: false,
      legalComments: 'none', // Remove license comments that might interfere
      
      // Loader configuration for asset inlining
      loader: {
        ...config.loaders,
        '.png': 'dataurl',
        '.jpg': 'dataurl',
        '.jpeg': 'dataurl',
        '.gif': 'dataurl',
        '.svg': 'dataurl',
        '.webp': 'dataurl',
        '.woff': 'dataurl',
        '.woff2': 'dataurl',
        '.ttf': 'dataurl',
        '.eot': 'dataurl',
        '.css': 'css',
      },
      
      // Framework-specific main fields
      mainFields: config.mainFields || ['browser', 'module', 'main'],
      
      // Define production environment
      define: {
        'process.env.NODE_ENV': '"production"',
      },
      
      // Plugins for framework-specific compilation
      plugins: plugins.length > 0 ? plugins : undefined,

      // Alias 'sausvge/runtime' to the global window.SVGApp object
      // But since user imports types, we just want to ensure it resolves to a global access at runtime.
      // esbuild can't directly alias an import to a global variable easily without a plugin or shim.
      // However, if the user imports './src/runtime/client.ts' (which uses window.SVGApp), it will bundle that shim.
      // That shim is tiny and correct. So we just need to ensure the import PATH resolves correctly if they use 'sausvge/runtime'.
      // Since we are not running in a real node_modules context for the example app (it's inside the repo),
      // we might need to manually alias 'sausvge/runtime' to the source file if they use package import.
      // For now, in our examples we will import relatively.
      // If we wanted to support 'sausvge/runtime' import in the example, we could add alias:
      alias: {
        'sausvge/runtime': resolve(process.cwd(), 'src/runtime/client.ts')
      }
    };

    // Use outdir for multiple entries, outfile for single entry
    if (hasMultipleEntries) {
      buildConfig.outdir = 'dist-temp';
    } else {
      buildConfig.outfile = 'bundle.js'; // Virtual filename for output mapping (required for CSS)
    }

    // Run parallel builds: App and Runtime
    const [result, runtimeCode] = await Promise.all([
      esbuild.build(buildConfig),
      buildRuntime()
    ]);

    // Extract JavaScript and CSS from output
    let jsCode = '';
    let cssCode = '';

    if (result.outputFiles && result.outputFiles.length > 0) {
      for (const file of result.outputFiles) {
        const text = file.text;
        const path = file.path;
        
        if (path.endsWith('.css')) {
          cssCode += text;
        } else if (path.endsWith('.js')) {
          jsCode += text;
        } else {
          // For other outputs, assume JavaScript if not CSS
          if (!path.endsWith('.css')) {
            jsCode += text;
          }
        }
      }

      // If no JS code was extracted, try to get it from the first output
      if (!jsCode && result.outputFiles[0]) {
        jsCode = result.outputFiles[0].text;
      }
    }

    // Add inline scripts and styles from HTML
    if (inlineScripts.length > 0) {
      jsCode = inlineScripts.join('\n') + '\n' + jsCode;
    }
    if (inlineStyles.length > 0) {
      cssCode = inlineStyles.join('\n') + '\n' + cssCode;
    }

    let finalHtmlBody: string | undefined;
    
    if (isHTML && htmlBodyContent && htmlBodyContent.trim()) {
      // For HTML files: put body content directly in SVG body
      let cleanBody = htmlBodyContent.trim();
      // Remove root div wrapper if present
      cleanBody = cleanBody.replace(/<div[^>]*id=["']root["'][^>]*>(.*?)<\/div>/is, '$1');
      // Remove any script tags that reference external files (they're bundled now)
      cleanBody = cleanBody.replace(/<script[^>]*src=["'][^"']+["'][^>]*><\/script>/gi, '');
      // Make HTML XML-compliant (self-closing tags)
      finalHtmlBody = makeXMLCompliant(cleanBody);
    }

    // XML Safety: Escape </script> tags to prevent XML parser errors
    jsCode = jsCode.replace(/<\/script>/g, '<\\/script>');

    // For vanilla HTML apps, wrap code to ensure DOM is ready and initialize SVGApp
    const isVanillaHTML = isHTML && framework === 'vanilla';
    if (isVanillaHTML) {
      // Wrap the code to ensure it runs after DOM is ready and SVGApp is initialized
      jsCode = `(function() {
        if (typeof SVGApp !== 'undefined') {
          SVGApp.init();
        }
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', function() {
            ${jsCode}
          });
        } else {
          ${jsCode}
        }
      })();`;
    }

    // Pass the bundled runtime code to the template
    const svgContent = wrapInSVG(jsCode, cssCode, finalHtmlBody, runtimeCode);

    // Ensure output directory exists
    const outputDir = dirname(outFile);
    try {
      mkdirSync(outputDir, { recursive: true });
    } catch {
      // Directory might already exist, ignore
    }

    // Write to disk
    writeFileSync(outFile, svgContent, 'utf-8');

    // Stats
    const size = (svgContent.length / 1024).toFixed(2);
    console.log(`✅ Build successful!`);
    console.log(`   📄 Output: ${outFile}`);
    console.log(`   📦 Size:   ${size} KB`);

  } catch (err) {
    console.error('❌ Build failed:');
    if (err instanceof Error) {
      console.error(err.message);
      console.error(err.stack);
    } else {
      console.error(err);
    }
    process.exit(1);
  }
}
