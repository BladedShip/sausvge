// Type definition for SVGApp global
declare const SVGApp: any;

const container = document.getElementById('root');

if (container) {
  container.innerHTML = `
    <style>
      .test-suite { padding: 20px; font-family: monospace; }
      .test-case { margin: 10px 0; padding: 10px; background: #eee; border-left: 4px solid #ccc; }
      .test-case.pass { border-left-color: #2ecc71; background: #e8f8f0; }
      .test-case.fail { border-left-color: #e74c3c; background: #fdedec; }
      .status { font-weight: bold; }
    </style>
    <div class="test-suite">
      <h1>SVGApp API Test Suite</h1>
      <div id="tests"></div>
    </div>
  `;

  const testsContainer = document.getElementById('tests')!;

  function runTest(name: string, fn: () => boolean | Promise<boolean>) {
    const el = document.createElement('div');
    el.className = 'test-case';
    el.innerHTML = `<div>Testing: ${name}</div><div class="status">Running...</div>`;
    testsContainer.appendChild(el);

    try {
      const result = fn();
      const handleResult = (success: boolean) => {
        el.className = `test-case ${success ? 'pass' : 'fail'}`;
        el.querySelector('.status')!.textContent = success ? 'PASS' : 'FAIL';
      };

      if (result instanceof Promise) {
        result.then(handleResult).catch(() => handleResult(false));
      } else {
        handleResult(result);
      }
    } catch (e) {
      console.error(e);
      el.className = 'test-case fail';
      el.querySelector('.status')!.textContent = 'ERROR';
    }
  }

  // Tests
  setTimeout(() => {
    runTest('SVGApp exists', () => typeof SVGApp !== 'undefined');

    runTest('SVGApp.storage operations', () => {
      const key = 'test_key';
      const val = { foo: 'bar', ts: Date.now() };

      SVGApp.storage.setItem(key, val);
      const retrieved = SVGApp.storage.getItem(key);

      if (JSON.stringify(retrieved) !== JSON.stringify(val)) return false;

      SVGApp.storage.removeItem(key);
      const afterDelete = SVGApp.storage.getItem(key);

      return afterDelete === undefined;
    });

    runTest('SVGApp.createSVGElement', () => {
      const circle = SVGApp.createSVGElement('circle', 'my-circle');
      return (
        circle instanceof Element &&
        circle.tagName === 'circle' &&
        circle.getAttribute('class') === 'my-circle'
      );
    });

    runTest('SVGApp.router basics', () => {
      const startHash = SVGApp.router.hash;
      const testHash = '#/test-route-' + Date.now();

      SVGApp.router.navigate(testHash);
      if (window.location.hash !== testHash) return false;

      // Cleanup
      SVGApp.router.navigate(startHash);
      return true;
    });
  }, 100);
}
