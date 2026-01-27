// src/runtime/index.ts

// Define the global interface for SVGApp
declare global {
  interface Window {
    SVGApp: SVGAppAPI;
  }
  var SVGApp: SVGAppAPI;
}

export interface SVGAppAPI {
  loadData: () => any;
  saveData: (data: any) => void;
  init: () => void;
  createSVGElement: (tag: string, className?: string) => Element;
  storage: {
    getItem: (key: string) => any;
    setItem: (key: string, value: any) => void;
    removeItem: (key: string) => void;
    clear: () => void;
  };
  router: {
    hash: string;
    navigate: (hash: string) => void;
    subscribe: (callback: (hash: string) => void) => () => void;
  };
}

const DATA_ID_ROOT = "dataStore";
let svgRef: Element | null = null;

function getSvgFileName(): string {
  try {
    const path = window.location.pathname;
    const name = path.split('/').pop();
    return name || 'app.svg';
  } catch (e) {
    return 'app.svg';
  }
}

function getStorageDataId(): string {
  return `${DATA_ID_ROOT}_${getSvgFileName()}`;
}

// Storage Implementation
const storage = {
  getItem: (key: string): any => {
    try {
      const store = JSON.parse(localStorage.getItem(getStorageDataId()) || '{}');
      return store[key];
    } catch {
      return undefined;
    }
  },
  setItem: (key: string, value: any): void => {
    try {
      const id = getStorageDataId();
      const store = JSON.parse(localStorage.getItem(id) || '{}');
      store[key] = value;
      localStorage.setItem(id, JSON.stringify(store));
    } catch (e) {
      console.warn('SVGApp: Failed to write to localStorage', e);
    }
  },
  removeItem: (key: string): void => {
    try {
      const id = getStorageDataId();
      const store = JSON.parse(localStorage.getItem(id) || '{}');
      delete store[key];
      localStorage.setItem(id, JSON.stringify(store));
    } catch (e) {}
  },
  clear: (): void => {
    try {
      localStorage.removeItem(getStorageDataId());
    } catch (e) {}
  }
};

// Legacy Data Methods (kept for backward compatibility with initial plan)
function _readFromSVG(): any {
  const elem = document.getElementById(DATA_ID_ROOT);
  if (!elem) return {};
  try {
    return JSON.parse(elem.textContent || '{}');
  } catch {
    return {};
  }
}

function loadData(): any {
  const svgData = _readFromSVG();
  const lsData = JSON.parse(localStorage.getItem(getStorageDataId()) || '{}');
  return { ...svgData, ...lsData };
}

function saveData(obj: any): void {
  try {
    localStorage.setItem(getStorageDataId(), JSON.stringify(obj));
  } catch (e) {
    console.warn('SVGApp: Failed to saveData', e);
  }
}

// Router Implementation (Hash based)
const routerListeners: Set<(hash: string) => void> = new Set();

const router = {
  get hash() {
    return window.location.hash || '#/';
  },
  navigate(hash: string) {
    window.location.hash = hash;
  },
  subscribe(callback: (hash: string) => void) {
    routerListeners.add(callback);
    return () => routerListeners.delete(callback);
  }
};

window.addEventListener('hashchange', () => {
  routerListeners.forEach(cb => cb(window.location.hash));
});

// DOM Helpers
function createSVGElement(tag: string, className?: string): Element {
  const XHTML_NS = "http://www.w3.org/1999/xhtml";
  // In foreignObject, we are in XHTML namespace usually, but if we want SVG specifically:
  // If tag is standard HTML, use XHTML ns. If SVG, use SVG ns.
  // However, the original code used XHTML_NS for divs.
  // Let's infer:
  const SVG_NS = "http://www.w3.org/2000/svg";
  const isSvgTag = ['svg', 'path', 'circle', 'rect', 'g'].includes(tag.toLowerCase());

  const elem = document.createElementNS(isSvgTag ? SVG_NS : XHTML_NS, tag);
  if (className) elem.setAttribute("class", className);
  return elem;
}

function init() {
  svgRef = document.getElementById('svgApp');
  if (svgRef) {
    svgRef.setAttribute("width", "100%");
    svgRef.setAttribute("height", "100%");
    if (svgRef.hasAttribute("viewBox")) {
      svgRef.removeAttribute("viewBox");
    }
  }
  console.log('SVGApp Initialized');
}

// Export the API
const API: SVGAppAPI = {
  loadData,
  saveData,
  init,
  createSVGElement,
  storage,
  router
};

// Assign to window
window.SVGApp = API;

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export default API;
