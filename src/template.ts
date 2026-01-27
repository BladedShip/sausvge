/**
 * Wraps JavaScript and CSS code in a valid SVG structure with foreignObject.
 * Uses CDATA sections to ensure XML compatibility.
 * 
 * @param js - JavaScript code (can be multiple script blocks separated by special marker)
 * @param css - CSS code
 * @param htmlBody - HTML body content (if provided, inserted directly; otherwise uses root div)
 * @param runtimeCode - The bundled code for the SVGApp runtime
 */
export function wrapInSVG(js: string, css: string, htmlBody?: string, runtimeCode: string = ''): string {
  // Split JS into multiple script blocks if needed (separated by <!--SCRIPT_SEPARATOR-->)
  const scriptBlocks = js.split('<!--SCRIPT_SEPARATOR-->').filter(s => s.trim());
  
  // Build body content
  let bodyContent = '';
  if (htmlBody) {
    // For HTML files: put content directly in body
    bodyContent = htmlBody;
  } else {
    // For JS/React files: use root div
    bodyContent = '<div id="root"></div>';
  }
  
  // Error Overlay HTML
  const errorOverlayHTML = `
    <div id="error-overlay" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(50,0,0,0.9); color: white; padding: 20px; z-index: 9999; overflow: auto; font-family: monospace;">
      <h2 style="color: #ff5555; margin-top: 0;">Runtime Error</h2>
      <pre id="error-message" style="white-space: pre-wrap; font-size: 14px; background: rgba(0,0,0,0.5); padding: 10px; border-radius: 4px;"></pre>
      <button onclick="document.getElementById('error-overlay').style.display='none'" style="margin-top: 20px; padding: 8px 16px; cursor: pointer; background: #fff; border: none; border-radius: 4px; font-weight: bold;">Close</button>
    </div>
  `;

  // Error Handler Script
  const errorHandlerScript = `
    <script><![CDATA[
      window.addEventListener('error', function(event) {
        const overlay = document.getElementById('error-overlay');
        const msg = document.getElementById('error-message');
        if (overlay && msg) {
          msg.textContent = event.error ? (event.error.stack || event.error.message) : event.message;
          overlay.style.display = 'block';
          console.error('SVGApp Error:', event.error || event.message);
        }
      });
      window.addEventListener('unhandledrejection', function(event) {
        const overlay = document.getElementById('error-overlay');
        const msg = document.getElementById('error-message');
        if (overlay && msg) {
          msg.textContent = 'Unhandled Promise Rejection: ' + (event.reason ? (event.reason.stack || event.reason) : 'Unknown reason');
          overlay.style.display = 'block';
          console.error('SVGApp Unhandled Rejection:', event.reason);
        }
      });
    ]]></script>
  `;

  // Build script tags
  const scripts = scriptBlocks.map(script => 
    `        <script><![CDATA[\n          ${script.trim()}\n        ]]></script>`
  ).join('\n');
  
  // SVGApp storage utility
  const storageScript = runtimeCode ? `
    <script type="application/json" id="dataStore">{}</script>
    <script><![CDATA[
${runtimeCode}
    ]]></script>` : '';
  
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="100%" height="100%" id="svgApp">
  <foreignObject width="100%" height="100%">
    <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <style><![CDATA[
          * {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
              'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
              sans-serif;
            box-sizing: border-box;
          }
          body, html {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            background-color: transparent;
          }
          #root {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
          }
          ${css}
        ]]></style>
      </head>
      <body>
        ${errorOverlayHTML}
        ${bodyContent}
${storageScript}
${errorHandlerScript}
${scripts}
      </body>
    </html>
  </foreignObject>
</svg>`;
}
