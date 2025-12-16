/**
 * Wraps JavaScript and CSS code in a valid SVG structure with foreignObject.
 * Uses CDATA sections to ensure XML compatibility.
 * 
 * @param js - JavaScript code (can be multiple script blocks separated by special marker)
 * @param css - CSS code
 * @param htmlBody - HTML body content (if provided, inserted directly; otherwise uses root div)
 * @param includeStorage - Whether to include SVGApp storage utility (for vanilla apps)
 */
export function wrapInSVG(js: string, css: string, htmlBody?: string, includeStorage: boolean = false): string {
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
  
  // Build script tags
  const scripts = scriptBlocks.map(script => 
    `        <script><![CDATA[\n          ${script.trim()}\n        ]]></script>`
  ).join('\n');
  
  // SVGApp storage utility (for vanilla apps)
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
            const history = lsData.history || svgData.history || [];
            return { ...svgData, ...lsData, history };
        }
        function _writeToLocalStorage(obj) {
            localStorage.setItem(_getStorageDataId(), JSON.stringify(obj));
        }
        function saveData(obj) {
            _writeToLocalStorage(obj);
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
        ${bodyContent}
${storageScript}${scripts}
      </body>
    </html>
  </foreignObject>
</svg>`;
}

