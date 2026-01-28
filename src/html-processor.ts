import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';

/**
 * Converts HTML to XML-compliant format.
 * In XML (SVG):
 * 1. Self-closing tags like <input>, <img>, <br> must be self-closing: <input />
 * 2. All attributes must have values (data attributes need values)
 */
export function makeXMLCompliant(html: string): string {
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

/**
 * Processes an HTML file to extract scripts, styles, and body content
 */
export function processHTMLFile(htmlPath: string): {
  scripts: string[];
  styles: string[];
  bodyContent: string;
  inlineScripts: string[];
  inlineStyles: string[];
} {
  const htmlContent = readFileSync(htmlPath, 'utf-8');
  const htmlDir = dirname(htmlPath);
  
  const scripts: string[] = [];
  const styles: string[] = [];
  const inlineScripts: string[] = [];
  const inlineStyles: string[] = [];
  let bodyContent = '';

  // Extract script tags
  const scriptRegex = /<script[^>]*>(.*?)<\/script>/gis;
  let match;
  while ((match = scriptRegex.exec(htmlContent)) !== null) {
    const fullTag = match[0];
    const content = match[1].trim();
    
    // Check if it's an external script
    const srcMatch = fullTag.match(/src=["']([^"']+)["']/i);
    if (srcMatch) {
      const srcPath = resolve(htmlDir, srcMatch[1]);
      scripts.push(srcPath);
    } else if (content) {
      // Inline script
      inlineScripts.push(content);
    }
  }

  // Extract style tags and link tags
  const styleRegex = /<style[^>]*>(.*?)<\/style>/gis;
  while ((match = styleRegex.exec(htmlContent)) !== null) {
    const content = match[1].trim();
    if (content) {
      inlineStyles.push(content);
    }
  }

  // Extract link tags for CSS
  const linkRegex = /<link[^>]*href=["']([^"']+)["'][^>]*>/gi;
  while ((match = linkRegex.exec(htmlContent)) !== null) {
    const href = match[1];
    if (href.endsWith('.css')) {
      const cssPath = resolve(htmlDir, href);
      styles.push(cssPath);
    }
  }

  // Extract body content
  const bodyMatch = htmlContent.match(/<body[^>]*>(.*?)<\/body>/is);
  if (bodyMatch) {
    bodyContent = bodyMatch[1].trim();
  } else {
    // If no body tag, try to extract content between body tags or use entire content
    const bodyContentMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyContentMatch) {
      bodyContent = bodyContentMatch[1].trim();
    }
  }

  return {
    scripts,
    styles,
    bodyContent,
    inlineScripts,
    inlineStyles,
  };
}
