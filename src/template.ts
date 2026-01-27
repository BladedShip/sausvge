/**
 * Wraps JavaScript and CSS code in a valid SVG structure with foreignObject.
 * Uses CDATA sections to ensure XML compatibility.
 * 
 * @param js - JavaScript code (can be multiple script blocks separated by special marker)
 * @param css - CSS code
 * @param htmlBody - HTML body content (if provided, inserted directly; otherwise uses root div)
 * @param includeStorage - Whether to include SVGApp storage utility (defaults to true now)
 */
export function wrapInSVG(js: string, css: string, htmlBody?: string, includeStorage: boolean = true): string {
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
  const storageScript = includeStorage ? `
    <script type="application/json" id="dataStore">{}</script>
    <script><![CDATA[
    window.SVGApp = (function () {
        const DATA_ID_ROOT = "dataStore";
        const svgRef = document.getElementById('svgApp');

        function _getSvgFileName() {
            try {
                const path = window.location.pathname;
                const name = path.split('/').pop();
                return name || 'app.svg';
            } catch (e) { return 'app.svg'; }
        }

        function _getStorageDataId() {
            return \`\${DATA_ID_ROOT}_\${_getSvgFileName()}\`;
        }

        function _readFromSVG() {
            const elem = document.getElementById(DATA_ID_ROOT);
            if (!elem) return {};
            try { return JSON.parse(elem.textContent); } catch { return {}; }
        }

        function _readFromLocalStorage() {
            try { return JSON.parse(localStorage.getItem(_getStorageDataId())) || {}; }
            catch { return {}; }
        }

        function loadData() {
            const svgData = _readFromSVG();
            const lsData = _readFromLocalStorage();
            // Merge strategies can be complex, here we prioritize localStorage but preserve history if any
            return { ...svgData, ...lsData };
        }

        function _writeToLocalStorage(obj) {
            try {
                localStorage.setItem(_getStorageDataId(), JSON.stringify(obj));
            } catch (e) {
                console.warn('SVGApp: Failed to write to localStorage', e);
            }
        }

        function saveData(obj) {
            _writeToLocalStorage(obj);
            // Note: We cannot write back to the SVG file itself from within the browser
            // without a backend or user downloading a new file.
        }

        function init() {
            if (svgRef) {
                svgRef.setAttribute("width", "100%");
                svgRef.setAttribute("height", "100%");
                if(svgRef.hasAttribute("viewBox")) {
                    svgRef.removeAttribute("viewBox");
                }
            }
        }

        function createSVGElement(tag, className) {
             const XHTML_NS = "http://www.w3.org/1999/xhtml";
             const elem = document.createElementNS(XHTML_NS, tag);
             if(className) elem.setAttribute("class", className);
             return elem;
        }

        return { loadData, saveData, init, createSVGElement };
    })();

    // Auto-init
    if (typeof window !== 'undefined') {
        window.addEventListener('DOMContentLoaded', () => {
             if (window.SVGApp) window.SVGApp.init();
        });
    }
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
