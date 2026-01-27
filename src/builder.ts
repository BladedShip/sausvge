import * as esbuild from 'esbuild';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { wrapInSVG } from './template.js';
import { FRAMEWORKS, type Framework } from './frameworks.js';
import { processHTMLFile } from './html-processor.js';

/**
 * Converts HTML to XML-compliant format.
 * In XML (SVG):
 * 1. Self-closing tags like <input>, <img>, <br> must be self-closing: <input />
 * 2. All attributes must have values (data attributes need values)
 */
function makeXMLCompliant(html: string): string {
  // List of self-closing HTML tags that need to be XML-compliant
  const selfClosingTags = [
    'input', 'img', 'br', 'hr', 'meta', 'link', 'area', 'base',
    'col', 'embed', 'source', 'track', 'wbr'
  ];
  
  let result = html;
  
  // For each self-closing tag, replace <tag ...> with <tag ... />
  for (const tag of selfClosingTags) {
    const regex = new RegExp(`<${tag}([^>]*?)(?<!/)>`, 'gi');
    result = result.replace(regex, (match, attributes) => {
      if (match.trim().endsWith('/>')) {
        return match;
      }
      return `<${tag}${attributes} />`;
    });
  }
  
  // Ensure all data attributes have values (XML requirement)
  // Process each tag to handle data attributes
  result = result.replace(/<(\w+)([^>]*?)>/g, (match, tagName, attributes) => {
    // Process data attributes: ensure they all have values (empty string if no value provided)
    // Match data attributes that don't have a value (not followed by =)
    let processedAttributes = attributes.replace(/\s+data-([a-zA-Z0-9-]+)(?=\s|>|\/|$)/g, (dataMatch: string, attrName: string) => {
      // This matches data attributes without values, so add empty string
      return ` data-${attrName}=""`;
    });
    
    return `<${tagName}${processedAttributes}>`;
  });
  
  return result;
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
    // Use esbuild API
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
    };

    // Use outdir for multiple entries, outfile for single entry
    if (hasMultipleEntries) {
      buildConfig.outdir = 'dist-temp';
    } else {
      buildConfig.outfile = 'bundle.js'; // Virtual filename for output mapping (required for CSS)
    }

    const result = await esbuild.build(buildConfig);

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

    // Always include storage (SVGApp) for all frameworks
    const svgContent = wrapInSVG(jsCode, cssCode, finalHtmlBody, true);

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
